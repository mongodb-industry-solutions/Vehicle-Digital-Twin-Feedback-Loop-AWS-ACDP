from constructs import Construct
from aws_cdk import (
    RemovalPolicy,
    aws_events as aws_events,
    aws_events_targets as aws_events_targets,
    aws_lambda as _lambda,
    Stack,
    aws_iam as iam,
    Duration,
    CfnOutput,
    Tags,
    App,
    aws_secretsmanager as secretsmanager,
    SecretValue as SecretValue
)
import os
import json
from parameters.global_args import GlobalArgs
from dotenv import find_dotenv, load_dotenv
    

env_name = "dev"
secretname = "CMS_ATLAS_URL"



# Create a new lambda function pull_from_mdb
class LambdaStack(Stack):
    dotenv_path = find_dotenv();
    load_dotenv("parameters/.env");
    
    trigger_id = os.getenv("TRIGGER_ID")

    def __init__(self, scope: Construct, construct_id: str, atlas_uri : str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)


        

        # Create a new secret in Secrets Manager and fetch the ARN

        mySecret = secretsmanager.Secret(self, "Secret", secret_name = secretname, secret_string_value = SecretValue.unsafe_plain_text(atlas_uri))

        secretarn = mySecret.secret_arn
        
        generated_name = mySecret.secret_name

        # Define the IAM role with an assume role policy document
        connected_vehicle_role = iam.Role(
            self, "cdk_connected_vehicle_atlas_to_sagemaker_role",
            assumed_by=iam.CompositePrincipal(
                iam.ServicePrincipal("lambda.amazonaws.com"),
                iam.ServicePrincipal("sagemaker.amazonaws.com"),
                iam.ServicePrincipal("events.amazonaws.com")
            ),
            role_name="cdk_connected_vehicle_atlas_to_sagemaker_role",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonEventBridgeFullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("SecretsManagerReadWrite"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSageMakerFullAccess")
            ],
            inline_policies={
                "AssumeRolePolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["sts:AssumeRole"],
                            resources=["*"]
                        )
                    ]
                )
            }
        )

        aws_region = os.getenv("AWS_REGION")
        model_endpoint = os.getenv("MODEL_ENDPOINT")
        #event_bus_name = f'aws.partner/mongodb.com/stitch.trigger/{self.trigger_id}'

        # Create a new lambda function to pull data from MongoDB
        lambda_function_pull_from_mdb = _lambda.Function(
            self, "pull_from_mdb",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="lambda_pull_from_mdb.handler",
            role=connected_vehicle_role,
            code=_lambda.Code.from_asset("AWS_Lambda_Stack"),
            timeout=Duration.seconds(60),
            environment={
                "PYTHONPATH" : "dependencies",
                "LOG_LEVEL": "INFO",
                "APP_ENV": "dev",
                "REGION_NAME":aws_region, 
                "MODEL_ENDPOINT": model_endpoint, 
                "EVENTBUS_NAME"  : "cli_pushing_to_mongodb"  
            }
        )

        secret = secretsmanager.Secret.from_secret_attributes(self, secretname, 
        secret_complete_arn=secretarn)
        
        secret.grant_read(grantee=lambda_function_pull_from_mdb)


        # Create a new lambda function to push data to MongoDB
        lambda_function_push_to_mdb = _lambda.Function(
            self, "push_to_mdb",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="lambda_push_to_mdb.handler",
            code=_lambda.Code.from_asset("AWS_Lambda_Stack"),
            role=connected_vehicle_role,
            timeout=Duration.seconds(60),
            environment={
                "PYTHONPATH" : "dependencies",
                "LOG_LEVEL": "INFO",
                "APP_ENV": "dev",
                "region_name":aws_region,
                "model_endpoint": model_endpoint 
            }
        )
        
        secret.grant_read(grantee=lambda_function_push_to_mdb)



        # Create a new Event Bus 
        pull_from_mdb_bus = aws_events.EventBus(self, 'cli_pulling_from_mongodb',
            event_source_name = f'aws.partner/mongodb.com/stitch.trigger/{self.trigger_id}'        
        )

        # Create a new Rule
        pull_from_mdb_rule = aws_events.Rule(self, 'sagemaker-pull',
            event_bus=pull_from_mdb_bus,
            event_pattern=aws_events.EventPattern(
                source=["aws.partner/mongodb.com"],
            ),
        )

        # Add Lambda as a target to the Rule
        pull_from_mdb_rule.add_target(aws_events_targets.LambdaFunction(lambda_function_pull_from_mdb))

        # Add permission for EventBridge to invoke the Lambda function
        lambda_function_pull_from_mdb.add_permission('AllowEventBridge',
            principal=iam.ServicePrincipal('events.amazonaws.com'),
            source_arn=pull_from_mdb_rule.rule_arn,
        )


        # Create a new Event Bus for pushing data to MongoDB
        push_to_mdb_bus = aws_events.EventBus(self, 'cli_pushing_to_mongodb',
            event_bus_name='cli_pushing_to_mongodb',
        )

        # Create a new Rule
        push_to_mdb_rule = aws_events.Rule(self, 'cli_push_to_lambda',
            event_bus=push_to_mdb_bus,
            event_pattern=aws_events.EventPattern(
                source=['user-event'],
                detail_type=['user-preferences'],
            ),
        )

        # Add Lambda as a target to the Rule
        push_to_mdb_rule.add_target(aws_events_targets.LambdaFunction(lambda_function_push_to_mdb))

        # Add permission for EventBridge to invoke the Lambda function
        lambda_function_push_to_mdb.add_permission('AllowEventBridge',
            principal=iam.ServicePrincipal('events.amazonaws.com'),
            source_arn=push_to_mdb_rule.rule_arn,
        )

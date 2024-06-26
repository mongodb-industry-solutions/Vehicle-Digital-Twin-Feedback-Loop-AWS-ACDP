


# Vehicle Digital Twin Set Up with MongoDB & AWS  

This Repository hosts the Vehicle Digital Twin Demo that can be deployed in AWS CMS ACDP. 



A connected vehicle platform opens a window of analytical data that manufacturers can use to provide recommendations for safer, more efficient and improved driving experiences. Personalized driving experiences are made possible through bidirectional information exchange between applications in the car, mobile, webapps and machine learning interfaces in the cloud.

However, creating such a cutting edge connected vehicle platform requires the best-in-class foundation. With MongoDB Atlas and the AWS ecosystem, you are provided with such building blocks. MongoDB is your end-to-end data layer for efficient bidirectional data exchange, ensuring consistency on a mobile device, vehicle, and the cloud. AWS, including SageMaker and its integration capabilities, is your public cloud infrastructure allowing you to gain value out of your data and produce the right recommendations for enhanced driving experiences.

![image](media/Overview_New.png)

Under the hood we use a mix of MongoDB and AWS components nicely put together to create this end to end scenario. If you are curious and want to learn how it works you can jump directly to the [demo section](https://github.com/mongodb-industry-solutions/Digital-Twins-With-AWS/blob/main/Demo_Instructions.md). 

![image](media/EndToEnd.png) 

With these tools in mind, let’s begin creating a cutting edge connected vehicle platform!

# Set Up Instructions 

## Part 0: AWS CMS Prerequisites

Before we start, we have to go through a few prerequisites necessary to build this demo on your CMS portal.

[Go through the prerequisite steps  available here](https://github.com/mongodb-industry-solutions/Vehicle-Digital-Twin-Feedback-Loop-AWS-ACDP/tree/main/cdk).

## Part 1: Set up the MongoDB Atlas Digital-Twin Backend

[Set up the MongoDB Atlas Digital-Twin Backend](https://github.com/mongodb-industry-solutions/Vehicle-Digital-Twin-Feedback-Loop-AWS-ACDP/tree/main/cdk/cms-cdk/atlas-backend) 


## Part 2: Set up the iOS Swift Vehicle Controller Mobile Application

[Set up the iOS Swift Vehicle Controller Mobile Application](https://github.com/mongodb-industry-solutions/Vehicle-Digital-Twin-Feedback-Loop-AWS-ACDP/tree/main/mobile-swift)


## Part 3: Set up the Amazon SageMaker Integration

[Set up the Amazon SageMaker Integration](https://github.com/mongodb-industry-solutions/Vehicle-Digital-Twin-Feedback-Loop-AWS-ACDP/tree/main/aws-sagemaker)


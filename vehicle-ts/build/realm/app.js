"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const schemas_1 = require("./schemas");
const config_1 = require("./config");
const promises_1 = require("timers/promises");
const realm_1 = __importStar(require("realm"));
class RealmApp {
    constructor() {
        this.batteryMeasurements = []; // Battery measurements bucket
        this.app = new realm_1.default.App({ id: config_1.appID });
        this.self = this;
    }
    /**
     * Atlas application services email/password authentication
     */
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.app.logIn(realm_1.default.Credentials.emailPassword(config_1.realmUser.username, config_1.realmUser.password));
            this.realm = yield realm_1.default.open({
                schema: [schemas_1.Vehicle, schemas_1.Battery, schemas_1.Command, schemas_1.Component, schemas_1.Sensor, schemas_1.Measurement],
                sync: {
                    user,
                    flexible: true
                }
            });
            // Add flexible sync subscriptions
            const ownerID = `owner_id = ${JSON.stringify(user.id)}`;
            yield this.realm.subscriptions.update(subscriptions => {
                subscriptions.add(this.realm.objects(schemas_1.Vehicle).filtered(ownerID), { name: "vehicle-filter" });
                subscriptions.add(this.realm.objects(schemas_1.Component).filtered(ownerID), { name: "component-filter" });
            });
            // Create vehicle object on application start
            let vehicleInit = config_1.vehicleConfig;
            vehicleInit.owner_id = this.app.currentUser.id;
            this.realm.write(() => {
                // @ts-expect-error SDK TS Bug: Will fix being able to pass nested unmanaged object.
                this.vehicle = new schemas_1.Vehicle(this.realm, vehicleInit);
                // this.vehicle = new Vehicle(this.realm, { ...vehicleInit, battery: new Battery(this.realm, vehicleInit.battery) });
            });
            this.vehicle.addListener(this.processCommands.bind(this));
        });
    }
    /**
     * Creates a new component object and relates it to the parent vehicle object
     * @param name Name of the component to be created
     * @returns Result of the component creation procedure as JSON object or the resulting error
     */
    addComponent(name) {
        try {
            this.realm.write(() => {
                let component = new schemas_1.Component(this.realm, { _id: new realm_1.BSON.ObjectId(), name: name, owner_id: this.app.currentUser.id });
                this.vehicle.components.push(component);
            });
            return { result: "Component created and related to " + this.vehicle.name };
        }
        catch (error) {
            console.error(error);
            return { result: "Add component failed, no vehicle available!" };
        }
    }
    /**
     * Pause synchronization of the Realm
     */
    pauseRealm() {
        var _a;
        (_a = this.realm.syncSession) === null || _a === void 0 ? void 0 : _a.pause();
        return ({ result: 'Sync paused!' });
    }
    /**
     * Resume synchronization of the paused Realm
     */
    resumeRealm() {
        var _a;
        (_a = this.realm.syncSession) === null || _a === void 0 ? void 0 : _a.resume();
        return ({ result: 'Sync resumed!' });
    }
    /**
     * Store and sync battery sensor values
     */
    addSensor(values) {
        const measurement = { ts: new Date(), voltage: Number(values.voltage), current: Number(values.current) };
        // Update vehicle battery fields on the vehicle object
        try {
            this.realm.write(() => {
                this.vehicle.battery.voltage = Number(measurement.voltage);
                this.vehicle.battery.current = Number(measurement.current);
            });
        }
        catch (err) {
            console.error(err);
        }
        // An example for a bucket pattern, when sensor measurements are too frequent to be sent to the backend
        if (this.batteryMeasurements.length < 20) {
            this.batteryMeasurements.push(measurement);
        }
        else if (this.batteryMeasurements.length === 20) {
            // When batteryMeasurements bucket contains 20 measurements, push it to the backend
            try {
                this.realm.write(() => {
                    const sensor = {
                        _id: new realm_1.BSON.ObjectId(),
                        vin: this.vehicle._id,
                        type: "battery",
                        measurements: this.batteryMeasurements
                    };
                    this.realm.create(schemas_1.Sensor, sensor);
                    this.batteryMeasurements = [];
                });
            }
            catch (err) {
                console.error(err);
            }
        }
        return ({ result: `Battery status updated: voltage:${values.voltage}, current:${values.current}, Bucket: ${this.batteryMeasurements.length}/20` });
    }
    /**
     * Provide vehicle object as JSON string
     */
    getVehicleAsJSON() {
        const vehicle = this.vehicle.toJSON();
        vehicle['measurements'] = this.batteryMeasurements.length;
        return JSON.stringify(vehicle);
    }
    /**
     * Process commands
     */
    processCommands(vehicle, changes) {
        if (changes.deleted) {
            console.log(`Vehicle removed! ${changes}`);
        }
        else if (changes.changedProperties.includes("commands")) {
            for (const command of vehicle.commands) {
                if (command.status === "submitted") {
                    console.log(JSON.stringify(command));
                    this.realm.write(() => {
                        command.status = "inProgress";
                    });
                    (0, promises_1.setTimeout)(5000).then(() => {
                        this.resetBattery();
                        this.realm.write(() => {
                            command.status = "completed";
                            console.log(JSON.stringify(command));
                        });
                    });
                }
            }
        }
    }
    // Set the battery status back to ok
    resetBattery() {
        this.self.realm.write(() => {
            this.vehicle.battery.status = "OK";
        });
    }
    /**
     * Remove all change listeners,delete created vehicles/components
     */
    cleanupRealm() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Remove all change listener
                this.vehicle.removeAllListeners();
                // Delete all vehicle and component entries of the current subscription
                this.realm.write(() => {
                    this.realm.deleteAll();
                });
                yield ((_b = (_a = this.realm) === null || _a === void 0 ? void 0 : _a.syncSession) === null || _b === void 0 ? void 0 : _b.uploadAllLocalChanges());
                console.log("Realm cleaned up!");
            }
            catch (err) {
                console.error("Failed: ", err);
            }
        });
    }
}
exports.default = RealmApp;

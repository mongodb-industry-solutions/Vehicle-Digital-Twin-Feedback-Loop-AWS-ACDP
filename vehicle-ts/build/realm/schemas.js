"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Measurement = exports.Sensor = exports.Component = exports.Command = exports.Battery = exports.Vehicle = void 0;
const realm_1 = __importDefault(require("realm"));
/**
 * Schema/class definition for the vehicle object
 */
class Vehicle extends realm_1.default.Object {
}
exports.Vehicle = Vehicle;
Vehicle.schema = {
    name: 'Vehicle',
    primaryKey: '_id',
    properties: {
        _id: 'string',
        name: 'string',
        owner_id: 'string',
        isOn: 'bool',
        commands: 'Command[]',
        mixedTypes: 'mixed?',
        components: 'Component[]',
        battery: 'Battery?'
    }
};
/**
 * Schema/class definition for an embedded battery object
 */
class Battery extends realm_1.default.Object {
}
exports.Battery = Battery;
Battery.schema = {
    name: 'Battery',
    embedded: true,
    properties: {
        sn: 'string?',
        capacity: 'int?',
        voltage: 'int?',
        current: 'int?',
        status: 'string?'
    }
};
/**
 * Schema/class definition for a commands list command object
 */
class Command extends realm_1.default.Object {
}
exports.Command = Command;
Command.schema = {
    name: 'Command',
    embedded: true,
    properties: {
        command: 'string?',
        status: 'string?',
        ts: 'date?'
    },
};
/**
 * Schema/class definition for a component object
 */
class Component extends realm_1.default.Object {
}
exports.Component = Component;
Component.schema = {
    name: 'Component',
    primaryKey: '_id',
    properties: {
        _id: 'objectId?',
        name: 'string?',
        owner_id: 'string'
    }
};
/**
 * Schema/class definition for a sensor measurement object
 */
class Sensor extends realm_1.default.Object {
    constructor() {
        super(...arguments);
        this.type = 'battery';
    }
}
exports.Sensor = Sensor;
Sensor.schema = {
    name: 'Sensor',
    asymmetric: true,
    primaryKey: '_id',
    properties: {
        _id: 'objectId',
        vin: 'string',
        type: 'string',
        sn: 'string?',
        measurements: 'Measurement[]'
    }
};
/**
 * Schema/class definition for measurement object
 */
class Measurement extends realm_1.default.Object {
}
exports.Measurement = Measurement;
Measurement.schema = {
    name: 'Measurement',
    embedded: true,
    properties: {
        ts: 'date',
        voltage: 'int?',
        current: 'int?'
    }
};

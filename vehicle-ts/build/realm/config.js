"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleConfig = exports.vin = exports.realmUser = exports.appID = void 0;
// Provide the Realm App ID
exports.appID = "connected-vehicle-uxgalxa";
// Provide the configured Email/Password user account. 
// If you have changed the password while creating the user you must update it here too
exports.realmUser = {
    username: "democms",
    password: "democms@1234"
};
// export const realmUser = {
//     username: process.env.ATLAS_APP_USER,
//     password: process.env.ATLAS_APP_PWD
// }
// Create brand/vehicle type specific VINs https://vingenerator.org/brand
exports.vin = "5UXFE83578L342684";
// Vehicle default configuration
exports.vehicleConfig = {
    _id: exports.vin,
    name: "My Car",
    owner_id: "",
    mixedTypes: "Change Type",
    isOn: false,
    commands: [],
    battery: { sn: "123", capacity: 1000, voltage: 50, current: 50, status: "OK" }
};

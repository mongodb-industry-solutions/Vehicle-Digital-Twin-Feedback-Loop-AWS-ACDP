"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const app_1 = __importDefault(require("./realm/app"));
const body_parser_1 = __importDefault(require("body-parser"));
/**
 * Instantiate Realm application
 */
const realmApp = new app_1.default();
realmApp.login().catch(err => {
    console.error(err);
});
/**
 * Instantiate express server
 */
const webserver = (0, express_1.default)();
const port = 3000;
webserver.use(body_parser_1.default.urlencoded({ extended: true }));
webserver.use(express_1.default.static(__dirname + '/img/'));
webserver.use(express_1.default.static(__dirname + '/public/'));
webserver.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname + '/public/index.html'));
});
/**
 * Create server-sent event endpoint
 */
let client;
webserver.get('/subscribe', (req, res) => {
    var _a;
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);
    // send client a simple response
    res.write('data: Eventlistener subscribed!\n\n');
    // store `res` of client to let us send events at will
    client = res;
    // listen for client 'close' requests
    req.on('close', () => { client = null; });
    // Add vehicle change listener to send changes to browser
    (_a = realmApp.realm) === null || _a === void 0 ? void 0 : _a.objects("Vehicle").addListener(refreshVehicle);
});
// Callback for vehicle changes
function refreshVehicle(realm, string) {
    if (string.deletions.length > 0) {
        // Vehicle deleted
    }
    else {
        sendRefreshEvent(realmApp.getVehicleAsJSON());
    }
}
// Publish vehicle refresh event to browser window
function sendRefreshEvent(vehicle) {
    client.write('event: refresh\n');
    client.write(`data: ${vehicle}\n\n`);
}
/**
 * Provide add component endpoint
 */
webserver.post('/add_component', (req, res) => {
    const result = realmApp.addComponent(req.body.name);
    console.log(result);
    res.send(result);
});
/**
 * Provide a pause synced Realm endpoint
 */
webserver.get('/pause_realm', (req, res) => {
    const result = realmApp.pauseRealm();
    console.log(result);
    res.send(result);
});
/**
 * Provide a resume endpoint for a previously paused synced Realm
 */
webserver.get('/resume_realm', (req, res) => {
    const result = realmApp.resumeRealm();
    console.log(result);
    res.send(result);
});
/**
 * Provide add battery measurement endpoint
 */
webserver.post('/add_sensor', (req, res) => {
    const result = realmApp.addSensor(req.body);
    console.log(result);
    res.send(result);
});
/**
 * Run the express server on the provided port
 */
webserver.listen(port, () => {
    console.log(`Digital-Twin app listening on port ${port}`);
});
/**
 * On process shutdown clean Realm and exit program
 */
process.on("SIGINT", function () {
    console.log("Shutdown initiated!");
    realmApp.cleanupRealm().then(() => {
        process.exit();
    });
});

const server=require("../src/index");
const {int2code}=require("../src/code");
const cfg = require("../config.json");

const serv = server(cfg);

serv.on("client", client => {
    console.log("Created client " + client.id + " from " + client.remote.address + ":" + client.remote.port);
});

serv.on("identify", (client, username, version) => {
    console.log("Identified client " + client.id + " (" + client.remote.address + ":" + client.remote.port + ") as " + username + " (" + version + ")");
});

serv.on("create", (client, room) => {
    console.log("Client " + client.fmt + " created a game for " + room.max + " with code " + int2code(room.code));
});

serv.on("join", (client, room) => {
    console.log("Client " + client.fmt + " joined game " + int2code(room.code))
});

serv.on("remove", (client, room) => {
    console.log("Client " + client.fmt + " removed from game " + int2code(room.code));
});

serv.on("start", room => {
    console.log("Game " + int2code(room.code) + " started with " + room.clients.length + " clients.");
});

serv.on("bind", (client, room) => {
    console.log("Listening for messages..");
});

serv.on("shutdown", () => {
    process.exit();
});

if (process.platform === "win32") {
    var rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout
    });
  
    rl.on("SIGINT", function () {
      process.emit("SIGINT");
    });
}

process.on("SIGINT", function () {
    serv.emit("graceful");
});
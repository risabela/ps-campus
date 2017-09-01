const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const moment = require("moment");
const app = express();

const port = process.env.PORT || 8080;

const debugLogFile = "public/debug-log.txt";
var messages = [];

app.use(bodyParser.text());
app.use(express.static(path.join(__dirname, "/public")));

app.listen(port, function() {
    console.log("App listening on port " + port);
});

app.post("/log", function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end('log received');

    var message = request.body;
    var timestamp = moment().format("MM-DD HH:mm");

    messages.push(timestamp + " - " + message);
});

setInterval(function() {
    var logNew = "";
    for (var i = 0; i < messages.length; i++) {
        logNew += messages[i] + "\n";
    }

    fs.appendFile(debugLogFile, logNew, "utf8");
    //console.log("Saved " + messages.length + " messages to the log.");
    messages = [];
}, 10000);
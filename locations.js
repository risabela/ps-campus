var express = require("express");
var fs = require("fs");
var bodyParser = require("body-parser");
var app = express();

var port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(express.static(__dirname + "/tools/locations"));
//app.use(express.static(__dirname + "/public/images"));

app.listen(port, function() {
    console.log("App listening on port " + port);
});

app.post("/locationCoords", function(request, response) {
    console.log("POST: saved location coordinate data");
    fs.writeFile("tools/locations/location_coords.json",
        JSON.stringify(request.body, null, "\t"), "utf8");
    
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end('post received');
});
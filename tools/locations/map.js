var myMap = null;
var locInd = null;

var locationData = null;
var locationCoords = null;

var styleIdle = {
    weight: 2,
    opacity: 0.75,
    fillOpacity: 0.25
};

var editingCoords = false;
var coords = [];
var polyline = null;

var polygon = null;

function DrawPolygon(points, color) {
    if (polygon != null) {
        polygon.remove();
        polygon = null;
    }

    if (points == null || color == null)
        return;
    if (points.length < 3)
        return;

    polygon = L.polygon(points, {
        color: color,
        bubblingMouseEvents: false
    }).addTo(myMap);

    polygon.setStyle(styleIdle);
}

function DrawLine(points) {
    if (polyline != null) {
        polyline.remove();
        polyline = null;
    }

    if (points.length == 0)
        return;
    else if (points.length == 1) {
        polyline = L.circle(coords[0], {radius: 2, color: "red"}).addTo(myMap);
        return;
    }

    polyline = L.polyline(points, {color: "red"}).addTo(myMap);
}

function OnUndoClick() {
    if (coords.length == 0)
        return;

    coords.pop();
    DrawLine(coords);
}

function OnMapClick(event) {
    if (!editingCoords)
        return;

    var latLng = event.latlng;
    coords.push([latLng.lat, latLng.lng]);
    DrawLine(coords);
}

function EditLocation(index) {
    locInd = index;

    var locName = locationData[locInd]["name"];

    $("#leName").html(locName);
    
    DrawPolygon(locationCoords[locName], "#078aed");
}

function EditCoordsClick() {
    if (locInd == null)
        return;

    if (!editingCoords) {
        editingCoords = true;
        L.DomUtil.addClass(myMap._container,'crosshair-cursor-enabled');

        $("#leEditCoords").html("Done");
        $("#leUndo").show();
        $("#leCancel").show();
        coords = [];
    }
    else {
        EditCoordsDone(true);
    }
}

function OnCancelClick() {
    EditCoordsDone(false);
}

function EditCoordsDone(save) {
    editingCoords = false;
    L.DomUtil.removeClass(myMap._container,'crosshair-cursor-enabled');

    $("#leEditCoords").html("Edit Coordinates");
    $("#leUndo").hide();
    $("#leCancel").hide();

    var locName = locationData[locInd]["name"];

    if (save)
        locationCoords[locName] = coords;

    DrawLine([]); // clear line
    DrawPolygon(locationCoords[locName], "#078aed");
}

function NextClick() {
    if (locInd == null || editingCoords)
        return;

    EditLocation((locInd + 1) % locationData.length);
}
function PrevClick() {
    if (locInd == null || editingCoords)
        return;

    EditLocation((locInd - 1 + locationData.length) % locationData.length);
}

function SaveAll() {
    $.ajax({
        type: "POST",
        url: "/locationCoords",
        data: JSON.stringify(locationCoords),
        contentType: "application/json"
    });
}

$(function() {
    myMap = L.map("map", {
        center: [40.3440774, -74.6581347],
        zoom: 16.5,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        maxBounds: [
            [40.3062834,-74.6837298],
            [40.3615089,-74.6441935]
        ],
        zoomControl: false // add manually later to top right
    });

    L.tileLayer("https://api.mapbox.com/{style}/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 20,
        minZoom: 16,
        style: "styles/v1/jmrico01/cj68serkh1ncm2slt39g55r19", // color (classic)
        //style: "styles/v1/jmrico01/cj66ydy6a7m3j2snoyxxom7pw", // light
        //style: "styles/v1/jmrico01/cj64oe3nq5ibq2rr8tprzvy56", // dark
        accessToken: "pk.eyJ1Ijoiam1yaWNvMDEiLCJhIjoiY2o0MjZvYXZzMDNxeTMzbXphajQ2YmdoayJ9.r5KOkm5E2W9c6o854dXhfw"
    }).addTo(myMap);

    L.control.zoom({position: "topright"}).addTo(myMap);
    $("#leUndo").hide();
    $("#leCancel").hide();
    $("#leUndo").click(OnUndoClick);
    $("#leCancel").click(OnCancelClick);
    $("#leEditCoords").click(EditCoordsClick);
    $("#lePrev").click(PrevClick);
    $("#leNext").click(NextClick);
    myMap.on("click", OnMapClick);

    $("#saveAllButton").click(SaveAll);

    $.ajax({
        dataType: "json",
        url: "/location_data.json",
        success: function(data, textStatus, jqXHR) {
            // Load all location data except for coordinates.
            locationData = data;

            $.ajax({
                dataType: "json",
                url: "/location_coords.json",
                success: function(coords, textStatus, jqXHR) {
                    // Load location polygon coordinates.
                    locationCoords = coords;
                    
                    EditLocation(0);
                }
            });
        }
    });

    
});
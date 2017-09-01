var myMap = null;
var subsitePrototype = null;

var polygons = [];

var polygonSelected = null;
var polygonFocused = null; // mobile only
var popupSelected = null;
var popupHover = null;

var polygonRecentClick = false;
// Amount of time the recent click flag will be true.
var polygonRecentClickDuration = 150;
// Amount of time the map click event waits to confirm no polygon was clicked.
var polygonRecentClickTime = 50;

var sidebarWidth = 400;
var sidebarOpen = false;

var startSelection = "Nassau Hall";

var popupContent = "<b>{0}</b>";
var popupContentSites = "<b>{0}</b><br>{1}";

var styleIdle = {
    weight: 2,
    opacity: 0.75,
    fillOpacity: 0.25
};
var styleHover = {
    weight: 2,
    opacity: 1.0,
    fillOpacity: 0.6
};
var styleSelected = {
    weight: 2,
    opacity: 1.0,
    fillOpacity: 0.6
};

if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) { 
            return (typeof args[number] != 'undefined') ? args[number] : match;
        });
    };
}

function RecenterWithSidebar(latLng) {
    var targetPoint = myMap.project(latLng, myMap.zoom)
    if (!IsMobile()) {
        targetPoint = targetPoint.subtract([sidebarWidth / 2, 0]);
    }
    return myMap.unproject(targetPoint, myMap.zoom);
}

function SidebarButtonTooltipVisible(flag) {
    var $toggleSidebarTooltip = $("#toggleSidebarTooltip");

    if (flag) {
        $("#toggleSidebarTooltip").css("visibility", "visible");
    }
    else {
        $("#toggleSidebarTooltip").css("visibility", "hidden");
    }
}

function ToggleSidebar() {
    var $sidebar = $("#sidebar");
    var $toggleSidebar = $("#toggleSidebar");
    var $toggleSidebarArrow = $("#toggleSidebarArrow");
    var $toggleSidebarTooltip = $("#toggleSidebarTooltip");

    SidebarButtonTooltipVisible(false);

    if (sidebarOpen) {
        $toggleSidebarArrow.css("margin-left", "9px");
        $toggleSidebarArrow.css("border-color", "transparent transparent transparent black");
        $toggleSidebarTooltip.html("Show side panel");

        $sidebar.animate({
            left: "-" + sidebarWidth + "px",
        }, 500);
        $toggleSidebar.animate({
            "margin-left": "0"
        }, 500);
    }
    else {
        $toggleSidebarArrow.css("margin-left", "1px");
        $toggleSidebarArrow.css("border-color", "transparent black transparent transparent");
        $toggleSidebarTooltip.html("Hide side panel");

        $sidebar.animate({
            left: "0px"
        }, 500);
        $toggleSidebar.animate({
            "margin-left": sidebarWidth + "px"
        }, 500);
    }
    sidebarOpen = !sidebarOpen;
}

function MakePopupFromPolygon(polygon, small) {
    if (small === undefined)
        small = false;
    
    var name = polygon.options.name;
    var subsites = polygon.options.subsites;

    var latLng = [polygon.getBounds().getNorth(), polygon.getCenter().lng];

    var content = popupContent.format(name);
    if (!small && subsites != null) {
        var siteString = "";
        if (polygon.options.description !== null) {
            siteString += "+";
        }
        siteString += subsites.length;
        if (subsites.length == 1) {
            siteString += " site";
        }
        else {
            siteString += " sites";
        }
        content = popupContentSites.format(name, siteString);
    }

    if (small) {
        content = "<div style=\"font-size: 10px\">" + content + "</div>";
    }

    var popup = L.popup({
        autoPan: true,
        autoClose: false,
        closeOnClick: false,
        closeButton: false
    })
    .setLatLng(latLng)
    .setContent(content)
    .openOn(myMap)
    .bringToBack();

    return popup;
}

function DisplayBuildingInfo(info) {
    var name = info.name;

    $("#bldgName").html(name);
    if (info.image === null) {
        $("#bldgImg").css("height", "0px");
        $("#bldgImg").hide();
    }
    else {
        $("#bldgImg").show();
        $("#bldgImg").css("height", "auto");
        $("#bldgImg").attr("src", "content/images/" + info.image);
    }
    if (info.description === null) {
        $("#bldgDescription").html("");

        if (info.subsites.length === 1) {
            $("#bldgSites").html("1 site");
        }
        else {
            $("#bldgSites").html(info.subsites.length + " sites");
        }
        $("#bldgSites").show();
    }
    else {
        $("#bldgDescription").html("<p>" + info.description + "</p>");

        if (info.subsites !== null) {
            if (info.subsites.length === 1) {
                $("#bldgSites").html("+ 1 other site");
            }
            else {
                $("#bldgSites").html("+ " + info.subsites.length + " other sites");
            }
            $("#bldgSites").show();
        }
        else {
            $("#bldgSites").hide();
        }
    }

    $(".subsite").remove();
    if (info.subsites !== null) {
        for (var i = 0; i < info.subsites.length; i++) {
            var subName = info.subsites[i].name;

            var $subDiv = $("<div class=\"subsite\"></div>");
            $subDiv.html(subsitePrototype);
            if (IsMobile()) {
                $("#infoOverlay").append($subDiv);
            }
            else {
                $("#sidebar .simplebar-scroll-content .simplebar-content").append($subDiv);
            }
                
            $subDiv.find(".subName").html(subName);
            $subDiv.find(".subDescription").html(info.subsites[i].description);
            var $subImg = $subDiv.find(".subImg");
            if ("image" in info.subsites[i]) {
                $subImg.show();
                $subImg.attr("src", "content/images/" + info.subsites[i].image);
            }
            else {
                $subImg.hide();
            }
        }
    }
}

function SelectPolygon(polygon) {
    // Deselect polygon and remove popup.
    if (polygonSelected !== null) {
        polygonSelected.setStyle(styleIdle);
    }
    polygonSelected = polygon;
    if (popupSelected !== null) {
        popupSelected.remove();
    }

    // Display new polygon info if it's not null.
    if (polygon !== null) {
        $("#toggleSidebarButton").show();
        DisplayBuildingInfo(polygon.options);

        polygon.setStyle(styleSelected);
        popupSelected = MakePopupFromPolygon(polygon);
    }
    else {
        $("#toggleSidebarButton").hide();
    }
}

function OnClickBldg(event) {
    if (IsMobile())
        if (paneOpen || paneAnimating)
            return; // catastrophic failure if this isn't done (mobile)
    
    polygonRecentClick = true;

    var polygon = event.target;
    myMap.panTo(RecenterWithSidebar(polygon.getCenter()));

    SelectPolygon(polygon);

    if (IsMobile()) {
        $("#bottomPane").show();
        if (!paneHasOpened) {
            $("#bottomPaneTip").show();
        }
        ClearPolygonFocus();
    }
    else {
        if (!sidebarOpen) {
            ToggleSidebar();
        }
    }

    setTimeout(function() {
        polygonRecentClick = false;
    }, polygonRecentClickDuration);
}
function OnClickMap() {
    // "True" map click.
    if (IsMobile()) {
        if (paneOpen || paneAnimating)
            return; // catastrophic failure possible if this isn't done

        $("#bottomPane").hide();
        if (!paneHasOpened) {
            $("#bottomPaneTip").hide();
        }
    }
    else {
        if (sidebarOpen) {
            ToggleSidebar();
        }
    }

    // Remove polygon selection.
    SelectPolygon(null);
}
function OnClickMapEvent(event) {
    // First check if a polygon has also been clicked (event propagates).
    setTimeout(function() {
        if (!polygonRecentClick) {
            // If no polygon has been clicked, we're sure it's the map.
            OnClickMap();
        }
    }, polygonRecentClickTime);
}

// Desktop only
function OnMouseEnterBldg(event) {
    var polygon = event.target;

    if (popupHover !== null) {
        popupHover.remove();
    }
    popupHover = MakePopupFromPolygon(polygon);

    polygon.setStyle(styleHover);
}
// Desktop only
function OnMouseExitBldg(event) {
    var polygon = event.target;

    if (popupHover != null) {
        popupHover.remove();
    }
    if (polygon !== polygonSelected) {
        polygon.setStyle(styleIdle);
    }
}

function ApproxLatLngDistance(latLng1, latLng2) {
    return Math.sqrt(
        (latLng1.lat - latLng2.lat) * (latLng1.lat - latLng2.lat)
        + (latLng1.lng - latLng2.lng) * (latLng1.lng - latLng2.lng));
}

$(function() {
    var zoomPos = "bottomright";

    if (IsMobile()) {
        $(".desktop").remove();
        zoomPos = "topleft";
        $("#instructionText").html("Tap on a highlighted location<br>"
            + "to explore sites related to<br>"
            + "Princeton & Slavery");
    }
    else {
        $(".mobile").remove();
    }

    // Initialize leaflet.js map controls.
    myMap = L.map("map", {
        center: [40.3440774, -74.6581347],
        zoom: 17,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        maxBounds: [
            [40.3062834,-74.6837298],
            [40.3615089,-74.6441935]
        ],
        zoomControl: false // add manually to top right
    });
    L.control.zoom({position: zoomPos}).addTo(myMap); // zoom control
    myMap.on("click", OnClickMapEvent);

    // Initialize MapBox tile layer.
    L.tileLayer("https://api.mapbox.com/{style}/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 20,
        minZoom: 16,
        style: "styles/v1/jmrico01/cj68serkh1ncm2slt39g55r19", // color (classic)
        //style: "styles/v1/jmrico01/cj66ydy6a7m3j2snoyxxom7pw", // light
        //style: "styles/v1/jmrico01/cj64oe3nq5ibq2rr8tprzvy56", // dark
        accessToken: "pk.eyJ1Ijoiam1yaWNvMDEiLCJhIjoiY2o0MjZvYXZzMDNxeTMzbXphajQ2YmdoayJ9.r5KOkm5E2W9c6o854dXhfw"
    }).addTo(myMap);

    // Save sidebar subsite prototype.
    var $subsitePrototype = $("#subsitePrototype");
    subsitePrototype = $subsitePrototype.html();
    $subsitePrototype.remove();
});

$(window).on("load", function() {
    if (IsMobile()) {
        var $bottomPane = $("#bottomPane");
        $bottomPane.on("touchstart", OnPaneTouchStart);
        $bottomPane.on("touchend", OnPaneTouchEnd);
        $bottomPane.on("touchmove", OnPaneTouchMove);
        $("#paneUpButton").on("touchstart", OnPaneArrowTouchStart);
        $("#paneUpButton").on("touchend", OnPaneArrowTouchEnd);

        window.onpopstate = OnPopState;

        setInterval(UpdatePopup, 500);
    }
    else {
        $("#toggleSidebarButton").click(ToggleSidebar);
        $("#toggleSidebarButton").hover(function() {
            SidebarButtonTooltipVisible(true); // Hover in
        }, function() {
            SidebarButtonTooltipVisible(false); // Hover out
        });
        $("#toggleSidebarButton").hide();
    }

    LoadData();
});
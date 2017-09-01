var paneOpen = false;
var paneAnimating = false;
var paneHasOpened = false;

var drag = false;
var touchID;
var startY;
var distY;

// mobile only
function OnPopState(event) {
    if (event.state === null) {
        if (paneOpen) {
            TogglePane(false);
        }
    }
    else {
        var polygon = polygons[event.state.polygonIndex];

        // TODO duplicate code ish
        myMap.panTo(RecenterWithSidebar(polygon.getCenter()));
        SelectPolygon(polygon);

        $("#bottomPane").show();
        if (!paneHasOpened) {
            $("#bottomPaneTip").show();
        }
        ClearPolygonFocus();

        TogglePane(false);
    }
}

function LayoutPaneOpen() {
    $("#outer").css("overflow-y", "visible");
    $("#main").hide();

    $("#bottomPane").css("position", "relative");
    $("#bottomPane").css("top", "auto");
    $("#bottomPane").css("bottom", "auto");
    $("#bldgImg").css("position", "relative");
    $("#bldgImg").css("top", "auto");
    $("#infoOverlay").css("position", "relative");
    $("#infoOverlay").css("top", "auto");
    $("#infoOverlay").css("height", "auto");
}
function LayoutPaneToClose() {
    document.getElementById("outer").scrollTop = 0;

    var windowHeight = $(window).height();
    var bldgImgHeight = $("#bldgImg").height();
    var bttmPaneHeight = $("#bottomPane").height();

    $("#bldgImg").css("position", "absolute");
    $("#bldgImg").css("top", "0");
    $("#bottomPane").css("position", "absolute");
    $("#bottomPane").css("bottom", windowHeight - bldgImgHeight - bttmPaneHeight);
    $("#infoOverlay").css("position", "absolute");
    $("#infoOverlay").css("top", bldgImgHeight + bttmPaneHeight);
    $("#infoOverlay").height(windowHeight);

    $("#outer").css("overflow-y", "hidden");
    $("#main").show();
}
function LayoutPaneToOpen() {
    var windowHeight = $(window).height();
    $("#infoOverlay").height(windowHeight);
}

function TogglePane(writeHistory, fullAnimation) {
    if (writeHistory === undefined)
        writeHistory = true;
    if (fullAnimation === undefined)
        fullAnimation = true;

    if (paneAnimating) 
        return;

    if (!paneHasOpened) {
        $("#bottomPaneTip").hide();
        paneHasOpened = true;
    }

    var $arrow = $("#paneUpArrow");
    var animTime = 500;
    if (!fullAnimation) {
        animTime = 200;
    }

    paneAnimating = true;
    if (paneOpen) {
        $arrow.css("border-color", "transparent transparent #222 transparent");
        $arrow.css("margin-top", "15px");

        if (fullAnimation)
            LayoutPaneToClose();

        $("#bldgImg").animate({
            top: "100%"
        }, animTime);
        $("#bottomPane").animate({
            bottom: 0
        }, animTime);
        $("#infoOverlay").animate({
            top: "100%"
        }, animTime, function() {
            $("#infoOverlay").css("height", "auto"); // TODO fix this
            paneAnimating = false;

            if (writeHistory) {
                history.back();
            }
        });
    }
    else {
        $arrow.css("border-color", "#222 transparent transparent transparent");
        $arrow.css("margin-top", "30px");

        if (fullAnimation)
            LayoutPaneToOpen();

        var windowHeight = $(window).height();
        var bldgImgHeight = $("#bldgImg").height();
        var bttmPaneHeight = $("#bottomPane").height();

        $("#bldgImg").animate({
            top: 0
        }, animTime);
        $("#bottomPane").animate({
            bottom: windowHeight - bldgImgHeight - bttmPaneHeight
        }, animTime);
        $("#infoOverlay").animate({
            top: bldgImgHeight + bttmPaneHeight
        }, animTime, function() {
            LayoutPaneOpen();
            paneAnimating = false;

            if (writeHistory) {
                var polygonInd = -1;
                for (var i = 0; i < polygons.length; i++) {
                    if (polygons[i] === polygonSelected) {
                        polygonInd = i;
                        break;
                    }
                }
                history.pushState({ polygonIndex: polygonInd }, "InfoPane");
            }
        });
    }

    paneOpen = !paneOpen;
}

function OnPaneArrowTouchStart(event) {
    //console.log("touch arrow start");
    event.stopPropagation();
}
function OnPaneArrowTouchEnd(event) {
    //console.log("touch arrow end");
    event.stopPropagation();

    TogglePane();
}

function GetPaneProgress() {
    var windowHeight = $(window).height();
    var bldgImgHeight = $("#bldgImg").height();
    var bttmPaneHeight = $("#bottomPane").height();
    var paneTargetBottom = windowHeight - bldgImgHeight - bttmPaneHeight;

    if (paneOpen)
        return Math.min(Math.max(-distY / paneTargetBottom, 0.0), 1.0);
    else
        return Math.min(Math.max(distY / paneTargetBottom, 0.0), 1.0);
}

function FindTouchByID(touches, id) {
    for (var i = 0; i < touches.length; i++) {
        var touch = touches.item(i);
        if (touch.identifier === id)
            return touch;
    }
    return null;
}

function OnPaneTouchStart(event) {
    //console.log("touch start");
    //event.preventDefault();
    
    if (!drag) {
        if (paneOpen) {
            if (document.getElementById("outer").scrollTop !== 0)
                return;

            LayoutPaneToClose();
        }
        else {
            if (!paneHasOpened) {
                $("#bottomPaneTip").hide();
            }

            LayoutPaneToOpen();
        }

        var touch = event.changedTouches[0];
        touchID = touch.identifier;
        startY = touch.clientY;
        distY = 0;
        drag = true;
    }
}
function OnPaneTouchEnd(event) {
    //console.log("touch end");
    //event.preventDefault();
    
    var progress = GetPaneProgress();
    if ((paneOpen && progress > 0.5) || (!paneOpen && progress > 0.25)) {
        TogglePane(true, false);
    }
    else {
        if (paneOpen) {
            var windowHeight = $(window).height();
            var bldgImgHeight = $("#bldgImg").height();
            var bttmPaneHeight = $("#bottomPane").height();

            $("#bottomPane").animate({
                bottom: windowHeight - bldgImgHeight - bttmPaneHeight
            }, 200);
            $("#bldgImg").animate({
                top: 0
            }, 200);
            $("#infoOverlay").animate({
                top: bldgImgHeight + bttmPaneHeight
            }, 200, function() {
                LayoutPaneOpen();
            });
        }
        else {
            $("#bottomPane").animate({
                bottom: 0
            }, 200);
            $("#bldgImg").animate({
                top: "100%"
            }, 200);
            $("#infoOverlay").animate({
                top: "100%"
            }, 200, function() {
                if (!paneHasOpened) {
                    $("#bottomPaneTip").show();
                }
            });
        }
    }
    drag = false;
}
function OnPaneTouchMove(event) {
    //event.preventDefault();
    
    if (drag) {
        var touch = FindTouchByID(event.changedTouches, touchID);
        if (touch !== null) {
            distY = startY - touch.clientY;
            var windowHeight = $(window).height();
            var bldgImgHeight = $("#bldgImg").height();
            var bttmPaneHeight = $("#bottomPane").height();
            var targetY = windowHeight - bldgImgHeight - bttmPaneHeight;

            var progress = GetPaneProgress();

            if (paneOpen) {
                $("#bottomPane").css("bottom", (targetY - targetY * progress) + "px");
                var windowTop = windowHeight * progress;
                $("#bldgImg").css("top", windowTop + "px");
                var infoTop = bldgImgHeight + bttmPaneHeight
                    + (windowHeight - bldgImgHeight - bttmPaneHeight) * progress;
                $("#infoOverlay").css("top", infoTop + "px");
            }
            else {
                $("#bottomPane").css("bottom", targetY * progress + "px");
                var windowTop = windowHeight - windowHeight * progress;
                $("#bldgImg").css("top", windowTop + "px");
                var infoTop = windowHeight - (windowHeight - bldgImgHeight - bttmPaneHeight) * progress;
                $("#infoOverlay").css("top", infoTop + "px");
            }
        }
    }
}

function ClearPolygonFocus() {
    if (polygonFocused !== null) {
        //polygonHovered.setStyle(styleIdle);
        polygonFocused = null;
    }
    if (popupHover !== null) {
        popupHover.remove();
        popupHover = null;
    }
}

function UpdatePopup() {
    if (paneOpen)
        return;

    var mapCenter = myMap.getCenter();

    var minInd = -1;
    var minDist = 100000000.0; // large number
    for (var i = 0; i < polygons.length; i++) {
        var polygonCenter = polygons[i].getCenter();
        var dist = ApproxLatLngDistance(mapCenter, polygonCenter);
        if (dist < minDist) {
            minDist = dist;
            minInd = i;
        }
    }

    var polygon = polygons[minInd];
    if (minDist < 0.0015) {
        if (polygon === polygonSelected && polygon !== polygonFocused) {
            ClearPolygonFocus();
        }
        if (polygon !== polygonSelected && polygonFocused !== polygon) {
            ClearPolygonFocus();

            popupHover = MakePopupFromPolygon(polygon, true);
            //polygon.setStyle(styleHover);
            polygonFocused = polygon;
        }
    }
    else {
        ClearPolygonFocus();
    }
}
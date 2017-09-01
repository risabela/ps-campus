function FormatDescription(description) {
    var converter = new showdown.Converter();
    return converter.makeHtml(description);
}

function IsDescriptionLoaded(description) {
    if (description === null || description === undefined)
        return true;

    return description.slice(description.length - 4, description.length - 1) !== ".txt";
}

function IsPolygonLoaded(polygon) {
    var info = polygon.options;
    if (!IsDescriptionLoaded(info.description))
        return false;

    if (info.subsites !== null) {
        for (var i = 0; i < info.subsites.length; i++) {
            if (!IsDescriptionLoaded(info.subsites[i].description))
                return false;
        }
    }
    return true;
}

function FetchSiteDescription(siteInfo, polygon) {
    if (!("description" in siteInfo))
        return;
    if (siteInfo.description === null || siteInfo.description === undefined)
        return;

    $.ajax({
        dataType: "text",
        url: "/content/descriptions/" + siteInfo.description,
        success: function(description, textStatus, jqXHR) {
            siteInfo.description = FormatDescription(description);

            // Open start selection building once its description is loaded.
            if (polygon.options.name === startSelection && IsPolygonLoaded(polygon)) {
                myMap.panTo(RecenterWithSidebar(polygon.getCenter()), {
                    animate: false
                });

                SelectPolygon(polygon);

                if (!IsMobile() && !sidebarOpen) {
                    ToggleSidebar();
                }
            }
        }
    });
}

function FetchPolygonDescriptions(polygon) {
    var siteInfo = polygon.options;
    FetchSiteDescription(siteInfo, polygon);

    if (siteInfo.subsites !== null) {
        for (var i = 0; i < siteInfo.subsites.length; i++) {
            FetchSiteDescription(siteInfo.subsites[i], polygon);
        }
    }
}

function CreatePolygons(locationData, coords) {
    for (var i = 0; i < locationData.length; i++) {
        var locName = locationData[i].name;
        if (!(locName in coords)) {
            console.error(locName + " has no coordinates");
        }

        var image = null;
        if ("image" in locationData[i]) {
            image = locationData[i].image;
        }
        var description = null;
        if ("description" in locationData[i]) {
            description = locationData[i].description;
        }
        var subsites = null;
        if ("subsites" in locationData[i]) {
            subsites = locationData[i].subsites;
        }

        var polygon = L.polygon(coords[locName], {
            name: locName,
            // File name is written into description, then used to fetch it.
            description: description,
            image: image,
            color: "#c55827",
            subsites: subsites,
            bubblingMouseEvents: false
        }).addTo(myMap);

        polygon.setStyle(styleIdle);

        FetchPolygonDescriptions(polygon); // Fetches from file name.
        
        polygon.on("click", OnClickBldg);
        if (!IsMobile()) {
            polygon.on("mouseover", OnMouseEnterBldg);
            polygon.on("mouseout", OnMouseExitBldg);
        }
        polygons.push(polygon);
    }
}

function LoadData() {
    $.ajax({
        dataType: "json",
        url: "/content/location_data.json",
        success: function(locationData, textStatus, jqXHR) {
            $.ajax({
                dataType: "json",
                url: "/location_coords.json",
                success: function(coords, textStatus, jqXHR) {
                    CreatePolygons(locationData, coords);
                }
            });
        }
    });
}
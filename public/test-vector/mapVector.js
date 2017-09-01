window.onload = function() {
    var startLoc = new mapboxgl.LngLat(-74.6581347, 40.3440774);
    mapboxgl.accessToken = 'pk.eyJ1Ijoiam1yaWNvMDEiLCJhIjoiY2o0MjZvYXZzMDNxeTMzbXphajQ2YmdoayJ9.r5KOkm5E2W9c6o854dXhfw';
    
    var map = new mapboxgl.Map({
        container: 'map',
        style: "mapbox://styles/jmrico01/cj44gwrz90dqk2rmn7j9uy822", //'mapbox://styles/mapbox/streets-v9',
        minZoom: 15,
        maxZoom: 18,
        center: startLoc,
        zoom: 15
    });
};
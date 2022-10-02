
//Fetching Information of the ISS
const tle = `ISS (ZARYA)
1 25544U 98067A   22274.46188292  .00014869  00000+0  26380-3 0  9996
2 25544  51.6447 170.0519 0002623 316.7478 215.0466 15.50450812361668`;


const { getSatelliteInfo } = require("tle.js/dist/tlejs.cjs");
const satInfo = getSatelliteInfo(
  tle,         // Satellite TLE string or array.
  1502342329860,  // Timestamp (ms)
  38.876496494,      // Observer latitude (degrees)
  -77.009833294,    // Observer longitude (degrees)
  0               // Observer elevation (km)
);

var ISSVelocity = satInfo.velocity * 3600;
var ISSVelocity = ISSVelocity.toFixed( 0 );


var satellite = require('satellite.js');

var tleLine1 = '1 25544U 98067A   22275.03521722  .00046746  00000+0  83199-3 0  9999',
    tleLine2 = '2 25544  51.6418 167.2146 0003169 263.1060 229.2717 15.49661688361757';   

var satrec = satellite.twoline2satrec(tleLine1, tleLine2);

const date = new Date();
var positionAndVelocity = satellite.propagate(satrec, date);
const gmst = satellite.gstime(date);
const ISSposition = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
console.log(positionAndVelocity.velocity);
var Radianlng = ISSposition.longitude;
var Radianlat = ISSposition.latitude;
var ISSheightInkm = ISSposition.height;
var ISSheight = ISSheightInkm * 1000;
//var ISSVelocity = positionAndVelocity.velocity.x * 3600;
var ISSlng = satellite.degreesLong(Radianlng);
var ISSlat = satellite.degreesLat(Radianlat);


//Show live coordinates
var ISSlngOutput = ISSlng.toFixed( 2 );
var ISSlatOutput = ISSlat.toFixed( 2 );
var LatDirection = "N";
var LngDirection = "E";

if (ISSlat < 0) {
  LatDirection = "S";
  ISSlatOutput = ISSlatOutput * -1;
}
if (ISSlng < 0) {
  LngDirection = "W";
  ISSlngOutput = ISSlngOutput * -1;
}

ISSheightInkm = ISSheightInkm.toFixed( 0 );
document.getElementById("Coordinates").innerHTML = ISSlatOutput + "&#176;" + " " + LatDirection + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + ISSlngOutput + "&#176;" + " " + LngDirection;
document.getElementById("Altitude").innerHTML = "Current Altitude:" + " " + ISSheightInkm + " " + "km";
document.getElementById("Velocity").innerHTML = "Current speed:" + " " + ISSVelocity + " " + "km/h";



// Create a WorldWindow for the canvas.


const { getGroundTracks } = require("tle.js/dist/tlejs.cjs");
const GroundTracks = getGroundTracks({
  tle: tle,
  startTimeMS: 1502342329860,
  stepMS: 1000,
  isLngLatFormat: true,
}).then(function (threeOrbitsArr) {
  console.log(threeOrbitsArr);
  var orbitsLayer = new WorldWind.RenderableLayer("Orbit");
   
    // Orbit Path
    var pastOrbitPathAttributes = new WorldWind.ShapeAttributes(null);
    pastOrbitPathAttributes.outlineColor = WorldWind.Color.RED;
    pastOrbitPathAttributes.interiorColor = new WorldWind.Color(1, 0, 0, 0.5);
    var futureOrbitPathAttributes = new WorldWind.ShapeAttributes(null);//pastAttributes
    futureOrbitPathAttributes.outlineColor = WorldWind.Color.GREEN;
    futureOrbitPathAttributes.interiorColor = new WorldWind.Color(0, 1, 0, 0.5);

    //plot orbit on click
    var pastOrbitPath = new WorldWind.Path(threeOrbitsArr);
    pastOrbitPath.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
    pastOrbitPath.attributes = pastOrbitPathAttributes;
    pastOrbitPath.useSurfaceShapeFor2D = true;
   

    var futureOrbitPath = new WorldWind.Path(threeOrbitsArr);
    futureOrbitPath.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
    futureOrbitPath.attributes = futureOrbitPathAttributes;
    futureOrbitPath.useSurfaceShapeFor2D = true;

    orbitsLayer.addRenderable(pastOrbitPath);
    orbitsLayer.addRenderable(futureOrbitPath);
 

});



var wwd = new WorldWind.WorldWindow("canvasOne");    

        // Create and add layers to the WorldWindow.
        var layers = [
            {layer: new WorldWind.BMNGLayer(), enabled: true},
            {layer: new WorldWind.OpenStreetMapImageLayer(null), enabled: false},
            {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
            {layer: new WorldWind.ViewControlsLayer(wwd), enabled: true},
        ];
        for (var l = 0; l < layers.length; l++) {
          layers[l].layer.enabled = layers[l].enabled;
          wwd.addLayer(layers[l].layer);
      }


      //Day Night cycling
          var starFieldLayer = new WorldWind.StarFieldLayer();
          var atmosphereLayer = new WorldWind.AtmosphereLayer();
          wwd.addLayer(starFieldLayer);
          wwd.addLayer(atmosphereLayer);
          var now = new Date();
          starFieldLayer.time = now;
          atmosphereLayer.time = now;
  
          function runSimulation() {
              wwd.redraw(); 
              requestAnimationFrame(runSimulation);
          }
          requestAnimationFrame(runSimulation);


          wwd.navigator.lookAtLocation.latitude = ISSlat;
          wwd.navigator.lookAtLocation.longitude = ISSlng;

          wwd.redraw();


//ISS 3D model

var modelLayer = new WorldWind.RenderableLayer("ISS");
wwd.addLayer(modelLayer);
var position = new WorldWind.Position(ISSlat, ISSlng, ISSheight);
var colladaLoader = new WorldWind.ColladaLoader(position);
colladaLoader.init({dirPath: 'https://malithabandara.github.io/FlappyBird/Build/ISS/'});
colladaLoader.load('ISS.dae', function (scene) {
    
    scene.scale = 500000;
    modelLayer.addRenderable(scene);
   
});


// Add WMS imagery
var serviceAddress = "https://neo.sci.gsfc.nasa.gov/wms/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0";
var layerName = "MOD_LSTD_CLIM_M";

var createLayer = function (xmlDom) {
    var wms = new WorldWind.WmsCapabilities(xmlDom);
    var wmsLayerCapabilities = wms.getNamedLayer(layerName);
    var wmsConfig = WorldWind.WmsLayer.formLayerConfiguration(wmsLayerCapabilities);
    var wmsLayer = new WorldWind.WmsLayer(wmsConfig);
    wwd.addLayer(wmsLayer);
};

var logError = function (jqXhr, text, exception) {
    console.log("There was a failure retrieving the capabilities document: " +
        text +
    " exception: " + exception);
};

//$.get(serviceAddress).done(createLayer).fail(logError);

//Getting city, country or ocean name with geoapify API

  fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${ISSlat}&lon=${ISSlng}&type=country&apiKey=3c65e29ddd794b28bf1370e79b45e1f5`)
.then(response => response.json())
.then(result => {
  if (result.features.length) {
    var CountryName = result.features[0].properties.formatted;
    document.getElementById("flag").src = "https://countryflagsapi.com/png/"+CountryName;

    fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${ISSlat}&lon=${ISSlng}&type=city&apiKey=3c65e29ddd794b28bf1370e79b45e1f5`)
.then(response => response.json())
.then(result => {
  if (result.features.length) {
    var CityName = result.features[0].properties.formatted; 
    document.getElementById("LocationName").innerHTML = CityName + "," + CountryName;
  } else {
    document.getElementById("LocationName").innerHTML = CountryName;
  }
});

  } else {
    fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${ISSlat}&lon=${ISSlng}&apiKey=3c65e29ddd794b28bf1370e79b45e1f5`)
    .then(response => response.json())
    .then(result => {
      if (result.features.length) {
        var OceanName = result.features[0].properties.formatted; 
        document.getElementById("LocationName").innerHTML = OceanName;
      } else {
        console.log("No address found");
      }
    });
  }
});


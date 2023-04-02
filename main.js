import './style.css';
import {Collection, Feature, Map, View} from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat, toLonLat, transform } from 'ol/proj';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import { Point } from 'ol/geom';
import { Translate } from 'ol/interaction';


// Position und Zoomstufe der Karte; Position ist genau der Mittelpunkt der Karts 9.5788, 48.9773
let longitude = 9.4458;//9.417404175; //
let latitude = 48.9823;//49.214561462; //
let zoom = 18;

let centralCoord = [longitude, latitude];

let feature = [];
let translate = [];

for(let i = 0; i<=5;i++){
  switch(i){
    case 0:
      feature.push(setIcon([9.44564, 48.98198], 'Repeater_30_30.png'));
      break;
    case 1:
      feature.push(setIcon([9.44574, 48.98232], 'LoggerNL.png'));
      break;
    case 2:
      feature.push(setIcon([9.44585, 48.98228], 'LoggerPL.png'));
      break;
    case 3:
      feature.push(setIcon([9.44668, 48.98201], 'Master_30_30.png'));
      break;
    case 4:
      feature.push(setIcon([longitude + 0.00005, latitude-0.0001], 'LoggerL.png'));
      break;
  }
}

let vector = new VectorLayer({
  style: function(feature) {

    //Eine Hand beim MouseOver
    // feature.setStyle("cursor:pointer");
    // featurestyle_ = "cursor:pointer";
    return feature.get('style');

  },
  source: new VectorSource({
    features: feature
  })
})
let map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    vector
  ],
  view: new View({
    center: fromLonLat(centralCoord),
    zoom: zoom
  })
});


// // Versuch Pointer zu setzen
// vector.getSource().forEachFeature(function(feature){
//   feature.getProperties().style.cursor = 'pointer';
//   console.log("Z94", feature.getProperties().style);
// });

// map.on('pointermove', function(e) {
map.on('pointermove', function(e) {
  // if (e.dragging) { popup.hide(); return; }
// console.log("pointermove");
  // let pixel = map.getEventPixel(e.originalEvent);
  // let hit = map.hasFeatureAtPixel(pixel);
  //
  // // map.getTarget().style.cursor = hit ? 'pointer' : '';
  // // map.getTarget().style.cursor = 'pointer';
});




setTanslationsToMap(map);

function createStyle(src, img) {
    return new Style({
    image: new Icon(({
      anchor: [0.5, 0.96],
      crossOrigin: 'anonymous',
      src: src,
      class:'iconElem',
    }))
  });
}



// console.log(feature);
// console.log(featureMarker1, featureMarker2);
function setIcon(coord, img){
  let marker = new Point(fromLonLat(coord));
  // marker.setProperties("cursor = 'pointer'", undefined);


  let featureMarker = new Feature(marker);

  featureMarker.set('style', createStyle('./images/' + img, undefined));

  //translation für das Verschieben
  let translateObj = new Translate({
    features: new Collection([featureMarker])
  });
  translate.push(translateObj);

  // translateObj.on("click", function(evt){
  //   conslole.log("evt", evt);
  // });


  transform(coord, 'EPSG:4326','EPSG:3857');

  return featureMarker;
}

// einen cursor über die Icons setzen
map.on('pointerdrag', function (evt) {
// map.on('moveend', function (evt) {
//   console.log("MoveEnd");

  let hit = this.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
    return true;
  });
  if (hit) {
    // this.getTargetElement().style.cursor = 'all-scroll';
    this.getTargetElement().style.cursor = 'move';
    // this.getTargetElement().style.cursor = 'grab';  map.getLonLatFromPixel(e.xy)

    // console.log("ol.proj.toLonLat", ol.proj.toLonLat(evt.pixel), "Pixel", evt.pixel);//map.getLonLatFromPixel(evt.pixel));//);
    console.log(toLonLat(evt.coordinate));

    // window.addEventListener("mouseup", (evt) => {
    //   console.log("mouseUp, evt", evt);
    // });


  } else {
    this.getTargetElement().style.cursor = '';
  }


});








function setTanslationsToMap(map_parameter)
{
  for (let i = 0; i < translate.length; i++) {
    map_parameter.addInteraction(translate[i]);
  }
}

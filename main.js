import './style.css';
import {Feature, Map, View} from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import WMTS from 'ol/source/WMTS';
import TileLayer from 'ol/layer/Tile';
import { useGeographic } from 'ol/proj';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import { Point } from 'ol/geom';
import { Translate } from 'ol/interaction';
import GeoJSON from 'ol/format/GeoJSON';
import { containsXY } from 'ol/extent';
import LayerGroup from 'ol/layer/Group';
import LayerSwitcher from 'ol-layerswitcher';

useGeographic();

const geojsonFormat = new GeoJSON();

const baseLayerGroup = new LayerGroup({
  title: 'Basiskarten',
  layers: [
    // Beispiel für die ganze Welt
    new TileLayer({
      // title und `type: 'base'` sind erforderlich, damit die LayerSwitcher-Komponente funktioniert
      title: 'OSM',
      // radio button statt checkbox
      type: 'base',
      source: new OSM(),
      visible: false
    }),
    // Beispiel für Deutschland, obwohl die Karte für die ganze Welt verfügbar wäre
    new TileLayer({
      title: 'Deutschland',
      type: 'base',
      source: new XYZ({
        url:
          'https://server.arcgisonline.com/ArcGIS/rest/services/' +
          'World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      }),
      extent: [5.9, 47.2, 15.1, 55.1],
      visible: false
    }),
    // Beispiel für Österreich
    new TileLayer({
      title: 'Österreich',
      type: 'base',
      source: new XYZ({
        url: 'https://maps.wien.gv.at/basemap/geolandbasemap/normal/google3857/{z}/{y}/{x}.png'
      }),
      extent: [8.782379, 46.358770, 17.5, 49.037872],
      visible: false
    }),
  ]
});

// Position und Zoomstufe der Karte; Position ist genau der Mittelpunkt der Karts 9.5788, 48.9773
// fastgmbh-de wird verwendet
const longitude = 9.4458;//9.417404175; //
const latitude = 48.9823;//49.214561462; //

// Oberpullendorf, Österreich - fastgmbh-at wird verwendet
// const longitude = 16.5;//9.417404175; //
// const latitude = 47.5;//49.214561462; //

// Irgendwo im Nordwesten der USA - OSM wird verwendet
// const longitude = -116.5;//9.417404175; //
// const latitude = 47.5;//49.214561462; //

const haveVisibleLayer = false;
// Array.prototype.some() führt die Funktion für jedes Element aus, bis die Funktion true zurückgibt
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
const haveBaseLayer = baseLayerGroup.getLayers().getArray().some((layer) => {
  if (layer.getExtent() && containsXY(layer.getExtent(), longitude, latitude)) {
    layer.setVisible(true);
    return true;
  }
});
if (!haveBaseLayer) {
  // Wenn keine passende Basiskarte gefunden wurde, wird die erste Basiskarte verwendet
  baseLayerGroup.getLayers().getArray()[0].setVisible(true);
}

const zoom = 18;
const centralCoord = [longitude, latitude];

const feature = [
  setIcon([9.44564, 48.98198], 'Repeater_30_30.png'),
  setIcon([9.44574, 48.98232], 'LoggerNL.png'),
  setIcon([9.44585, 48.98228], 'LoggerPL.png'),
  setIcon([9.44668, 48.98201], 'Master_30_30.png'),
  setIcon([longitude + 0.00005, latitude - 0.0001], 'LoggerL.png')
];

const vector = new VectorLayer({
  title: 'Icons',
  style(feature) {
    return new Style({
      image: new Icon(({
        anchor: [0.5, 0.96],
        src: feature.get('icon')
      }))
    });
  },
  source: new VectorSource({
    features: feature
  })
})

const map = new Map({
  target: 'map',
  layers: [
    baseLayerGroup,
    vector
  ],
  view: new View({
    center: centralCoord,
    zoom: zoom
  })
});

const layerSwitcher = new LayerSwitcher({
  groupSelectStyle: 'group'
});
map.addControl(layerSwitcher);

map.on('pointermove', (e) => {
  if (e.dragging) {
    return;
  }
  const hit = map.hasFeatureAtPixel(e.pixel);
  if (hit) {
    map.getViewport().classList.add('force-cursor-move');
  } else {
    map.getViewport().classList.remove('force-cursor-move');
  }
});

let featureBeingDragged;
// Verschieben der Marker
const translate = new Translate({
  features: vector.getSource().getFeaturesCollection()
});
map.addInteraction(translate);
translate.on('translateend', () => {
  const geojson = geojsonFormat.writeFeatureObject(featureBeingDragged);
  // const xhr = new XMLHttpRequest();
  // xhr.open('PUT', 'http://myServer/feature/abc.php');
  // body setzen?
  // xhr.send();
  // oder moderner:
  // fetch('http://myServer/feature/abc.php', {
  //   method: 'PUT',
  //   body: JSON.stringify(geojson)
  // });
  console.log(geojson);
});


function setIcon(coord, img) {
  const marker = new Point(coord);
  const featureMarker = new Feature(marker);
  featureMarker.set('icon', './images/' + img);
  featureMarker.getGeometry().on('change', function (e) {
    featureBeingDragged = featureMarker;
  });
  return featureMarker;
}

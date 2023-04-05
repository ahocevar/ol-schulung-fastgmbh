import './style.css';
import {Feature, Map, Overlay, View} from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';
import { useGeographic } from 'ol/proj';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import CircleStyle from 'ol/style/Circle';
import { LineString, Point, Polygon } from 'ol/geom';
import { DragZoom, Draw, Modify, Snap, Translate, defaults } from 'ol/interaction';
import GeoJSON from 'ol/format/GeoJSON';
import { containsXY } from 'ol/extent';
import LayerGroup from 'ol/layer/Group';
import LayerSwitcher from 'ol-layerswitcher';
//import MousePosition from 'ol/control/MousePosition';
import {toStringHDMS} from 'ol/coordinate';
import Text from 'ol/style/Text';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import { primaryAction } from 'ol/events/condition';
import { asArray } from 'ol/color';
import { getDistance, getLength } from 'ol/sphere';
import RegularShape from 'ol/style/RegularShape';

let featureId = 1000;
function setIcon(coord, img) {
  const marker = new Point(coord);
  const featureMarker = new Feature(marker);
  featureMarker.setId(featureId++);
  featureMarker.set('icon', './images/' + img);
  featureMarker.set('xyz', 'mein wert');
  featureMarker.getGeometry().on('change', function (e) {
    featureBeingDragged = featureMarker;
  });
  return featureMarker;
}

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

const labelsID = (feature) => {
  return [
    new Style({
      image: new Icon(({
        // Icons werden immer dargestellt, auch wenn sie sich überlagern
        declutterMode: 'none',
        anchor: [0.5, 0.96],
        src: feature.get('icon')
      }))
    }),
    new Style({
      text: new Text({
        // Text wird nur dargestellt, wenn er nicht überlagert wird (`declutter: true` am Layer)
        text: String(feature.getId()),
        font: '16px sans-serif',
        textAlign: 'left',
        offsetX: 10,
        textBaseline: 'bottom',
      })
    })
  ];
};

const labelsNone = (feature) => {
  return new Style({
    image: new Icon(({
      // Icons werden immer dargestellt, auch wenn sie sich überlagern
      declutterMode: 'none',
      anchor: [0.5, 0.96],
      src: feature.get('icon')
    }))
  });
};

let iconStyle = labelsID;

const iconSource = new VectorSource({
  features: feature
})

const iconsLogger = new VectorLayer({
  title: 'Bidi-Logger',
  // Alternative zum automatischen Reinzoomen, wenn nicht alle Labels Platz haben
  declutter: true,
  // Eventuell hier nicht auf `feature.get('icon')...` filtern, sondern aufgrund eines eigenen Attributs,
  // z.B. `feature.get('type') === 'Logger'`
  style: (feature) => feature.get('icon').includes('Logger') && iconStyle(feature),
  source: iconSource
});
const iconsRouter = new VectorLayer({
  title: 'Router',
  declutter: true,
  // Eventuell hier nicht auf `feature.get('icon')...` filtern, sondern aufgrund eines eigenen Attributs,
  // z.B. `feature.get('type') === 'Router'`
  style: (feature) => feature.get('icon').includes('Repeater') && iconStyle(feature),
  source: iconSource
});
const iconsSmartbridge = new VectorLayer({
  title: 'Smartbridge',
  declutter: true,
  // Eventuell hier nicht auf `feature.get('icon')...` filtern, sondern aufgrund eines eigenen Attributs,
  // z.B. `feature.get('type') === 'Smartbridge'`
  style: (feature) => feature.get('icon').includes('Master') && iconStyle(feature),
  source: iconSource
});

const polygonFeature = new Feature(new Polygon([[[9.44564, 48.98198], [9.44574, 48.98232], [9.44585, 48.98228], [9.44668, 48.98201], [9.44564, 48.98198]]]));
polygonFeature.set('color', 'green');

const polygons = new VectorLayer({
  title: 'Polygone',
  source: new VectorSource({
    features: [polygonFeature]
  }),
  style(feature) {
    const baseColor = asArray(feature.get('color') || 'pink');
    return new Style({
      stroke: new Stroke({
        color: baseColor,
        width: 2
      }),
      fill: new Fill({
        // `...` ist die Spread-Syntax, siehe https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
        color: [...baseColor.slice(0, 3), 0.3]
      })
    });
  }
});

const map = new Map({
  target: 'map',
  interactions: defaults({
    shiftDragZoom: false
  }),
  layers: [
    baseLayerGroup,
    polygons,
    iconsLogger,
    iconsRouter,
    iconsSmartbridge
  ],
  view: new View({
    center: centralCoord,
    zoom: zoom
  })
});

const layerSwitcher = new LayerSwitcher({
  activationMode: 'click',
  groupSelectStyle: 'group'
});
map.addControl(layerSwitcher);

// const mousePosition = new MousePosition({
//   coordinateFormat: toStringHDMS,
//   target: 'mouse-position',
// });
// map.addControl(mousePosition);

const mousePositionDiv = document.getElementById('mouse-position');
map.on('pointermove', (e) => {
  // mousePositionDiv.style.left = e.pixel[0] + 'px';
  // mousePositionDiv.style.top = e.pixel[1] + 'px';
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

/**
 * Elements that make up the popup.
 */
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

/**
 * Create an overlay to anchor the popup to the map.
 */
const overlay = new Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});
overlay.setMap(map);

/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

/**
 * Add a click handler to the map to render the popup.
 */
map.on('singleclick', function (evt) {
  if (activeTool !== 'drag' && activeTool !== 'zoom') {
    return;
  }
  const [feature] = map.getFeaturesAtPixel(evt.pixel);
  // ist equivalent zu
  // const features = map.getFeaturesAtPixel(evt.pixel);
  // const feature = features[0];
  let featureInfo = '';
  if (feature) {
    const properties = feature.getProperties();
    // Objekt mit folgendem Aufbau:
    // {
    //   "geometry": ...
    //   "icon": "Repeater_30_30.png",
    //   "xyz": "mein wert"
    // }
    featureInfo = Object.keys(properties).map((key) => {
      if (key === feature.getGeometryName()) {
        return `<p>Koordinaten: ${properties[key].getCoordinates()}</p>`
      }
      return `<p>${key}: ${properties[key]}</p>`;
    }).join('');
    // ['1', 'a'].join('') => '1a'
    // ['1', 'a'].join(' ') => '1 a'

  }
  const coordinate = evt.coordinate;
  const hdms = toStringHDMS(coordinate);

  content.innerHTML = '<p>You clicked here:</p><code>' + hdms + '</code>' + featureInfo;
  overlay.setPosition(coordinate);
});

let featureBeingDragged;
// Verschieben der Marker
const translate = new Translate({
  features: iconSource.getFeaturesCollection()
});
map.addInteraction(translate);
translate.on('translatestart', (e) => {
  // Suchkreis und Suchfeld löschen, weil die Position nicht mehr aktuell ist
  search.reset();
});
translate.on('translateend', () => {
  if (!featureBeingDragged) {
    return;
  }
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

const boxZoom = new DragZoom({
  condition: primaryAction
});
boxZoom.setActive(false);
map.addInteraction(boxZoom);

const polygonSource = polygons.getSource();
const modify = new Modify({source: polygonSource});
modify.on('modifyend', (e) => {
  console.log(geojsonFormat.writeFeatureObject(e.features.item(0)))
  // Hier AJAX Aufruf zum Speichern des Polygons
});
modify.setActive(false);
map.addInteraction(modify);

const draw = new Draw({
  source: polygonSource,
  type: 'Polygon',
});
draw.on('drawend', (e) => {
  // `prompt` durch Color Picker ersetzen
  const color = prompt('Farbe?');
  e.feature.set('color', color);
  console.log(geojsonFormat.writeFeatureObject(e.feature));
  // Hier AJAX Aufruf zum Speichern des Polygons
});
draw.setActive(false);
map.addInteraction(draw);

const snap = new Snap({source: polygonSource});
snap.setActive(false);
map.addInteraction(snap);

const measureRadius = new Draw({
  type: 'Circle',
  style(feature) {
    let length = 0;
    // Array destructuring, mich interessiert nur der 2. Wert im Array
    const [,sketch] = measureRadius.getOverlay().getSource().getFeatures();
    const geometryType = feature.getGeometry().getType();
    if (sketch && geometryType === 'Circle') {
      console.log(sketch.getGeometry().getCoordinates());
      const center = feature.getGeometry().getCenter();
      const cursor = sketch.getGeometry().getCoordinates();
      const line = new LineString([center, cursor]);
      length = getDistance(center, cursor);
      // Hier entscheiden, ob km oder m, und zusätzlich Anzeige von feet bzw. miles
      const formattedLength = `${Math.round(length)} m`;
      // return: style für Kreis + Radius + Text
      return [
        new Style({
          stroke: new Stroke({
            color: 'rgba(255, 0, 0, 0.5)',
            width: 2,
          }),
        }),
        new Style({
          geometry: line,
          stroke: new Stroke({
            color: 'rgba(255, 0, 0, 0.5)',
            width: 2,
          }),
          text: new Text({
            text: formattedLength,
            font: '16px sans-serif',
            placement: 'line',
            textBaseline: 'bottom',
          })
        })
      ]
    }
    // return: style für Punkt am Cursor
    return [
      new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)',
          }),
          stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0.5)',
            width: 2,
          }),
        })
      }),
    ]
  }
});
measureRadius.setActive(false);
map.addInteraction(measureRadius);

const measureDistance = new Draw({
  type: 'LineString',
  style(feature) {
    if (feature.getGeometry().getType() === 'Point') {
      const [sketch] = measureDistance.getOverlay().getSource().getFeatures();
      const length = getLength(sketch.getGeometry(), {projection: 'EPSG:4326'});
      // Formatieren Länge, Umrechnung etc.
      const formattedLength = `${Math.round(length)} m`;
      // Style für Punkt am Cursor
      return new Style({
        image: new RegularShape({
          radius: 5,
          points: 4,
          angle: Math.PI / 4,
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)',
          }),
          stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0.5)',
            width: 2,
          }),
        }),
        text: new Text({
          text: formattedLength,
          font: '16px sans-serif',
          textAlign: 'left',
          offsetX: 10,
        })
      });
    }
    // Style für Linie
    return new Style({
      stroke: new Stroke({
        color: 'rgba(255, 0, 0, 0.5)',
        width: 2,
      }),
    });
  }
});
measureDistance.setActive(false);
map.addInteraction(measureDistance);

function deactivateAllInteractions() {
  translate.setActive(false);
  boxZoom.setActive(false);
  modify.setActive(false);
  draw.setActive(false);
  snap.setActive(false);
  measureRadius.setActive(false);
  measureDistance.setActive(false);
}

const tool = document.getElementById('tools')['selected-tool'];
let activeTool = 'drag';
tool.forEach((option) => {
  option.addEventListener('change', (e) => {
    activeTool = e.target.value;
    deactivateAllInteractions();
    switch(activeTool) {
      case 'drag':
        translate.setActive(true);
        break;
      case 'zoom':
        boxZoom.setActive(true);
        break;
      case 'polygon':
        modify.setActive(true);
        draw.setActive(true);
        snap.setActive(true);
        break;
      case 'radius':
        measureRadius.setActive(true);
        break;
      case 'distance':
        measureDistance.setActive(true);
        break;
      default:
        // do nothing
    }
  });
});

const labels = document.getElementById('labels')['selected-label'];
labels.forEach((option) => {
  option.addEventListener('change', (e) => {
    switch(e.target.value) {
      case 'none':
        iconStyle = labelsNone;
        // Redraw der Icons, damit die Änderung des iconStyle wirksam wird
        iconSource.changed();
        break;
      case 'id':
        iconStyle = labelsID;
        // Redraw der Icons, damit die Änderung des iconStyle wirksam wird
        iconSource.changed();
        break;
      default:
        // do nothing
    }
  });
});

// Overlay für Kreis zum Markieren des Suchergebnisses
const searchOverlay = new Overlay({
  element: document.getElementById('search-overlay'),
  positioning: 'center-center',
  stopEvent: false,
  insertFirst: true
});
searchOverlay.setMap(map);

// Suchfunktion
const search = document.getElementById('search');
search.addEventListener('submit', (e) => {
  e.preventDefault();
  const searchValue = document.getElementById('search-input').value;
  if (searchValue === '') {
    return;
  }
  const searchResult = iconSource.getFeatures().find((feature) => {
    return String(feature.getId()) === searchValue;
  });
  if (searchResult) {
    const coordinates = searchResult.getGeometry().getCoordinates();
    searchOverlay.setPosition(coordinates);
    map.getView().animate({
      center: coordinates,
      zoom: 18,
      duration: 500,
    });
  }
});
search.addEventListener('reset', (e) => {
  // Bei Reset der Suche wird der Kreis entfernt
  searchOverlay.setPosition(undefined);
});
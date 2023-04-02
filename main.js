import './style.css';
import {Feature, Map, View} from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import { useGeographic } from 'ol/proj';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import { Point } from 'ol/geom';
import { Translate } from 'ol/interaction';

useGeographic();

// Position und Zoomstufe der Karte; Position ist genau der Mittelpunkt der Karts 9.5788, 48.9773
const longitude = 9.4458;//9.417404175; //
const latitude = 48.9823;//49.214561462; //
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
    new TileLayer({
      source: new OSM()
    }),
    vector
  ],
  view: new View({
    center: centralCoord,
    zoom: zoom
  })
});

// Verschieben der Marker
map.addInteraction(new Translate({
  features: vector.getSource().getFeaturesCollection()
}));

function setIcon(coord, img) {
  const marker = new Point(coord);
  const featureMarker = new Feature(marker);
  featureMarker.set('icon', './images/' + img);
  return featureMarker;
}

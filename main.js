mapboxgl.accessToken = 'pk.eyJ1IjoibG9iZW5pY2hvdSIsImEiOiJjajdrb2czcDQwcHR5MnFycmhuZmo4eWwyIn0.nUf9dWGNVRnMApuhQ44VSw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/lobenichou/cjto9zfpj00jq1fs7gajbuaas',
  center: [-79.381000, 43.646000],
  zoom: 1.8,
  center: [0, 20]
});

const current_fuel = 'hydro'

const colors = ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f'];

const hydro = ['==', ['get', 'fuel1'], 'Hydro'];
const solar = ['==', ['get', 'fuel1'], 'Solar'];
const wind = ['==', ['get', 'fuel1'], 'Wind'];
const gas = ['==', ['get', 'fuel1'], 'Gas'];
const oil = ['==', ['get', 'fuel1'], 'Oil'];
const coal = ['==', ['get', 'fuel1'], 'Coal'];
const biomass = ['==', ['get', 'fuel1'], 'Biomass'];
const waste = ['==', ['get', 'fuel1'], 'Waste'];
const nuclear = ['==', ['get', 'fuel1'], 'Nuclear'];
const geothermal = ['==', ['get', 'fuel1'], 'Geothermal'];
const others = ['all', ['==', ['get', 'fuel1'], 'Cogeneration'], ['==', ['get', 'fuel1'], 'Storage'], ['==', ['get', 'fuel1'], 'Other'], ['==', ['get', 'fuel1'], 'Wave and Tidel'], ['==', ['get', 'fuel1'], 'Petcoke'], ['==', ['get', 'fuel1'], '']]

map.on('load', () => {
  // add a clustered GeoJSON source for powerplant
  map.addSource('powerplants', {
    'type': 'geojson',
    'data': powerplants,
    'cluster': true,
    'clusterRadius': 80,
    'clusterProperties': { // keep separate counts for each fuel category in a cluster
      'hydro': ['+', ['case', hydro, 1, 0]],
      'solar': ['+', ['case', solar, 1, 0]],
      'wind': ['+', ['case', wind, 1, 0]],
      'gas': ['+', ['case', gas, 1, 0]],
      'oil': ['+', ['case', oil, 1, 0]],
      'coal': ['+', ['case', coal, 1, 0]],
      'biomass': ['+', ['case', biomass, 1, 0]],
      'waste': ['+', ['case', waste, 1, 0]],
      'nuclear': ['+', ['case', nuclear, 1, 0]],
      'geothermal': ['+', ['case', geothermal, 1, 0]],
      'others': ['+', ['case', others, 1, 0]]
    }
  });

  map.addLayer({
    'id': 'powerplant_cluster',
    'type': 'circle',
    'source': 'powerplants',
    'filter': [
      'all',
      ['>', ['get', current_fuel], 1],
      ['==', ['get', 'cluster'], true]
    ],
    'paint': {
      'circle-color': 'rgba(0,0,0,.6)',
      'circle-radius': [
        'step',
        ['get', current_fuel],
        20,
        100,
        30,
        750,
        40
      ],
      'circle-stroke-color': colors[0],
      'circle-stroke-width': 5
    }
  });

  map.addLayer({
    'id': 'powerplant_cluster_label',
    'type': 'symbol',
    'source': 'powerplants',
    'filter': [
      'all',
      ['>', ['get', current_fuel], 1],
      ['==', ['get', 'cluster'], true]
    ],
    'layout': {
      'text-field': ['number-format', ['get', current_fuel], {}],
      'text-font': ['Montserrat Bold', 'Arial Unicode MS Bold'],
      'text-size': 13
    },
    'paint': {
    'text-color': colors[0]
    }
  });

  map.addLayer({
      'id': 'powerplant_individual',
      'type': 'circle',
      'source': 'powerplants',
      'filter': [
        'all',
        hydro,
        ['!=', ['get', 'cluster'], true]
      ],
      'paint': {
      'circle-color': colors[0],
      'circle-radius': 5
      }
    });


    map.addLayer({
        'id': 'powerplant_individual_outer',
        'type': 'circle',
        'source': 'powerplants',
        'filter': [
          'all',
          hydro,
          ['!=', ['get', 'cluster'], true]
        ],
        'paint': {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': colors[0],
        'circle-stroke-width': 3,
        'circle-radius': 10
        }
      });
});

mapboxgl.accessToken = 'pk.eyJ1IjoibG9iZW5pY2hvdSIsImEiOiJjbDlxMG02dHkwZDdpM29wNTNuNWtrNGh1In0.KfP9aLlufb9N0BqnvSnmMA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/lobenichou/cjto9zfpj00jq1fs7gajbuaas?fresh=true',
  center: [-79.381000, 43.646000],
  zoom: 1.8,
  center: [0, 20]
});

const colors = ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5'];

const colorScale = d3.scaleOrdinal()
  .domain(["hydro", "solar", "wind", "gas", "oil","coal", "biomass", "waste", "nuclear", "geothermal", "others"])
  .range(colors)

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
const others = ['any',
  ['==', ['get', 'fuel1'], 'Cogeneration'],
  ['==', ['get', 'fuel1'], 'Storage'],
  ['==', ['get', 'fuel1'], 'Other'],
  ['==', ['get', 'fuel1'], 'Wave and Tidel'],
  ['==', ['get', 'fuel1'], 'Petcoke'],
  ['==', ['get', 'fuel1'], '']
];

map.on('load', () => {
  // add a clustered GeoJSON source for powerplant
  map.addSource('powerplants', {
    'type': 'geojson',
    'data': powerplants,
    'cluster': true,
    'clusterRadius': 100,
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
    'id': 'powerplant_individual',
    'type': 'circle',
    'source': 'powerplants',
    'filter': ['!=', ['get', 'cluster'], true],
    'paint': {
      'circle-color': ['case',
        hydro, colorScale('hydro'),
        solar, colorScale('solar'),
        wind, colorScale('wind'),
        gas, colorScale('gas'),
        oil, colorScale('oil'),
        coal, colorScale('coal'),
        biomass, colorScale('biomass'),
        waste, colorScale('waste'),
        nuclear, colorScale('nuclear'),
        geothermal, colorScale('geothermal'),
        others, colorScale('others'), '#ffed6f'],
      'circle-radius': 5
    }
  });

    map.addLayer({
      'id': 'powerplant_individual_outer',
      'type': 'circle',
      'source': 'powerplants',
      'filter': ['!=', ['get', 'cluster'], true],
      'paint': {
        'circle-stroke-color': ['case',
          hydro, colorScale('hydro'),
          solar, colorScale('solar'),
          wind, colorScale('wind'),
          gas, colorScale('gas'),
          oil, colorScale('oil'),
          coal, colorScale('coal'),
          biomass, colorScale('biomass'),
          waste, colorScale('waste'),
          nuclear, colorScale('nuclear'),
          geothermal, colorScale('geothermal'),
          others, colorScale('others'), '#ffed6f'],
        'circle-stroke-width': 2,
        'circle-radius': 10,
        'circle-color': "rgba(0, 0, 0, 0)"
      }
    });



    let markers = {};
    let markersOnScreen = {};
    let point_counts = [];
    let totals;

    const getPointCount = (features) => {
      features.forEach(f => {
        if (f.properties.cluster) {
          point_counts.push(f.properties.point_count)
        }
      })

      return point_counts;
    };

    const updateMarkers = () => {
      document.getElementById('key').innerHTML = '';
      let newMarkers = {};
      const features = map.querySourceFeatures('powerplants');
      totals = getPointCount(features);
      features.forEach((feature) => {
        const coordinates = feature.geometry.coordinates;
        const props = feature.properties;

        if (!props.cluster) {
          return;
        };


        const id = props.cluster_id;

        let marker = markers[id];
        if (!marker) {
          const el = createDonutChart(props, totals);
          marker = markers[id] = new mapboxgl.Marker({
            element: el
          })
          .setLngLat(coordinates)
        }

        newMarkers[id] = marker;

        if (!markersOnScreen[id]) {
          marker.addTo(map);
        }
      });

      for (id in markersOnScreen) {
        if (!newMarkers[id]) {
          markersOnScreen[id].remove();
        }
      }
        markersOnScreen = newMarkers;
    };

    const createDonutChart = (props, totals) => {
      const div = document.createElement('div');
      const data = [
        {type: 'hydro', count: props.hydro},
        {type: 'solar', count: props.solar},
        {type: 'wind', count: props.wind},
        {type: 'oil', count: props.oil},
        {type: 'gas', count: props.gas},
        {type: 'coal', count: props.coal},
        {type: 'biomass', count: props.biomass},
        {type: 'waste', count: props.waste},
        {type: 'nuclear', count: props.nuclear},
        {type: 'geothermal', count: props.geothermal},
        {type: 'others', count: props.others},
      ];

      const thickness = 10;
      const scale = d3.scaleLinear()
        .domain([d3.min(totals), d3.max(totals)])
        .range([500, d3.max(totals)])

      const radius = Math.sqrt(scale(props.point_count));
      const circleRadius = radius - thickness;

      const svg = d3.select(div)
        .append('svg')
        .attr('class', 'pie')
        .attr('width', radius * 2)
        .attr('height', radius * 2);

      //center
      const g = svg.append('g')
        .attr('transform', `translate(${radius}, ${radius})`);

      const arc = d3.arc()
        .innerRadius(radius - thickness)
        .outerRadius(radius);

      const pie = d3.pie()
        .value(d => d.count)
        .sort(null);

      const path = g.selectAll('path')
        .data(pie(data.sort((x, y) => d3.ascending(y.count, x.count))))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', (d) => colorScale(d.data.type))

      const circle = g.append('circle')
        .attr('r', circleRadius)
        .attr('fill', 'rgba(0, 0, 0, 0.7)')
        .attr('class', 'center-circle')

      const text = g
        .append("text")
        .attr("class", "total")
        .text(props.point_count_abbreviated)
        .attr('text-anchor', 'middle')
        .attr('dy', 5)
        .attr('fill', 'white')

        const infoEl = createTable(props);

        svg.on('click', () => {
          d3.selectAll('.center-circle').attr('fill', 'rgba(0, 0, 0, 0.7)')
          circle.attr('fill', 'rgb(71, 79, 102)')
          document.getElementById('key').innerHTML = '';
          document.getElementById('key').append(infoEl);
        })

      return div;
    }

    const createTable = (props) => {
      const getPerc = (count) => {
        return count/props.point_count;
      };

      const data = [
        {type: 'hydro', perc: getPerc(props.hydro)},
        {type: 'solar', perc: getPerc(props.solar)},
        {type: 'wind', perc: getPerc(props.wind)},
        {type: 'oil', perc: getPerc(props.oil)},
        {type: 'gas', perc: getPerc(props.gas)},
        {type: 'coal', perc: getPerc(props.coal)},
        {type: 'biomass', perc: getPerc(props.biomass)},
        {type: 'waste', perc: getPerc(props.waste)},
        {type: 'nuclear', perc: getPerc(props.nuclear)},
        {type: 'geothermal', perc: getPerc(props.geothermal)},
        {type: 'others', perc: getPerc(props.others)},
      ];

      const columns = ['type', 'perc']
      const div = document.createElement('div');
      const table = d3.select(div).append('table').attr('class', 'table')
  		const thead = table.append('thead')
  		const	tbody = table.append('tbody');

  		thead.append('tr')
  		  .selectAll('th')
  		  .data(columns).enter()
  		  .append('th')
		    .text((d) => {
          let colName = d === 'perc' ? '%' : 'Fuel Type'
          return colName;
        })

  		const rows = tbody.selectAll('tr')
  		  .data(data.filter(i => i.perc).sort((x, y) => d3.descending(x.perc, y.perc)))
  		  .enter()
  		  .append('tr')
        .style('border-left', (d) => `20px solid ${colorScale(d.type)}`);

  		// create a cell in each row for each column
  		const cells = rows.selectAll('td')
  		  .data((row) => {
  		    return columns.map((column) => {
            let val = column === 'perc' ? d3.format(".2%")(row[column]) : row[column];
  		      return {column: column, value: val};
  		    });
  		  })
  		  .enter()
  		  .append('td')
		    .text((d) => d.value)
        .style('text-transform', 'capitalize')

  	  return div;
    }

    map.on('data', (e) => {
      if (e.sourceId !== 'powerplants' || !e.isSourceLoaded) return;

      map.on('move', updateMarkers);
      map.on('moveend', updateMarkers);
      updateMarkers();
    });
});

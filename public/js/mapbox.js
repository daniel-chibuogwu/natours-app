/* eslint-disable */

export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiY2hpbGxpbmdzIiwiYSI6ImNsdTMxc2Y4bjB0YnUya3BkejNwc2l6NXUifQ.LPZx1bg5a5EjVOIFPtQgRQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/chillings/clu349lmo00r701qs9sys8cmq',
    scrollZoom: false,
    //   center: [-118.244937, 34.057402],
    //   zoom: 10,
    //   interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create Marker
    const el = document.createElement('div');
    el.className = 'marker';

    //  Add the marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom', // sets the portion of the marker that points to the exact location on the map
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include this location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};

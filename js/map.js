// Map module: Leaflet setup, click handling, visual feedback
const GameMap = (() => {
  let map = null;
  let clickHandler = null;
  let markers = [];   // pins, lines, etc.
  let overlays = [];  // neighborhood highlight layers
  let clickEnabled = false;

  function init() {
    map = L.map('map', {
      center: [40.7128, -74.006],
      zoom: 11,
      minZoom: 10,
      maxZoom: 16,
      maxBounds: [[40.47, -74.30], [40.95, -73.65]],
      maxBoundsViscosity: 1.0,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    map.on('click', (e) => {
      if (clickEnabled && clickHandler) {
        clickHandler(e.latlng);
      }
    });
  }

  function onMapClick(handler) {
    clickHandler = handler;
  }

  function enableClick() { clickEnabled = true; }
  function disableClick() { clickEnabled = false; }

  // Drop a pin at the guessed location
  function placePin(latlng) {
    const icon = L.divIcon({
      className: 'pin-marker',
      html: `<svg width="24" height="36" viewBox="0 0 24 36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#e94560"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`,
      iconSize: [24, 36],
      iconAnchor: [12, 36]
    });
    const marker = L.marker(latlng, { icon }).addTo(map);
    markers.push(marker);
    return marker;
  }

  // Highlight the correct neighborhood
  function showCorrectNeighborhood(feature) {
    const layer = L.geoJSON(feature, {
      style: {
        color: '#4ecdc4',
        weight: 3,
        fillColor: '#4ecdc4',
        fillOpacity: 0.3
      }
    }).addTo(map);
    overlays.push(layer);
  }

  // Highlight the guessed neighborhood (if different from correct)
  function showGuessedNeighborhood(feature) {
    const layer = L.geoJSON(feature, {
      style: {
        color: '#e94560',
        weight: 2,
        dashArray: '6',
        fillColor: '#e94560',
        fillOpacity: 0.15
      }
    }).addTo(map);
    overlays.push(layer);
  }

  // Draw a line from guess to correct centroid
  function drawLine(from, to) {
    const line = L.polyline([from, to], {
      color: '#ffffff',
      weight: 2,
      dashArray: '8, 8',
      opacity: 0.6
    }).addTo(map);
    markers.push(line);
  }

  // Place a small marker at correct centroid
  function placeCorrectMarker(latlng) {
    const icon = L.divIcon({
      className: '',
      html: `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#4ecdc4" stroke="white" stroke-width="2"/></svg>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    const marker = L.marker(latlng, { icon }).addTo(map);
    markers.push(marker);
  }

  // Clear all markers and overlays between rounds
  function clear() {
    markers.forEach(m => map.removeLayer(m));
    overlays.forEach(l => map.removeLayer(l));
    markers = [];
    overlays = [];
  }

  // Reset map view
  function resetView() {
    map.setView([40.7128, -74.006], 11);
  }

  return { init, onMapClick, enableClick, disableClick, placePin, showCorrectNeighborhood, showGuessedNeighborhood, drawLine, placeCorrectMarker, clear, resetView };
})();

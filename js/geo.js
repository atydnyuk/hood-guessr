// Geo module: data loading, point-in-polygon, BFS distance
const Geo = (() => {
  let neighborhoods = null; // GeoJSON FeatureCollection
  let adjacency = null;     // { name: [neighbor1, ...] }

  async function loadData() {
    const [geoRes, adjRes] = await Promise.all([
      fetch('data/neighborhoods.geojson'),
      fetch('data/adjacency.json')
    ]);
    neighborhoods = await geoRes.json();
    adjacency = await adjRes.json();
    return { neighborhoods, adjacency };
  }

  function getNeighborhoods() {
    return neighborhoods;
  }

  // Find which neighborhood a lat/lng falls in. Returns feature or null.
  function findNeighborhood(lat, lng) {
    const point = turf.point([lng, lat]);
    for (const feature of neighborhoods.features) {
      if (turf.booleanPointInPolygon(point, feature)) {
        return feature;
      }
    }
    return null;
  }

  // BFS shortest path distance between two neighborhood names.
  // Returns 0 if same, 1 if adjacent, etc. Infinity if unreachable.
  function getDistance(nameA, nameB) {
    if (nameA === nameB) return 0;
    if (!adjacency[nameA] || !adjacency[nameB]) return Infinity;

    const visited = new Set([nameA]);
    let queue = [nameA];
    let depth = 0;

    while (queue.length > 0) {
      depth++;
      const next = [];
      for (const current of queue) {
        for (const neighbor of (adjacency[current] || [])) {
          if (neighbor === nameB) return depth;
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            next.push(neighbor);
          }
        }
      }
      queue = next;
    }
    return Infinity;
  }

  // Pick n random neighborhoods, attempting borough diversity
  function getRandomNeighborhoods(n) {
    const features = [...neighborhoods.features];
    // Shuffle
    for (let i = features.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [features[i], features[j]] = [features[j], features[i]];
    }
    return features.slice(0, n);
  }

  // Get centroid of a feature
  function getCentroid(feature) {
    const c = turf.centroid(feature);
    return [c.geometry.coordinates[1], c.geometry.coordinates[0]]; // [lat, lng]
  }

  // Get feature by name
  function getFeatureByName(name) {
    return neighborhoods.features.find(f => f.properties.name === name) || null;
  }

  return { loadData, getNeighborhoods, findNeighborhood, getDistance, getRandomNeighborhoods, getCentroid, getFeatureByName };
})();

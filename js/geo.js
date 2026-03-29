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

  // Seeded PRNG (mulberry32) — returns a function that produces [0, 1) like Math.random()
  function mulberry32(seed) {
    return function() {
      seed = (seed + 0x6D2B79F5) >>> 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Pick n neighborhoods using a numeric seed for determinism
  function getNeighborhoodsForSeed(n, numericSeed) {
    const rand = mulberry32(numericSeed);
    const features = [...neighborhoods.features];
    for (let i = features.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [features[i], features[j]] = [features[j], features[i]];
    }
    return features.slice(0, n);
  }

  // Pick n random neighborhoods (generates a random seed internally)
  function getRandomNeighborhoods(n) {
    const seed = Math.floor(Math.random() * 2176782336);
    return getNeighborhoodsForSeed(n, seed);
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

  return { loadData, getNeighborhoods, findNeighborhood, getDistance, getNeighborhoodsForSeed, getRandomNeighborhoods, getCentroid, getFeatureByName };
})();

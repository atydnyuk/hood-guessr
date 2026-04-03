#!/usr/bin/env node
// Compute neighborhood adjacency graph from GeoJSON polygons.
// Two neighborhoods are adjacent if their boundaries come within ~50m of each other.
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'neighborhoods.geojson'), 'utf8'));
const features = data.features;

// Extract all boundary line segments for each feature
function getBoundaryPoints(geometry) {
  const points = [];
  function extract(coords, depth) {
    if (depth === 0) {
      points.push(coords);
    } else {
      coords.forEach(c => extract(c, depth - 1));
    }
  }
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(ring => ring.forEach(pt => points.push(pt)));
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(poly => poly.forEach(ring => ring.forEach(pt => points.push(pt))));
  }
  return points;
}

// Sample boundary points for each neighborhood
const boundaries = features.map(f => ({
  name: f.properties.name,
  points: getBoundaryPoints(f.geometry)
}));

// Precompute bounding boxes for fast rejection
boundaries.forEach(b => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of b.points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  b.bbox = { minX, maxX, minY, maxY };
});

// Check if two neighborhoods share a border (any boundary points within threshold)
// Using ~0.0005 degrees ≈ ~50m threshold
const THRESHOLD = 0.0005;
const THRESHOLD_SQ = THRESHOLD * THRESHOLD;

function areAdjacent(a, b) {
  // Quick bounding-box rejection
  if (a.bbox.maxX + THRESHOLD < b.bbox.minX || b.bbox.maxX + THRESHOLD < a.bbox.minX ||
      a.bbox.maxY + THRESHOLD < b.bbox.minY || b.bbox.maxY + THRESHOLD < a.bbox.minY) {
    return false;
  }
  // Full pairwise check — no sampling, so shared boundaries can't be missed
  for (let i = 0; i < a.points.length; i++) {
    const ax = a.points[i][0];
    const ay = a.points[i][1];
    for (let j = 0; j < b.points.length; j++) {
      const dx = ax - b.points[j][0];
      const dy = ay - b.points[j][1];
      if (dx * dx + dy * dy < THRESHOLD_SQ) return true;
    }
  }
  return false;
}

console.log(`Computing adjacency for ${features.length} neighborhoods...`);
const adjacency = {};
features.forEach(f => adjacency[f.properties.name] = []);

for (let i = 0; i < boundaries.length; i++) {
  for (let j = i + 1; j < boundaries.length; j++) {
    if (areAdjacent(boundaries[i], boundaries[j])) {
      adjacency[boundaries[i].name].push(boundaries[j].name);
      adjacency[boundaries[j].name].push(boundaries[i].name);
    }
  }
  if (i % 20 === 0) process.stdout.write(`  ${i}/${boundaries.length}\r`);
}

// Sort neighbor lists
Object.keys(adjacency).forEach(k => adjacency[k].sort());

const outPath = path.join(__dirname, '..', 'data', 'adjacency.json');
fs.writeFileSync(outPath, JSON.stringify(adjacency, null, 2));

// Stats
const counts = Object.values(adjacency).map(v => v.length);
const isolated = counts.filter(c => c === 0).length;
console.log(`\nWrote adjacency to ${outPath}`);
console.log(`  Avg neighbors: ${(counts.reduce((a,b) => a+b, 0) / counts.length).toFixed(1)}`);
console.log(`  Isolated neighborhoods: ${isolated}`);
if (isolated > 0) {
  Object.entries(adjacency).filter(([,v]) => v.length === 0).forEach(([k]) => console.log(`    - ${k}`));
}

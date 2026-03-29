#!/usr/bin/env node
// Filter NTA GeoJSON to residential neighborhoods, simplify, and clean properties.
const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'nta-raw.geojson'), 'utf8'));

// Filter to residential only (ntatype === '0')
const residential = raw.features.filter(f => f.properties.ntatype === '0');

// Simplify coordinate precision to reduce file size (5 decimal places ≈ 1m accuracy)
function simplifyCoords(coords) {
  if (typeof coords[0] === 'number') {
    return [Math.round(coords[0] * 1e5) / 1e5, Math.round(coords[1] * 1e5) / 1e5];
  }
  return coords.map(simplifyCoords);
}

const features = residential.map(f => ({
  type: 'Feature',
  properties: {
    name: f.properties.ntaname,
    borough: f.properties.boroname,
    nta2020: f.properties.nta2020
  },
  geometry: {
    type: f.geometry.type,
    coordinates: simplifyCoords(f.geometry.coordinates)
  }
}));

const output = { type: 'FeatureCollection', features };
const outPath = path.join(__dirname, '..', 'data', 'neighborhoods.geojson');
fs.writeFileSync(outPath, JSON.stringify(output));
console.log(`Wrote ${features.length} neighborhoods to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)}KB)`);

# Hood Guessr

NYC neighborhood guessing game. You're shown an unlabeled map and a neighborhood name — click where you think it is.

## How to Play

1. Click **Play** to start a 10-round game
2. Each round shows a neighborhood name — click the map where you think it is
3. Points are based on how close you are (by neighborhood adjacency, not raw distance):

| Accuracy | Points |
|---|---|
| Exact neighborhood | 100 |
| 1 neighborhood away | 50 |
| 2 neighborhoods away | 25 |
| Further | 0 |

Max score: 1,000 per game.

## Data

All 197 residential neighborhoods from the [NYC NTA 2020](https://data.cityofnewyork.us/City-Government/2020-Neighborhood-Tabulation-Areas-NTAs-/9nt8-h7nd) dataset. Adjacency is strictly geographic (shared borders), not bridge/tunnel connections.

## Run Locally

```
python3 -m http.server 8080
```

Open http://localhost:8080.

## Stack

- [Leaflet.js](https://leafletjs.com/) — map rendering
- [Turf.js](https://turfjs.org/) — point-in-polygon detection
- [CartoDB Positron No Labels](https://carto.com/basemaps/) — unlabeled basemap tiles
- No build tools, no dependencies — just static HTML/CSS/JS

## Data Scripts

The `scripts/` directory has one-time Node.js scripts used to prepare the game data:

- `prepare-data.js` — filters the raw NTA GeoJSON to 197 residential neighborhoods, simplifies coordinates, cleans properties
- `build-adjacency.js` — computes the neighborhood adjacency graph from polygon boundaries

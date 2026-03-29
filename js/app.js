// App module: game state machine and controller
const App = (() => {
  const TOTAL_ROUNDS = 10;
  let state = {
    round: 0,
    score: 0,
    neighborhoods: [],  // selected features for this game
    results: [],        // { name, points, distance }
    phase: 'idle'       // idle | prompting | answered | ended
  };

  async function init() {
    UI.init();
    GameMap.init();

    // Load data
    await Geo.loadData();

    // Wire up event handlers
    GameMap.onMapClick(handleGuess);
    UI.onNext(nextRound);
    UI.onStart(startGame);
    UI.onRestart(() => {
      UI.hideEnd();
      startGame();
    });

    UI.showStart();
  }

  function startGame() {
    state.round = 0;
    state.score = 0;
    state.results = [];
    state.neighborhoods = Geo.getRandomNeighborhoods(TOTAL_ROUNDS);
    state.phase = 'idle';

    UI.hideStart();
    UI.hideEnd();
    UI.hideResult();
    UI.updateScore(0);
    UI.updateRound(0, TOTAL_ROUNDS);
    GameMap.clear();
    GameMap.resetView();

    nextRound();
  }

  function nextRound() {
    UI.hideResult();
    GameMap.clear();

    if (state.round >= TOTAL_ROUNDS) {
      endGame();
      return;
    }

    const feature = state.neighborhoods[state.round];
    state.round++;
    state.phase = 'prompting';

    UI.updateRound(state.round, TOTAL_ROUNDS);
    UI.showPrompt(feature.properties.name);
    GameMap.enableClick();
    GameMap.resetView();
  }

  function handleGuess(latlng) {
    if (state.phase !== 'prompting') return;

    const guessedFeature = Geo.findNeighborhood(latlng.lat, latlng.lng);
    if (!guessedFeature) return; // Ignore clicks outside neighborhoods

    state.phase = 'answered';
    GameMap.disableClick();

    const targetFeature = state.neighborhoods[state.round - 1];
    const targetName = targetFeature.properties.name;
    const guessedName = guessedFeature.properties.name;

    // Calculate distance
    const distance = Geo.getDistance(guessedName, targetName);

    // Calculate points
    let points;
    if (distance === 0) points = 100;
    else if (distance === 1) points = 50;
    else if (distance === 2) points = 25;
    else points = 0;

    state.score += points;
    state.results.push({ name: targetName, points, distance });

    // Visual feedback
    GameMap.placePin(latlng);
    GameMap.showCorrectNeighborhood(targetFeature);

    if (guessedFeature && guessedName !== targetName) {
      GameMap.showGuessedNeighborhood(guessedFeature);
    }

    if (distance > 0) {
      const correctCentroid = Geo.getCentroid(targetFeature);
      GameMap.placeCorrectMarker(correctCentroid);
      GameMap.drawLine([latlng.lat, latlng.lng], correctCentroid);
    }

    // Update UI
    UI.updateScore(state.score);
    UI.showResult(points, distance, targetName, guessedName);
  }

  function endGame() {
    state.phase = 'ended';
    UI.hidePrompt();
    GameMap.clear();
    UI.showEnd(state.score, TOTAL_ROUNDS * 100, state.results);
  }

  return { init };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());

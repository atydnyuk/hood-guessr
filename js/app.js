// App module: game state machine and controller
const App = (() => {
  const TOTAL_ROUNDS = 10;
  let state = {
    round: 0,
    score: 0,
    seed: '',           // 6-char base-36 seed for this game
    isDaily: false,
    neighborhoods: [],  // selected features for this game
    results: [],        // { name, points, distance }
    phase: 'idle',      // idle | prompting | selected | answered | ended
    selectedFeature: null,
    selectedLatlng: null
  };

  const DAILY_KEY = 'hoodguessr_daily';

  function getDailySeed() {
    const d = new Date();
    const n = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    return n.toString(36);
  }

  // Returns the saved result for *today's* daily, or null if it hasn't been
  // played on this device yet. localStorage is per-browser and can be bypassed
  // (incognito, clearing storage, another browser) — true one-play-per-user
  // enforcement would require a backend.
  function getSavedDaily() {
    try {
      const data = JSON.parse(localStorage.getItem(DAILY_KEY));
      return data && data.day === getDailySeed() ? data : null;
    } catch (e) {
      return null;
    }
  }

  function saveDaily(data) {
    try {
      localStorage.setItem(DAILY_KEY, JSON.stringify(data));
    } catch (e) { /* storage unavailable / full — ignore */ }
  }

  // Start the daily, or — if it's already been played today — show the saved
  // result instead of letting the player replay it.
  function startDaily() {
    const saved = getSavedDaily();
    if (saved) {
      state.isDaily = true;
      UI.hideStart();
      UI.showEnd(saved.score, TOTAL_ROUNDS * 100, saved.results, saved.seed, true);
      UI.setDailyPlayed(true);
      return;
    }
    startGame(getDailySeed(), true);
  }

  async function init() {
    UI.init();
    GameMap.init();

    // Load data and show play area boundary
    await Geo.loadData();
    GameMap.showBoundary(Geo.getNeighborhoods());

    // Wire up event handlers
    GameMap.onMapClick(handleClick);
    UI.onConfirm(confirmGuess);
    UI.onNext(nextRound);
    UI.onDailyStart(startDaily);
    UI.onRandomStart(() => startGame());
    UI.onStart(() => startGame(UI.getSeedInput()));
    UI.onDailyEnd(() => { UI.hideEnd(); startDaily(); });
    UI.onRestart(() => { UI.hideEnd(); startGame(); });
    UI.onPlaySeed(() => { UI.hideEnd(); startGame(UI.getSeedEndInput()); });

    UI.setDailyPlayed(!!getSavedDaily());
    UI.showStart();
  }

  function startGame(seedStr, isDaily = false) {
    // Parse provided seed or generate a random one
    let numericSeed;
    if (seedStr && /^[0-9a-z]{1,6}$/i.test(seedStr.trim())) {
      numericSeed = parseInt(seedStr.trim().toLowerCase(), 36);
    } else {
      numericSeed = Math.floor(Math.random() * 2176782336);
    }
    state.seed = numericSeed.toString(36).padStart(6, '0');
    state.isDaily = isDaily;

    state.round = 0;
    state.score = 0;
    state.results = [];
    state.neighborhoods = Geo.getNeighborhoodsForSeed(TOTAL_ROUNDS, numericSeed);
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
    UI.hideConfirm();
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

  // Step 1: Click to select a neighborhood (highlight + confirm prompt)
  function handleClick(latlng) {
    if (state.phase !== 'prompting' && state.phase !== 'selected') return;

    const feature = Geo.findNeighborhood(latlng.lat, latlng.lng);
    if (!feature) return; // Ignore clicks outside neighborhoods

    state.phase = 'selected';
    state.selectedFeature = feature;
    state.selectedLatlng = latlng;

    GameMap.highlightSelection(feature);
    UI.showConfirm();
  }

  // Step 2: Confirm the selection to submit the guess
  function confirmGuess() {
    if (state.phase !== 'selected' || !state.selectedFeature) return;

    const guessedFeature = state.selectedFeature;
    const latlng = state.selectedLatlng;

    state.phase = 'answered';
    GameMap.disableClick();
    GameMap.clearHighlight();
    UI.hideConfirm();

    const targetFeature = state.neighborhoods[state.round - 1];
    const targetName = targetFeature.properties.name;
    const guessedName = guessedFeature.properties.name;

    // Calculate distance
    const distance = Geo.getDistance(guessedName, targetName);

    // Calculate points
    const sameBorough = guessedFeature.properties.borough === targetFeature.properties.borough;
    let points;
    if (distance === 0) points = 100;
    else if (distance === 1) points = 80;
    else if (distance === 2) points = 60;
    else if (sameBorough) points = 20;
    else points = 0;

    state.score += points;
    state.results.push({ name: targetName, points, distance });

    // Zoom out to default view so user can see where the neighborhood is
    GameMap.resetView();

    // Visual feedback
    GameMap.placePin(latlng);
    GameMap.showCorrectNeighborhood(targetFeature);

    if (guessedName !== targetName) {
      GameMap.showGuessedNeighborhood(guessedFeature);
    }

    if (distance > 0) {
      const correctCentroid = Geo.getCentroid(targetFeature);
      GameMap.placeCorrectMarker(correctCentroid);
      GameMap.drawLine([latlng.lat, latlng.lng], correctCentroid);
    }

    // Update UI
    UI.updateScore(state.score);
    UI.showResult(points, distance, sameBorough, targetName, guessedName);
  }

  function endGame() {
    state.phase = 'ended';
    UI.hidePrompt();
    GameMap.clear();
    if (state.isDaily) {
      saveDaily({ day: getDailySeed(), seed: state.seed, score: state.score, results: state.results });
      UI.setDailyPlayed(true);
    }
    UI.showEnd(state.score, TOTAL_ROUNDS * 100, state.results, state.seed, state.isDaily);
  }

  return { init };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());

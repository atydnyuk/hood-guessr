// UI module: DOM updates, overlays, feedback
const UI = (() => {
  const els = {};
  let endAdLoaded = false;  // guards the one-time AdSense fill on the end screen

  function init() {
    els.roundDisplay = document.getElementById('round-display');
    els.scoreDisplay = document.getElementById('score-display');
    els.neighborhoodName = document.getElementById('neighborhood-name');
    els.promptBar = document.getElementById('prompt-bar');
    els.resultCard = document.getElementById('result-card');
    els.resultPoints = document.getElementById('result-points');
    els.resultMessage = document.getElementById('result-message');
    els.nextBtn = document.getElementById('next-btn');
    els.startOverlay = document.getElementById('start-overlay');
    els.startBtn = document.getElementById('start-btn');
    els.seedInput = document.getElementById('seed-input');
    els.endOverlay = document.getElementById('end-overlay');
    els.finalScore = document.getElementById('final-score');
    els.finalBreakdown = document.getElementById('final-breakdown');
    els.seedValue = document.getElementById('seed-value');
    els.copySeedBtn = document.getElementById('copy-seed-btn');
    els.copySeedBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(els.seedValue.textContent).then(() => {
        els.copySeedBtn.textContent = 'Copied!';
      });
    });
    els.restartBtn = document.getElementById('restart-btn');
    els.dailyStartBtn = document.getElementById('daily-start-btn');
    els.randomStartBtn = document.getElementById('random-start-btn');
    els.dailyEndBtn = document.getElementById('daily-end-btn');
    els.seedInputEnd = document.getElementById('seed-input-end');
    els.playSeedBtn = document.getElementById('play-seed-btn');
    els.seedLabel = document.getElementById('seed-label');
    els.confirmBar = document.getElementById('confirm-bar');
    els.confirmBtn = document.getElementById('confirm-btn');
  }

  function showPrompt(name) {
    els.neighborhoodName.textContent = name;
    els.promptBar.classList.remove('hidden');
  }

  function hidePrompt() {
    els.promptBar.classList.add('hidden');
  }

  function updateRound(current, total) {
    els.roundDisplay.textContent = `${current} / ${total}`;
  }

  function updateScore(score) {
    els.scoreDisplay.textContent = `${score} pts`;
  }

  function showResult(points, distance, sameBorough, correctName, guessedName) {
    els.resultCard.className = `points-${points}`;

    els.resultPoints.textContent = `+${points}`;

    let msg;
    if (distance === 0) {
      msg = `Nailed it! That's ${correctName}.`;
    } else if (distance === 1) {
      msg = `Close! You picked ${guessedName || 'nearby'} — ${correctName} is just one neighborhood over.`;
    } else if (distance === 2) {
      msg = `Not bad — ${correctName} is two neighborhoods from where you clicked.`;
    } else if (sameBorough) {
      msg = `Right borough at least! That was ${guessedName}. ${correctName} is ${distance} neighborhoods away.`;
    } else {
      if (guessedName) {
        msg = `That was ${guessedName}. ${correctName} is ${distance === Infinity ? 'far' : distance + ' neighborhoods'} away.`;
      } else {
        msg = `You clicked outside any neighborhood. ${correctName} was the target.`;
      }
    }
    els.resultMessage.textContent = msg;
    els.resultCard.classList.remove('hidden');
  }

  function hideResult() {
    els.resultCard.classList.add('hidden');
  }

  function onNext(handler) {
    els.nextBtn.addEventListener('click', handler);
  }

  function showStart() {
    els.startOverlay.classList.remove('hidden');
  }

  function hideStart() {
    els.startOverlay.classList.add('hidden');
  }

  function onStart(handler) {
    els.startBtn.addEventListener('click', handler);
  }

  function onDailyStart(handler) {
    els.dailyStartBtn.addEventListener('click', handler);
  }

  // Reflect whether today's daily has already been played on this device.
  // When played, the daily buttons stay clickable but relabel — clicking shows
  // the saved result instead of starting a fresh game.
  function setDailyPlayed(played) {
    [els.dailyStartBtn, els.dailyEndBtn].forEach(btn => {
      if (!btn) return;
      if (btn.dataset.origText === undefined) btn.dataset.origText = btn.textContent;
      btn.textContent = played ? "View Today's Result" : btn.dataset.origText;
    });
  }

  function onRandomStart(handler) {
    els.randomStartBtn.addEventListener('click', handler);
  }

  function onDailyEnd(handler) {
    els.dailyEndBtn.addEventListener('click', handler);
  }

  function onPlaySeed(handler) {
    els.playSeedBtn.addEventListener('click', handler);
  }

  function getSeedEndInput() {
    return els.seedInputEnd ? els.seedInputEnd.value.trim() : '';
  }

  function showEnd(score, total, results, seed, isDaily) {
    els.finalScore.textContent = `${score} / ${total}`;
    els.seedLabel.textContent = isDaily ? 'Daily' : 'Seed';

    const lines = results.map(r => {
      const icon = r.points === 100 ? '✓' : r.points > 0 ? '~' : '✗';
      return `${icon} ${r.name}: ${r.points} pts`;
    });
    els.finalBreakdown.innerHTML = lines.join('<br>');

    els.seedValue.textContent = seed;
    els.copySeedBtn.textContent = 'Copy';

    els.endOverlay.classList.remove('hidden');

    // Fill the AdSense unit now that the overlay is visible (it can't render
    // while display:none). Only once — pushing an already-filled <ins> throws.
    if (!endAdLoaded && window.adsbygoogle) {
      requestAnimationFrame(() => {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          endAdLoaded = true;
        } catch (e) { /* AdSense not ready / blocked — ignore */ }
      });
    }
  }

  function getSeedInput() {
    return els.seedInput ? els.seedInput.value.trim() : '';
  }

  function hideEnd() {
    els.endOverlay.classList.add('hidden');
  }

  function showConfirm() {
    els.confirmBar.classList.remove('hidden');
  }

  function hideConfirm() {
    els.confirmBar.classList.add('hidden');
  }

  function onConfirm(handler) {
    els.confirmBtn.addEventListener('click', handler);
  }

  function onRestart(handler) {
    els.restartBtn.addEventListener('click', handler);
  }

  return { init, showPrompt, hidePrompt, updateRound, updateScore, showResult, hideResult, onNext, showStart, hideStart, onStart, onDailyStart, setDailyPlayed, onRandomStart, onDailyEnd, onPlaySeed, showConfirm, hideConfirm, onConfirm, showEnd, hideEnd, onRestart, getSeedInput, getSeedEndInput };
})();

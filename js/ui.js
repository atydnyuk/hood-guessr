// UI module: DOM updates, overlays, feedback
const UI = (() => {
  const els = {};

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

  function showEnd(score, total, results, seed) {
    els.finalScore.textContent = `${score} / ${total}`;

    const lines = results.map(r => {
      const icon = r.points === 100 ? '✓' : r.points > 0 ? '~' : '✗';
      return `${icon} ${r.name}: ${r.points} pts`;
    });
    els.finalBreakdown.innerHTML = lines.join('<br>');

    els.seedValue.textContent = seed;
    els.copySeedBtn.textContent = 'Copy';

    els.endOverlay.classList.remove('hidden');
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

  return { init, showPrompt, hidePrompt, updateRound, updateScore, showResult, hideResult, onNext, showStart, hideStart, onStart, showConfirm, hideConfirm, onConfirm, showEnd, hideEnd, onRestart, getSeedInput };
})();

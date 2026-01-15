const socket = io();

let competitionId = null;
let participantName = null;
let currentRound = -1;
let isTestInProgress = false;
let testStartTime = 0;
let typingText = '';
let currentRoundDuration = 0;
let totalErrors = 0;
let backspaceCount = 0;
let typedChars = [];
let errorIndices = new Set();
let keyStats = {};
let lastKeystrokeTime = 0;

// ================= RESULT HISTORY HELPERS =================
function saveResultToHistory(result) {
  const history = JSON.parse(localStorage.getItem("typingResults")) || [];
  const updatedHistory = [result, ...history].slice(0, 10);
  localStorage.setItem("typingResults", JSON.stringify(updatedHistory));
}

function loadResultHistory() {
  return JSON.parse(localStorage.getItem("typingResults")) || [];
}

function clearResultHistory() {
  localStorage.removeItem("typingResults");
  renderResultHistory();
}

function renderResultHistory() {
  const historyBody = document.getElementById("history-body");
  if (!historyBody) return;

  const history = loadResultHistory();
  historyBody.innerHTML = "";

  if (history.length === 0) {
    historyBody.innerHTML =
      "<tr><td colspan='5'>No history available</td></tr>";
    return;
  }

  history.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.date}</td>
      <td>${item.wpm}</td>
      <td>${item.accuracy}</td>
      <td>${item.characters}</td>
      <td>${item.timeTaken}</td>
    `;
    historyBody.appendChild(row);
  });
}

// ================= DOM ELEMENTS =================
const joinScreen = document.getElementById('joinScreen');
const lobbyScreen = document.getElementById('lobbyScreen');
const testScreen = document.getElementById('testScreen');
const resultsScreen = document.getElementById('resultsScreen');
const completionScreen = document.getElementById('completionScreen');
const competitionCodeInput = document.getElementById('competitionCode');
const participantNameInput = document.getElementById('participantName');
const joinBtn = document.getElementById('joinBtn');
const joinError = document.getElementById('joinError');
const welcomeName = document.getElementById('welcomeName');
const competitionNameDisplay = document.getElementById('competitionName');
const participantCountDisplay = document.getElementById('participantCountDisplay');
const typingInput = document.getElementById('typingInput');
const textDisplay = document.getElementById('textDisplay');
const wpmDisplay = document.getElementById('wpmDisplay');
const accuracyDisplay = document.getElementById('accuracyDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const focusWarning = document.getElementById('focusWarning');
const joinNewCompetitionBtn = document.getElementById('joinNewCompetitionBtn');

// ====== Monkeytype-style focus ======
if (textDisplay && typingInput) {
  textDisplay.addEventListener('click', () => typingInput.focus());
}

// ============= ANTI-CHEATING =============
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('paste', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('copy', e => e.preventDefault());

// ✅ FIX: Prevent crash if focusWarning does not exist
document.addEventListener('visibilitychange', () => {
  if (!focusWarning) return;

  if (document.hidden && isTestInProgress) {
    focusWarning.classList.remove('hidden');
  } else {
    focusWarning.classList.add('hidden');
  }
});

// ============= JOIN COMPETITION =============
joinBtn.addEventListener('click', () => {
  const code = competitionCodeInput.value.toUpperCase().trim();
  const name = participantNameInput.value.trim();

  if (!code || code.length !== 5) {
    showError('Competition code must be exactly 5 characters');
    return;
  }

  if (!name) {
    showError('Please enter your name');
    return;
  }

  joinError.classList.remove('show');
  participantName = name;

  socket.emit('join', { code, participantName: name });
});

// ============= KEYBOARD SHORTCUTS =============
document.addEventListener('keydown', (e) => {
  // Prevent shortcuts during typing test
  if (isTestInProgress) return;

  switch (e.key) {
    case 'Enter':
      // Join competition or submit forms
      if (joinScreen.classList.contains('hidden') === false) {
        e.preventDefault();
        joinBtn.click();
      }
      break;
    case 'Tab':
      // Switch to organizer role
      e.preventDefault();
      window.location.href = "organizer.html";
      break;
    case 'Escape':
      // Close modals or go back
      if (resultsScreen.classList.contains('hidden') === false) {
        e.preventDefault();
        joinNewCompetitionBtn.click();
      }
      break;
    case 'ArrowUp':
    case 'ArrowDown':
      // Navigate lists/options (if any)
      e.preventDefault();
      // Add navigation logic here if needed
      break;
    case ' ':
      // Trigger primary actions (e.g., start if applicable)
      e.preventDefault();
      // Add primary action logic here if needed
      break;
  }
});

// ============= TYPING INPUT HANDLER =============
typingInput.addEventListener('keydown', (e) => {
  if (!isTestInProgress) return;

  if (e.key === 'Backspace') {
    e.preventDefault();
    if (typedChars.length > 0) {
      const removedIndex = typedChars.length - 1;
      if (errorIndices.has(removedIndex)) {
        errorIndices.delete(removedIndex);
        totalErrors = Math.max(0, totalErrors - 1);
      }
      backspaceCount++;
      typedChars.pop();
      typingInput.value = typedChars.join('');
      updateTypingStats();
    }
    return;
  }

  if (e.key.length !== 1) return;

  e.preventDefault();
  const nextIndex = typedChars.length;
  const expectedChar = typingText[nextIndex] || '';
  const typedChar = e.key;

  // HEATMAP TRACKING
  const now = Date.now();
  if (lastKeystrokeTime > 0) {
    const latency = now - lastKeystrokeTime;
    const charUpper = typedChar.toUpperCase();
    if (!keyStats[charUpper]) {
      keyStats[charUpper] = { count: 0, errors: 0, totalLatency: 0 };
    }
    keyStats[charUpper].count++;
    keyStats[charUpper].totalLatency += latency;
  }
  lastKeystrokeTime = now;

  typedChars.push(typedChar);
  typingInput.value = typedChars.join('');

  if (typedChar !== expectedChar) {
    totalErrors++;
    errorIndices.add(nextIndex);

    // HEATMAP ERROR TRACKING
    const charUpper = typedChar.toUpperCase();
    if (keyStats[charUpper]) {
      keyStats[charUpper].errors++;
    }
  }

  updateTypingStats();
});

// ============= CORE UPDATE FUNCTION =============
function updateTypingStats() {
  const inputText = typedChars.join('');
  const correctChars = calculateCorrectChars(inputText, typingText);
  const totalChars = inputText.length;
  const elapsedSeconds = (Date.now() - testStartTime) / 1000;

  const wpm = elapsedSeconds > 0
    ? Math.round((correctChars / 5) / (elapsedSeconds / 60))
    : 0;

  const accuracy = totalChars > 0
    ? Math.round((correctChars / totalChars) * 100)
    : 100;

  // Calculate progress percentage
  const progress = typingText.length > 0
    ? Math.round((totalChars / typingText.length) * 100)
    : 0;

  wpmDisplay.textContent = wpm;
  accuracyDisplay.textContent = accuracy + '%';
  updateTextDisplay(inputText);

  // Update progress bar
  const progressFill = document.getElementById('progressFill');
  const progressPercentage = document.getElementById('progressPercentage');
  if (progressFill) {
    progressFill.style.width = progress + '%';
  }
  if (progressPercentage) {
    progressPercentage.textContent = progress + '%';
  }

  socket.emit('progress', {
    competitionId,
    correctChars,
    totalChars,
    errors: totalErrors,
    backspaces: backspaceCount,
    keyStats: keyStats
  });
}

// ============= SUPPORTING FUNCTIONS =============
function calculateCorrectChars(input, reference) {
  let correct = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === reference[i]) correct++;
  }
  return correct;
}

function updateTextDisplay(inputText) {
  let html = '';
  for (let i = 0; i < typingText.length; i++) {
    const char = typingText[i];

    if (i < inputText.length) {
      html += inputText[i] === char
        ? `<span class="correct">${char}</span>`
        : `<span class="incorrect">${char}</span>`;
    } else if (i === inputText.length) {
      html += `<span class="current">${char}</span>`;
    } else {
      html += char;
    }
  }
  textDisplay.innerHTML = html;
}

// Timer
function startTimer(duration) {
  currentRoundDuration = duration;
  let timeLeft = duration;
  timerDisplay.textContent = timeLeft + 's';

  const timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft + 's';

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isTestInProgress = false;
      typingInput.disabled = true;
    }
  }, 1000);
}

// Error display
// Error display
function showError(message) {
  if (typeof document === 'undefined') return;

  // Remove existing popup if any
  const existing = document.getElementById('error-popup-overlay');
  if (existing) existing.remove();

  // Overlay
  const overlay = document.createElement('div');
  overlay.id = 'error-popup-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  // Popup
  const popup = document.createElement('div');
  popup.style.cssText = `
    background: #1e1e1e;
    color: #fff;
    padding: 28px 32px;
    border-radius: 14px;
    width: 90%;
    max-width: 420px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    animation: popupScale 0.25s ease;
  `;

  popup.innerHTML = `
    <div style="font-size: 52px; margin-bottom: 12px;">😢</div>
    <h2 style="color:#ff4d4f; margin-bottom: 8px;">Oops!</h2>
    <p style="font-size: 15px; line-height: 1.5;">${message}</p>
    <button id="errorPopupCloseBtn"
      style="
        margin-top: 20px;
        background:#ff4d4f;
        border:none;
        color:white;
        padding:10px 18px;
        border-radius:8px;
        font-size:14px;
        cursor:pointer;
      ">
      Close
    </button>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  // Close handlers
  const close = () => overlay.remove();

  document.getElementById('errorPopupCloseBtn').onclick = close;
  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };

  // Auto-close after 5 seconds
  setTimeout(close, 5000);
}


// ============= SOCKET EVENTS =============

socket.on('joinSuccess', (data) => {
  competitionId = data.competitionId;
  competitionNameDisplay.textContent = data.name;
  welcomeName.textContent = participantName;
  joinScreen.classList.add('hidden');
  lobbyScreen.classList.remove('hidden');
});

socket.on('joinError', (data) => {
  showError(data?.message || 'Unable to join competition');
});

socket.on('participantJoined', (data) => {
  participantCountDisplay.textContent = data.totalParticipants;
});
socket.on('error', (data) => {
  showError(data?.message || 'Invalid participation code. Please try again.');
});

socket.on('error', (data) => {
  showError(data?.message || 'Invalid participation code. Please try again.');
});

socket.on('roundStarted', (data) => {
  currentRound = data.roundIndex;
  typingText = data.text;

  typedChars = [];
  totalErrors = 0;
  backspaceCount = 0;
  errorIndices.clear();
  keyStats = {};
  lastKeystrokeTime = 0;

  manageScreenFocus('testScreen');

  typingInput.value = '';
  typingInput.disabled = false;
  // Focus will be managed by manageScreenFocus

  updateTextDisplay('');
  wpmDisplay.textContent = '0';
  accuracyDisplay.textContent = '100%';

  isTestInProgress = true;
  testStartTime = Date.now();
  startTimer(data.duration);
});

socket.on('roundEnded', (data) => {
  isTestInProgress = false;
  typingInput.disabled = true;

  manageScreenFocus('resultsScreen');

  const personalResult = data.leaderboard.find(
    item => item.name === participantName
  );

  if (personalResult) {
    document.getElementById('resultWpm').textContent = personalResult.wpm;
    document.getElementById('resultAccuracy').textContent = personalResult.accuracy + '%';
    document.getElementById('resultErrors').textContent = personalResult.errors;
    document.getElementById('resultBackspaces').textContent = personalResult.backspaces;

    saveResultToHistory({
      wpm: personalResult.wpm,
      accuracy: personalResult.accuracy,
      characters: typedChars.length,
      timeTaken: currentRoundDuration,
      date: new Date().toLocaleString(),
    });

    renderResultHistory();

    // RENDER HEATMAP
    if (personalResult.keyStats) {
      renderHeatmap(personalResult.keyStats);
    }

    // Hide EVERYTHING else (Results Card & History) as per user request
    const resultsCard = document.querySelector('.results-card');
    if (resultsCard) resultsCard.classList.add('hidden');

    const historySection = document.querySelector('.history-section');
    if (historySection) historySection.classList.add('hidden');

    // Add 'Join New Competition' button directly to Heatmap Container
    const heatmapContainer = document.getElementById('heatmapContainer');
    if (heatmapContainer && !document.getElementById('resScreenJoinBtn')) {
      const joinBtn = document.createElement('button');
      joinBtn.id = 'resScreenJoinBtn';
      joinBtn.className = 'btn-primary';
      joinBtn.textContent = 'Join New Competition';
      joinBtn.style.marginTop = '30px';
      // Inline styles removed to rely on CSS
      joinBtn.onclick = () => window.location.href = '/participant';

      heatmapContainer.appendChild(joinBtn);
    }

    // Center the heatmap on screen
    resultsScreen.classList.add('results-split-view');
    // Remove inline styles that might conflict or were temporary
    resultsScreen.style.display = '';
    resultsScreen.style.justifyContent = '';
    resultsScreen.style.alignItems = '';
    resultsScreen.style.minHeight = '';
  }
});

socket.on('finalResults', () => {
  // If we are currently viewing results (heatmap), stay there but update UI
  if (!resultsScreen.classList.contains('hidden')) {
    const title = resultsScreen.querySelector('h2');
    if (title) title.textContent = "Competition Complete! 🎉";

    // Hide "Waiting for next round..." text
    const nextRoundText = document.getElementById('nextRoundText');
    if (nextRoundText) nextRoundText.style.display = 'none';

    // Add 'Join New Competition' button if not present
    if (!document.getElementById('resScreenJoinBtn')) {
      const joinBtn = document.createElement('button');
      joinBtn.id = 'resScreenJoinBtn';
      joinBtn.className = 'btn-primary';
      joinBtn.textContent = 'Join New Competition';
      joinBtn.style.marginTop = '20px';
      joinBtn.onclick = () => window.location.href = '/participant';

      const card = resultsScreen.querySelector('.results-card');
      if (card) card.appendChild(joinBtn);
    }
    return;
  }

  // Default behavior
  manageScreenFocus('completionScreen');
});

socket.on('disconnect', () => {
  showError('Disconnected from server');
});

// Buttons
if (joinNewCompetitionBtn) {
  joinNewCompetitionBtn.addEventListener('click', () => {
    window.location.href = '/participant';
  });
}

document
  .getElementById("clear-history-btn")
  ?.addEventListener("click", clearResultHistory);

// ====== ROLE SWITCH: PARTICIPANT → ORGANIZER ======
document.addEventListener("DOMContentLoaded", () => {
  const organizerBtn = document.getElementById("organizerSwitchBtn");

  if (!organizerBtn) {
    console.warn("Organizer switch button not found");
    return;
  }

  organizerBtn.addEventListener("click", () => {
    window.location.href = "organizer.html";
  });
});

renderResultHistory();

// ================= HEATMAP RENDERING =================
function renderHeatmap(keyStats) {
  const resultsContainer = document.getElementById('resultsScreen');
  let heatmapContainer = document.getElementById('heatmapContainer');

  // Create container if not exists
  if (!heatmapContainer) {
    heatmapContainer = document.createElement('div');
    heatmapContainer.id = 'heatmapContainer';
    heatmapContainer.className = 'heatmap-container';
    resultsContainer.appendChild(heatmapContainer);
  }

  // Calculate stats
  const keys = Object.keys(keyStats);
  if (keys.length === 0) {
    heatmapContainer.innerHTML = '<p>No typing data available for heatmap</p>';
    return;
  }

  let latencies = keys.map(k => keyStats[k].totalLatency / keyStats[k].count);
  latencies = latencies.filter(l => !isNaN(l) && l > 0);

  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length || 0;

  // Keyboard Layout
  const rows = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\''],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/']
  ];

  let html = `
    <div class="heatmap-title">Typing Heatmap (Avg Latency)</div>
    <div class="heatmap-legend">
      <div class="legend-item"><div class="legend-color legend-fast"></div> Fast (< ${Math.round(avgLatency * 0.8)}ms)</div>
      <div class="legend-item"><div class="legend-color legend-avg"></div> Average</div>
      <div class="legend-item"><div class="legend-color legend-slow"></div> Slow (> ${Math.round(avgLatency * 1.2)}ms)</div>
    </div>
    <div class="keyboard">
  `;

  rows.forEach(row => {
    html += '<div class="keyboard-row">';
    row.forEach(char => {
      const stats = keyStats[char] || { count: 0, totalLatency: 0, errors: 0 };
      const latency = stats.count > 0 ? Math.round(stats.totalLatency / stats.count) : 0;

      let colorClass = 'key-unused';
      if (stats.count > 0) {
        if (latency < avgLatency * 0.8) colorClass = 'key-fast';
        else if (latency > avgLatency * 1.2) colorClass = 'key-slow';
        else colorClass = 'key-avg';
      }

      html += `
        <div class="key ${colorClass}">
          ${char}
          ${stats.count > 0 ? `<div class="key-tooltip">${latency}ms (${stats.errors} err)</div>` : ''}
        </div>
      `;
    });
    html += '</div>';
  });

  html += '</div>';
  heatmapContainer.innerHTML = html;
}

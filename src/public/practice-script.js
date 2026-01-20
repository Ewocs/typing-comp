// ============================================
// TYPING PRACTICE SCRIPT
// Handles standalone typing practice functionality
// ============================================

// ============================================
// TEXT GENERATORS
// ============================================

const TEXT_GENERATORS = {
  easy: [
    'The quick brown fox jumps over the lazy dog.',
    'I love to code and build amazing applications.',
    'Practice makes perfect when learning new skills.',
    'The sun shines bright on a beautiful day.',
    'Reading books helps expand your knowledge.',
    "Friends are important in everyone's life.",
    'Music brings joy and happiness to people.',
    'Learning new things is always exciting.',
    'Good food makes everyone feel better.',
    'Exercise keeps your body healthy and strong.',
  ],
  medium: [
    'The art of programming requires patience, dedication, and continuous learning. Developers must understand both syntax and logic to create effective solutions.',
    'Technology has transformed how we communicate, work, and live our daily lives. From smartphones to cloud computing, innovation never stops.',
    'Reading literature opens doors to different worlds, perspectives, and experiences. Books allow us to explore history, science, and human nature.',
    'Effective communication involves listening carefully, speaking clearly, and understanding context. These skills are essential in both personal and professional relationships.',
    'The natural world is full of wonders waiting to be discovered. From deep oceans to distant stars, exploration drives human curiosity forward.',
    'Education empowers individuals to think critically and solve complex problems. Knowledge gained through study becomes a tool for positive change.',
    'Creativity flourishes when we combine imagination with practical skills. Artists, writers, and innovators shape culture through their unique visions.',
    'Health and wellness depend on balanced nutrition, regular exercise, and adequate rest. Taking care of your body supports mental clarity and energy.',
    'Collaboration brings together diverse talents to achieve common goals. Teamwork multiplies individual strengths and creates stronger outcomes.',
    'Time management helps prioritize tasks and maximize productivity. Organizing your schedule allows for both work and personal fulfillment.',
  ],
  hard: [
    'The intricate mechanisms of quantum computing represent a paradigm shift in computational methodology, leveraging superposition and entanglement to process information at unprecedented scales. Researchers continue to explore quantum algorithms that could revolutionize cryptography, optimization, and machine learning applications.',
    'Philosophical inquiry into the nature of consciousness raises fundamental questions about identity, free will, and the relationship between mind and matter. Debates between materialist and dualist perspectives challenge our understanding of subjective experience and objective reality.',
    'Climate change mitigation requires coordinated international efforts, technological innovation, and behavioral adaptation across multiple sectors. Transitioning to renewable energy sources while maintaining economic stability demands careful policy planning and public engagement.',
    'The evolution of language reflects complex interactions between biological predispositions, cultural transmission, and environmental factors. Linguists study how syntax, semantics, and pragmatics develop across different communities and historical periods.',
    'Neuroscience research reveals increasingly sophisticated models of brain function, mapping neural networks that govern perception, memory, and decision-making. Understanding these mechanisms could lead to treatments for neurological disorders and enhanced cognitive capabilities.',
    'Economic systems balance efficiency, equity, and sustainability through various institutional arrangements. Market mechanisms, regulatory frameworks, and social policies interact to shape resource allocation and distribution outcomes.',
    'Literary analysis examines how narrative structure, symbolism, and intertextuality create meaning within cultural contexts. Critics explore connections between form and content, revealing layers of interpretation that enrich our reading experience.',
    'Mathematical proofs demonstrate logical relationships between abstract concepts, establishing truths through rigorous deductive reasoning. The elegance of mathematical structures often reveals unexpected connections across different domains of knowledge.',
    'Biotechnology advances enable precise manipulation of genetic material, opening possibilities for medical treatments, agricultural improvements, and environmental remediation. Ethical considerations accompany these powerful capabilities.',
    'Historical scholarship reconstructs past events through careful examination of primary sources, archaeological evidence, and comparative analysis. Historians interpret patterns and causes while acknowledging the complexity of human experience.',
  ],
};

function generateText(difficulty, sessionLength) {
  const texts = TEXT_GENERATORS[difficulty] || TEXT_GENERATORS.medium;
  let selectedText = '';

  if (difficulty === 'easy') {
    // Easy: 2-3 short sentences
    const count = sessionLength === 'short' ? 2 : 3;
    const shuffled = [...texts].sort(() => Math.random() - 0.5);
    selectedText = shuffled.slice(0, count).join(' ');
  } else if (difficulty === 'medium') {
    // Medium: 1-2 paragraphs
    const count = sessionLength === 'short' ? 1 : 2;
    const shuffled = [...texts].sort(() => Math.random() - 0.5);
    selectedText = shuffled.slice(0, count).join(' ');
  } else {
    // Hard: 1-2 long paragraphs
    const count = sessionLength === 'short' ? 1 : 2;
    const shuffled = [...texts].sort(() => Math.random() - 0.5);
    selectedText = shuffled.slice(0, count).join(' ');
  }

  return selectedText.trim();
}

// ============================================
// STATE MANAGEMENT
// ============================================

let practiceState = {
  difficulty: 'medium',
  textSource: 'system',
  sessionLength: 'medium',
  customText: '',
  isPracticeActive: false,
  startTime: null,
  typedChars: [],
  errorIndices: new Set(),
  totalErrors: 0,
  backspaceCount: 0,
  currentText: '',
  sessionDuration: null, // in seconds
  alertShown: false,
  firstKeystrokeTime: null,
};

// ============================================
// DOM ELEMENT REFERENCES
// ============================================

const configPanel = document.getElementById('configPanel');
const typingInterface = document.getElementById('typingInterface');
const completionScreen = document.getElementById('completionScreen');
const statsDashboard = document.getElementById('statsDashboard');
const startPracticeBtn = document.getElementById('startPracticeBtn');
const practiceInput = document.getElementById('practiceInput');
const practiceTextDisplay = document.getElementById('practiceTextDisplay');
const customTextArea = document.getElementById('customTextArea');
const charCount = document.getElementById('charCount');
const viewStatsBtn = document.getElementById('viewStatsBtn');
const practiceAlert = document.getElementById('practiceAlert');
const finishSessionBtn = document.getElementById('finishSessionBtn');
const continuePracticeBtn = document.getElementById('continuePracticeBtn');

// ============================================
// UI HELPER FUNCTIONS
// ============================================

function updateRadioButtons(groupSelector, selectedValue) {
  const group = document.querySelectorAll(groupSelector);
  group.forEach((option) => {
    const radio = option.querySelector('input[type="radio"]');
    if (radio.value === selectedValue) {
      option.classList.add('selected');
      radio.checked = true;
    } else {
      option.classList.remove('selected');
      radio.checked = false;
    }
  });
}

function showScreen(screenName) {
  configPanel.style.display = screenName === 'config' ? 'block' : 'none';
  typingInterface.classList.toggle('active', screenName === 'typing');
  completionScreen.classList.toggle('active', screenName === 'completion');
  statsDashboard.classList.toggle('active', screenName === 'stats');
}

// ============================================
// TEXT SOURCE HANDLING
// ============================================

document.querySelectorAll('input[name="textSource"]').forEach((radio) => {
  radio.addEventListener('change', (e) => {
    practiceState.textSource = e.target.value;
    if (e.target.value === 'custom') {
      customTextArea.style.display = 'block';
      charCount.style.display = 'block';
      updateCharCount();
    } else {
      customTextArea.style.display = 'none';
      charCount.style.display = 'none';
    }
    validateStartButton();
  });
});

customTextArea.addEventListener('input', () => {
  practiceState.customText = customTextArea.value;
  updateCharCount();
  validateStartButton();
});

function updateCharCount() {
  const count = customTextArea.value.length;
  charCount.textContent = `${count} / 1500 characters`;
  if (count > 1500) {
    charCount.style.color = '#ef4444';
  } else {
    charCount.style.color = 'var(--color-text-secondary)';
  }
}

// ==================== DIFFICULTY & SESSION LENGTH ====================

document.querySelectorAll('input[name="difficulty"]').forEach((radio) => {
  radio.addEventListener('change', (e) => {
    practiceState.difficulty = e.target.value;
    updateRadioButtons('.radio-option[data-value]', e.target.value);
  });
});

document.querySelectorAll('input[name="sessionLength"]').forEach((radio) => {
  radio.addEventListener('change', (e) => {
    practiceState.sessionLength = e.target.value;
    updateRadioButtons('.radio-option[data-value]', e.target.value);
  });
});

// Radio button visual feedback
document.querySelectorAll('.radio-option').forEach((option) => {
  option.addEventListener('click', () => {
    const radio = option.querySelector('input[type="radio"]');
    if (radio && !radio.disabled) {
      radio.checked = true;
      const name = radio.name;

      // Update all radio buttons in the same group
      document.querySelectorAll(`input[name="${name}"]`).forEach((r) => {
        const parentOption = r.closest('.radio-option');
        if (parentOption) {
          parentOption.classList.remove('selected');
        }
      });
      option.classList.add('selected');

      // Update state
      if (name === 'difficulty') {
        practiceState.difficulty = radio.value;
      } else if (name === 'sessionLength') {
        practiceState.sessionLength = radio.value;
      } else if (name === 'textSource') {
        practiceState.textSource = radio.value;
        if (radio.value === 'custom') {
          customTextArea.style.display = 'block';
          charCount.style.display = 'block';
          updateCharCount();
        } else {
          customTextArea.style.display = 'none';
          charCount.style.display = 'none';
        }
        validateStartButton();
      }
    }
  });
});

// ==================== VALIDATION ====================

function validateStartButton() {
  let isValid = true;

  if (!practiceState.difficulty) isValid = false;
  if (!practiceState.textSource) isValid = false;
  if (practiceState.textSource === 'custom') {
    if (
      !practiceState.customText ||
      practiceState.customText.trim().length < 10
    ) {
      isValid = false;
    }
  }

  startPracticeBtn.disabled = !isValid;
}

validateStartButton();

// ==================== START PRACTICE ====================

startPracticeBtn.addEventListener('click', () => {
  if (startPracticeBtn.disabled) return;

  // Get text
  if (practiceState.textSource === 'custom') {
    practiceState.currentText = practiceState.customText.trim();
  } else {
    practiceState.currentText = generateText(
      practiceState.difficulty,
      practiceState.sessionLength
    );
  }

  if (practiceState.currentText.length < 10) {
    alert('Text is too short. Please provide at least 10 characters.');
    return;
  }

  // Calculate session duration based on session length
  let durationSeconds = null;
  if (practiceState.sessionLength === 'short') {
    durationSeconds = 120; // 2 minutes
  } else if (practiceState.sessionLength === 'medium') {
    durationSeconds = 300; // 5 minutes
  }
  // 'long' has no time limit

  // Reset state
  practiceState.isPracticeActive = true;
  practiceState.startTime = Date.now();
  practiceState.firstKeystrokeTime = null;
  practiceState.typedChars = [];
  practiceState.errorIndices = new Set();
  practiceState.totalErrors = 0;
  practiceState.backspaceCount = 0;
  practiceState.sessionDuration = durationSeconds;
  practiceState.alertShown = false;

  // Hide alert if visible
  practiceAlert.classList.remove('active');

  // Show typing interface
  showScreen('typing');
  renderText();
  practiceInput.value = '';
  practiceInput.focus();

  // Disable paste
  practiceInput.addEventListener('paste', (e) => {
    e.preventDefault();
  });

  // Start stats update loop
  startStatsUpdate();

  // Start timer check if session has duration
  if (durationSeconds) {
    startTimerCheck();
  }
});

// ==================== TEXT RENDERING ====================

function renderText() {
  const text = practiceState.currentText;
  const typed = practiceState.typedChars.join('');
  let html = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const typedChar = typed[i];
    let classes = 'char';

    if (i < typed.length) {
      if (typedChar === char) {
        classes += ' correct';
      } else {
        classes += ' incorrect';
      }
    } else if (i === typed.length) {
      classes += ' current';
    }

    html += `<span class="${classes}" data-index="${i}">${char === ' ' ? '&nbsp;' : escapeHtml(char)}</span>`;
  }

  practiceTextDisplay.innerHTML = html;
}

function scrollToCurrentChar() {
  const currentChar = practiceTextDisplay.querySelector('.char.current');
  if (currentChar) {
    const container = practiceTextDisplay;
    const charTop = currentChar.offsetTop;
    const charHeight = currentChar.offsetHeight;
    const containerTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    // Scroll if character is outside visible area
    if (charTop < containerTop) {
      container.scrollTop = charTop - 20; // 20px padding
    } else if (charTop + charHeight > containerTop + containerHeight) {
      container.scrollTop = charTop + charHeight - containerHeight + 20;
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== TYPING HANDLER ====================

practiceInput.addEventListener('keydown', (e) => {
  if (!practiceState.isPracticeActive) return;

  // Record first keystroke time
  if (practiceState.firstKeystrokeTime === null && e.key.length === 1) {
    practiceState.firstKeystrokeTime = Date.now();
  }

  // Prevent paste
  if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
    e.preventDefault();
    return;
  }

  if (e.key === 'Backspace') {
    e.preventDefault();
    if (practiceState.typedChars.length > 0) {
      const removedIndex = practiceState.typedChars.length - 1;
      if (practiceState.errorIndices.has(removedIndex)) {
        practiceState.errorIndices.delete(removedIndex);
        practiceState.totalErrors = Math.max(0, practiceState.totalErrors - 1);
      }
      practiceState.backspaceCount++;
      practiceState.typedChars.pop();
      practiceInput.value = practiceState.typedChars.join('');
      renderText();
      updateStats();
    }
    return;
  }

  // Only process single character keys
  if (e.key.length !== 1) return;

  e.preventDefault();

  const nextIndex = practiceState.typedChars.length;
  const expectedChar = practiceState.currentText[nextIndex] || '';
  const typedChar = e.key;

  practiceState.typedChars.push(typedChar);
  practiceInput.value = practiceState.typedChars.join('');

  if (typedChar !== expectedChar) {
    practiceState.totalErrors++;
    practiceState.errorIndices.add(nextIndex);
  }

  renderText();
  updateStats();

  // Auto-scroll to current character
  scrollToCurrentChar();

  // Check if completed
  if (practiceState.typedChars.length >= practiceState.currentText.length) {
    completePractice();
  }
});

// ==================== STATS UPDATE ====================

let statsInterval = null;
let timerCheckInterval = null;

function startStatsUpdate() {
  if (statsInterval) clearInterval(statsInterval);
  statsInterval = setInterval(() => {
    if (practiceState.isPracticeActive) {
      updateStats();
    }
  }, 100);
}

function startTimerCheck() {
  if (timerCheckInterval) clearInterval(timerCheckInterval);

  timerCheckInterval = setInterval(() => {
    if (!practiceState.isPracticeActive || !practiceState.sessionDuration)
      return;
    if (practiceState.alertShown) return;

    // Use first keystroke time if available, otherwise use start time
    const timerStart =
      practiceState.firstKeystrokeTime || practiceState.startTime;
    const elapsedSeconds = (Date.now() - timerStart) / 1000;

    if (elapsedSeconds >= practiceState.sessionDuration) {
      showTimeAlert();
    }
  }, 1000); // Check every second
}

function showTimeAlert() {
  if (practiceState.alertShown) return;

  practiceState.alertShown = true;
  practiceAlert.classList.add('active');

  // Stop timer check
  if (timerCheckInterval) {
    clearInterval(timerCheckInterval);
    timerCheckInterval = null;
  }
}

function hideTimeAlert() {
  practiceAlert.classList.remove('active');
}

function updateStats() {
  const typed = practiceState.typedChars.join('');
  const correctChars = calculateCorrectChars(typed, practiceState.currentText);
  const totalChars = typed.length;

  // Use first keystroke time if available, otherwise use start time
  const timerStart =
    practiceState.firstKeystrokeTime || practiceState.startTime;
  const elapsedSeconds = (Date.now() - timerStart) / 1000;

  const wpm =
    elapsedSeconds > 0
      ? Math.round(correctChars / 5 / (elapsedSeconds / 60))
      : 0;

  const accuracy =
    totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

  document.getElementById('practiceWpm').textContent = wpm;
  document.getElementById('practiceAccuracy').textContent = accuracy + '%';
  document.getElementById('practiceChars').textContent =
    `${totalChars} / ${practiceState.currentText.length}`;
  document.getElementById('practiceTime').textContent =
    Math.round(elapsedSeconds) + 's';
}

function calculateCorrectChars(input, reference) {
  let correct = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === reference[i]) {
      correct++;
    }
  }
  return correct;
}

// ==================== COMPLETE PRACTICE ====================

function completePractice() {
  practiceState.isPracticeActive = false;
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
  if (timerCheckInterval) {
    clearInterval(timerCheckInterval);
    timerCheckInterval = null;
  }

  // Hide alert if visible
  hideTimeAlert();

  const typed = practiceState.typedChars.join('');
  const correctChars = calculateCorrectChars(typed, practiceState.currentText);
  const totalChars = typed.length;

  // Use first keystroke time if available, otherwise use start time
  const timerStart =
    practiceState.firstKeystrokeTime || practiceState.startTime;
  const elapsedSeconds = (Date.now() - timerStart) / 1000;

  const finalWpm =
    elapsedSeconds > 0
      ? Math.round(correctChars / 5 / (elapsedSeconds / 60))
      : 0;

  const finalAccuracy =
    totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

  // Save to local storage
  savePracticeSession({
    date: new Date().toISOString(),
    difficulty: practiceState.difficulty,
    wpm: finalWpm,
    accuracy: finalAccuracy,
    duration: Math.round(elapsedSeconds),
    characters: totalChars,
  });

  // Show completion screen
  document.getElementById('finalWpm').textContent = finalWpm;
  document.getElementById('finalAccuracy').textContent = finalAccuracy + '%';
  document.getElementById('finalChars').textContent = totalChars;
  document.getElementById('finalTime').textContent =
    Math.round(elapsedSeconds) + 's';

  showScreen('completion');
  viewStatsBtn.style.display = 'inline-block';
}

// ==================== LOCAL STORAGE ====================

const STORAGE_KEY = 'typingPracticeSessions';

function savePracticeSession(session) {
  const sessions = getPracticeSessions();
  sessions.push(session);
  // Keep last 100 sessions
  const limited = sessions.slice(-100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
}

function getPracticeSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

// ==================== COMPLETION ACTIONS ====================

// Alert action handlers
finishSessionBtn.addEventListener('click', () => {
  hideTimeAlert();
  completePractice();
});

continuePracticeBtn.addEventListener('click', () => {
  hideTimeAlert();
  // User continues practicing - alert won't show again
  practiceState.alertShown = true;
});

document.getElementById('practiceAgainBtn').addEventListener('click', () => {
  // Hide alert if visible
  hideTimeAlert();

  // Calculate session duration
  let durationSeconds = null;
  if (practiceState.sessionLength === 'short') {
    durationSeconds = 120;
  } else if (practiceState.sessionLength === 'medium') {
    durationSeconds = 300;
  }

  showScreen('typing');
  practiceState.isPracticeActive = true;
  practiceState.startTime = Date.now();
  practiceState.firstKeystrokeTime = null;
  practiceState.typedChars = [];
  practiceState.errorIndices = new Set();
  practiceState.totalErrors = 0;
  practiceState.backspaceCount = 0;
  practiceState.sessionDuration = durationSeconds;
  practiceState.alertShown = false;

  // Regenerate text if system-generated
  if (practiceState.textSource === 'system') {
    practiceState.currentText = generateText(
      practiceState.difficulty,
      practiceState.sessionLength
    );
  }

  renderText();
  practiceInput.value = '';
  practiceInput.focus();
  startStatsUpdate();

  // Start timer check if session has duration
  if (durationSeconds) {
    startTimerCheck();
  }
});

document.getElementById('changeSettingsBtn').addEventListener('click', () => {
  showScreen('config');
  viewStatsBtn.style.display = 'none';
});

// ==================== STATISTICS DASHBOARD ====================

let wpmChart = null;
let accuracyChart = null;

viewStatsBtn.addEventListener('click', () => {
  showScreen('stats');
  loadStatistics();
});

document.querySelectorAll('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document
      .querySelectorAll('.filter-btn')
      .forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    loadStatistics();
  });
});

function loadStatistics() {
  const sessions = getPracticeSessions();
  if (sessions.length === 0) {
    document.getElementById('bestWpm').textContent = '0';
    document.getElementById('avgAccuracy').textContent = '0%';
    document.getElementById('totalSessions').textContent = '0';
    return;
  }

  // Get active filter
  const activeFilter = document.querySelector('.filter-btn.active');
  const filter = activeFilter.dataset.filter || 'all';
  const period = activeFilter.dataset.period
    ? parseInt(activeFilter.dataset.period)
    : null;

  // Filter sessions
  let filtered = sessions;
  if (filter !== 'all') {
    filtered = filtered.filter((s) => s.difficulty === filter);
  }
  if (period) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);
    filtered = filtered.filter((s) => new Date(s.date) >= cutoffDate);
  }

  // Calculate summary stats
  const wpms = filtered.map((s) => s.wpm);
  const accuracies = filtered.map((s) => s.accuracy);

  const bestWpm = Math.max(...wpms, 0);
  const avgAccuracy =
    accuracies.length > 0
      ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length)
      : 0;

  document.getElementById('bestWpm').textContent = bestWpm;
  document.getElementById('avgAccuracy').textContent = avgAccuracy + '%';
  document.getElementById('totalSessions').textContent = filtered.length;

  // Update charts
  updateCharts(filtered);
}

function updateCharts(sessions) {
  // Sort by date
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const labels = sorted.map((s) => {
    const date = new Date(s.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const wpmData = sorted.map((s) => s.wpm);
  const accuracyData = sorted.map((s) => s.accuracy);

  // WPM Chart
  const wpmCtx = document.getElementById('wpmChart').getContext('2d');
  if (wpmChart) wpmChart.destroy();
  wpmChart = new Chart(wpmCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'WPM',
          data: wpmData,
          borderColor: 'rgb(33, 128, 141)',
          backgroundColor: 'rgba(33, 128, 141, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
        },
        title: {
          display: true,
          text: 'Words Per Minute Over Time',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });

  // Accuracy Chart
  const accCtx = document.getElementById('accuracyChart').getContext('2d');
  if (accuracyChart) accuracyChart.destroy();
  accuracyChart = new Chart(accCtx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Accuracy %',
          data: accuracyData,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
        },
        title: {
          display: true,
          text: 'Accuracy Trend',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  });
}

// ==================== ESCAPE HANDLER ====================

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && practiceState.isPracticeActive) {
    if (
      confirm(
        'Are you sure you want to exit practice? Your progress will not be saved.'
      )
    ) {
      practiceState.isPracticeActive = false;
      if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
      }
      if (timerCheckInterval) {
        clearInterval(timerCheckInterval);
        timerCheckInterval = null;
      }
      hideTimeAlert();
      showScreen('config');
      practiceInput.value = '';
    }
  }
});

// ==================== INITIALIZE ====================

showScreen('config');
validateStartButton();

// Load statistics on page load if there are any sessions
const sessions = getPracticeSessions();
if (sessions.length > 0) {
  viewStatsBtn.style.display = 'inline-block';
}

const socket = io();

let competitionId = null;
let rounds = [];
let competitionCode = null;
let completedRounds = new Set();

// Network status variables
let isOnline = navigator.onLine;
let isConnected = false;
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;

// Check authentication
const authToken = localStorage.getItem('authToken');
if (!authToken) {
  window.location.href = '/login';
}

// Helper function to get auth headers
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
}

// DOM Elements
const compNameInput = document.getElementById('compName');
const compDescriptionInput = document.getElementById('compDescription');
const addRoundBtn = document.getElementById('addRoundBtn');
const roundsList = document.getElementById('roundsList');
const createCompBtn = document.getElementById('createCompBtn');
const codeDisplay = document.getElementById('codeDisplay');
const codeValue = document.getElementById('codeValue');
const roundSelector = document.getElementById('roundSelector');
const roundButtonsList = document.getElementById('roundButtonsList');
const startRoundBtn = document.getElementById('startRoundBtn');
const leaderboardContainer = document.getElementById('leaderboardContainer');
const roundStatus = document.getElementById('roundStatus');
const participantCountDisplay = document.getElementById('participantCountDisplay');
const compInfo = document.getElementById('compInfo');
const compNameDisplay = document.getElementById('compNameDisplay');
const statusDisplay = document.getElementById('statusDisplay');
const exportSection = document.getElementById('exportSection');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');

let selectedRound = null;

// Add new round
addRoundBtn.addEventListener('click', () => {
  const roundIndex = rounds.length;
  rounds.push({ text: '', language: 'en', duration: 60 });
  renderRounds();
});

// Render rounds UI
function renderRounds() {
  roundsList.innerHTML = '';
  
  rounds.forEach((round, index) => {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'round-item';
    roundDiv.innerHTML = `
      <div class="round-header">
        <h4>Round ${index + 1}</h4>
        <button class="btn-remove">✕</button>
      </div>
      <div class="form-group">
        <label>Language</label>
        <select id="language-${index}" class="round-language">
          <option value="en" ${round.language === 'en' ? 'selected' : ''}>English</option>
          <option value="es" ${round.language === 'es' ? 'selected' : ''}>Spanish</option>
          <option value="fr" ${round.language === 'fr' ? 'selected' : ''}>French</option>
          <option value="de" ${round.language === 'de' ? 'selected' : ''}>German</option>
          <option value="it" ${round.language === 'it' ? 'selected' : ''}>Italian</option>
          <option value="pt" ${round.language === 'pt' ? 'selected' : ''}>Portuguese</option>
          <option value="ru" ${round.language === 'ru' ? 'selected' : ''}>Russian</option>
          <option value="ar" ${round.language === 'ar' ? 'selected' : ''}>Arabic</option>
          <option value="hi" ${round.language === 'hi' ? 'selected' : ''}>Hindi</option>
          <option value="zh" ${round.language === 'zh' ? 'selected' : ''}>Chinese</option>
          <option value="ja" ${round.language === 'ja' ? 'selected' : ''}>Japanese</option>
          <option value="ko" ${round.language === 'ko' ? 'selected' : ''}>Korean</option>
        </select>
      </div>
      <div class="form-group">
        <label>Text to Type</label>
        <textarea placeholder="Enter paragraph..." id="text-${index}" class="round-text">${round.text}</textarea>
        <span class="char-count">Characters: <span id="count-${index}">0</span></span>
      </div>
      <div class="form-group">
        <label>Duration (seconds)</label>
        <input type="number" id="duration-${index}" value="${round.duration}" min="10" max="300" />
      </div>
    `;
    roundsList.appendChild(roundDiv);

    // Delete-Round button listener
    const deleteBtn = roundDiv.querySelector('.btn-remove');
    deleteBtn.addEventListener('click', () => removeRound(index));

    // Persist text input into state
    const textarea = document.getElementById(`text-${index}`);
    textarea.addEventListener('input', function () {
      rounds[index].text = this.value;
      // Character counter
      document.getElementById(`count-${index}`).textContent = this.value.length;
    });

    // Persist duration input into state
    const durationInput = document.getElementById(`duration-${index}`);
    durationInput.addEventListener('input', function () {
      rounds[index].duration = Number(this.value);
    });
  });
}

// Remove round
function removeRound(index) {
  rounds.splice(index, 1);
  renderRounds();
}

// Create competition
createCompBtn.addEventListener('click', async () => {
  const compName = compNameInput.value.trim();
  const compDescription = compDescriptionInput.value.trim();
 const maxPlayersInput = document.getElementById("maxPlayers");
const maxPlayers = maxPlayersInput && maxPlayersInput.value
  ? parseInt(maxPlayersInput.value, 10)
  : null;

  if (maxPlayers !== null && (isNaN(maxPlayers) || maxPlayers < 1)) {
  alert("Maximum players must be a number greater than 0");
  return;
}


  if (compName.length < 3) {
    alert('Please enter competition name with at least 3 characters');
    return;
  }

  if (rounds.length === 0) {
    alert('Please add at least one round');
    return;
  }

  // Collect updated rounds
  rounds = rounds.map((round, index) => ({
    text: document.getElementById(`text-${index}`).value.trim(),
    language: document.getElementById(`language-${index}`).value,
    duration: parseInt(document.getElementById(`duration-${index}`).value)
  }));

  if (rounds.some(r => r.text.length < 10 || !(30 <= r.duration && r.duration <= 600))) {
    alert('All rounds must have text minimum of 10 characters and duration between 30 and 600 seconds');
    return;
  }

  try {
    const response = await fetch('/api/create', {
      method: 'POST',
      headers: getAuthHeaders(),
    body: JSON.stringify({
  name: compName,
  description: compDescription,
  rounds,
  maxPlayers // 👈 ADD THIS
})

    });

    const data = await response.json();

    if (response.status === 401) {
      alert('Session expired. Please login again.');
      localStorage.clear();
      window.location.href = '/login';
      return;
    }

    if (data.success) {
      competitionId = data.competitionId;
      competitionCode = data.code;
      codeValue.textContent = data.code;

      // Transition UI - hide form, show code
      document.getElementById('setupForm').classList.add('hidden');
      codeDisplay.classList.remove('hidden');
      codeDisplay.classList.add('show');

      // Show control panel elements
      roundSelector.classList.remove('hidden');
      compInfo.classList.remove('hidden');

      compNameDisplay.textContent = compName;
      statusDisplay.textContent = 'Ready';

      // Render round buttons
      renderRoundButtons();

      socket.emit('organizerJoin', {
        competitionId,
        code: data.code
      });
    } else {
      alert('Failed to create competition');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Connection error');
  }
});

// ============= KEYBOARD SHORTCUTS =============
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'Enter':
      // Submit form or create competition
      if (document.getElementById('setupForm') && !document.getElementById('setupForm').classList.contains('hidden')) {
        e.preventDefault();
        createCompBtn.click();
      }
      break;
    case 'Tab':
      // Switch to participant role
      e.preventDefault();
      window.location.href = "/participant.html";
      break;
    case 'Escape':
      // Close modals or go back
      e.preventDefault();
      // Add logic to close any open modals or go back
      break;
    case 'ArrowUp':
    case 'ArrowDown':
      // Navigate rounds or options
      e.preventDefault();
      const roundButtons = document.querySelectorAll('.round-btn:not(.completed)');
      if (roundButtons.length > 0) {
        const currentIndex = Array.from(roundButtons).findIndex(btn => btn.classList.contains('active'));
        let nextIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % roundButtons.length;
        } else {
          nextIndex = currentIndex === 0 ? roundButtons.length - 1 : currentIndex - 1;
        }
        roundButtons[nextIndex].click();
      }
      break;
    case ' ':
      // Start round
      if (startRoundBtn && !startRoundBtn.disabled) {
        e.preventDefault();
        startRoundBtn.click();
      }
      break;
  }
});

// Render round buttons with status
function renderRoundButtons() {
  roundButtonsList.innerHTML = '';
  rounds.forEach((round, index) => {
    const isCompleted = completedRounds.has(index);
    const btn = document.createElement('button');
    btn.className = `round-btn ${isCompleted ? 'completed' : ''}`;
    btn.textContent = `Round ${index + 1}`;
    btn.disabled = isCompleted;
    btn.style.opacity = isCompleted ? '0.5' : '1';
    btn.style.cursor = isCompleted ? 'not-allowed' : 'pointer';
    
    btn.addEventListener('click', () => {
      selectedRound = index;
      
      // Remove previous selection
      document.querySelectorAll('.round-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update round details
      document.getElementById('selectedRoundText').textContent = 
        `📄 ${round.text.substring(0, 100)}...`;
      document.getElementById('selectedRoundTime').textContent = 
        `⏱️ Duration: ${round.duration} seconds`;
      
      startRoundBtn.disabled = isCompleted;
    });

    if (index === 0) {
      btn.classList.add('active');
      selectedRound = 0;
      document.getElementById('selectedRoundText').textContent = 
        `📄 ${round.text.substring(0, 100)}...`;
      document.getElementById('selectedRoundTime').textContent = 
        `⏱️ Duration: ${round.duration} seconds`;
      startRoundBtn.disabled = false;
    }

    roundButtonsList.appendChild(btn);
  });
}

// Start round
startRoundBtn.addEventListener('click', () => {
  if (selectedRound === null || selectedRound === undefined) {
    alert('Select a round first');
    return;
  }

  if (completedRounds.has(selectedRound)) {
    alert('This round has already been completed');
    return;
  }

  socket.emit('startRound', {
    competitionId,
    roundIndex: selectedRound
  });

  startRoundBtn.disabled = true;
  showRoundStatus(selectedRound);
});

// Show round status
function showRoundStatus(roundIndex) {
  roundStatus.classList.remove('hidden');
  document.getElementById('roundNumber').textContent = roundIndex + 1;

  const duration = rounds[roundIndex].duration;
  let timeLeft = duration;

  const timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('roundTimer').textContent = timeLeft;
    
    const progress = ((duration - timeLeft) / duration) * 100;
    document.getElementById('progressFill').style.transform = `scaleX(${progress / 100})`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      roundStatus.classList.add('hidden');
      
      // Mark round as completed
      completedRounds.add(roundIndex);
      
      // Disable the round button
      const roundButtons = document.querySelectorAll('.round-btn');
      if (roundButtons[roundIndex]) {
        roundButtons[roundIndex].disabled = true;
        roundButtons[roundIndex].classList.add('completed');
        roundButtons[roundIndex].style.opacity = '0.5';
        roundButtons[roundIndex].style.cursor = 'not-allowed';
      }
      
      // Disable start button if this round was selected
      if (selectedRound === roundIndex) {
        startRoundBtn.disabled = true;
      }
    }
  }, 1000);
}

// Copy code to clipboard
function copyCode() {
  const codeEl = document.getElementById("codeValue");
  if (!codeEl) return;

  const text = codeEl.textContent || codeEl.innerText || "";
  if (!text) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(err => {
      console.error("Clipboard copy failed:", err);
    });
  } else {
    // Fallback for older browsers
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      console.error("execCommand copy failed:", e);
    }
    document.body.removeChild(temp);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", copyCode);
  }
});

// ============= NETWORK STATUS FUNCTIONS =============

// Update network status indicator
function updateNetworkStatus(online, connected = null) {
  const networkStatus = document.getElementById('networkStatus');
  const networkIcon = document.getElementById('networkIcon');
  const networkText = document.getElementById('networkText');

  if (!networkStatus) return;

  isOnline = online;
  if (connected !== null) {
    isConnected = connected;
  }

  if (!online) {
    networkStatus.className = 'network-status offline';
    networkIcon.textContent = '🔴';
    networkText.textContent = 'Offline';
  } else if (!isConnected) {
    networkStatus.className = 'network-status connecting';
    networkIcon.textContent = '🟡';
    networkText.textContent = 'Connecting...';
  } else {
    networkStatus.className = 'network-status online';
    networkIcon.textContent = '🟢';
    networkText.textContent = 'Online';
  }
}

// Show error overlay
function showErrorOverlay(title, message, showRetry = true) {
  const overlay = document.getElementById('errorOverlay');
  const titleEl = document.getElementById('errorTitle');
  const messageEl = document.getElementById('errorMessage');
  const retryBtn = document.getElementById('retryBtn');

  if (!overlay) return;

  titleEl.textContent = title;
  messageEl.textContent = message;
  retryBtn.style.display = showRetry ? 'inline-block' : 'none';

  overlay.classList.add('show');
}

// Hide error overlay
function hideErrorOverlay() {
  const overlay = document.getElementById('errorOverlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
}

// Attempt to reconnect to server
function attemptReconnect() {
  if (reconnectAttempts >= maxReconnectAttempts) {
    showErrorOverlay(
      'Connection Failed',
      'Unable to reconnect to the server after multiple attempts. Please refresh the page or check your internet connection.',
      true
    );
    return;
  }

  reconnectAttempts++;
  updateNetworkStatus(isOnline, false);

  // Try to reconnect socket
  socket.connect();

  // Set timeout for reconnection attempt
  setTimeout(() => {
    if (!socket.connected) {
      if (reconnectAttempts < maxReconnectAttempts) {
        attemptReconnect();
      }
    }
  }, 2000);
}

// Initialize network monitoring
function initNetworkMonitoring() {
  // Initial status
  updateNetworkStatus(navigator.onLine, socket.connected);

  // Listen for online/offline events
  window.addEventListener('online', () => {
    updateNetworkStatus(true, false);
    if (!socket.connected) {
      attemptReconnect();
    }
  });

  window.addEventListener('offline', () => {
    updateNetworkStatus(false, false);
    reconnectAttempts = 0;
  });

  // Socket connection events
  socket.on('connect', () => {
    isConnected = true;
    reconnectAttempts = 0;
    updateNetworkStatus(isOnline, true);
    hideErrorOverlay();
  });

  socket.on('connect_error', (error) => {
    isConnected = false;
    updateNetworkStatus(isOnline, false);
    console.error('Connection error:', error);

    if (isOnline) {
      showErrorOverlay(
        'Connection Error',
        'Lost connection to the server. Attempting to reconnect...',
        true
      );
    }
  });

  socket.on('disconnect', (reason) => {
    isConnected = false;
    updateNetworkStatus(isOnline, false);

    if (reason === 'io server disconnect') {
      showErrorOverlay(
        'Disconnected',
        'The server disconnected you. This might be due to server maintenance or an error.',
        true
      );
    } else if (reason === 'io client disconnect') {
      // User intentionally disconnected
    } else {
      if (isOnline) {
        showErrorOverlay(
          'Connection Lost',
          'Lost connection to the server. Attempting to reconnect...',
          true
        );
        attemptReconnect();
      }
    }
  });

  // Error overlay buttons
  const retryBtn = document.getElementById('retryBtn');
  const dismissBtn = document.getElementById('dismissBtn');

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      hideErrorOverlay();
      if (!socket.connected && isOnline) {
        reconnectAttempts = 0;
        attemptReconnect();
      }
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      hideErrorOverlay();
    });
  }
}

// Socket events
socket.on('participantJoined', (data) => {
  participantCountDisplay.textContent = data.totalParticipants;
  console.log(`✓ ${data.name} joined`);
});

socket.on('leaderboardUpdate', (data) => {
  const leaderboard = data.leaderboard;
  leaderboardContainer.innerHTML = `
    <h4>🏁 Live Round ${data.roundIndex + 1}</h4>
    ${leaderboard.map((item, index) => `
      <div class="leaderboard-item top-${index < 3 ? index + 1 : ''}">
        <span class="leaderboard-rank">#${index + 1}</span>
        <span class="leaderboard-name">${item.name}</span>
        <span class="leaderboard-stats">
          <span>🏃 ${item.wpm} WPM</span>
          <span>🎯 ${item.accuracy}%</span>
          <span class="text-red">❌ ${item.errors ?? 0}</span>
          <span class="text-yellow">⌫ ${item.backspaces ?? 0}</span>
        </span>
      </div>
    `).join('')}
  `;
});

socket.on('roundEnded', (data) => {
  leaderboardContainer.innerHTML = `
    <h4>✅ Round ${data.roundIndex + 1} - Final Results</h4>
    ${data.leaderboard.map((item, index) => `
      <div class="leaderboard-item top-${index < 3 ? index + 1 : ''}">
        <span class="leaderboard-rank">#${index + 1}</span>
        <span class="leaderboard-name">${item.name}</span>
        <span class="leaderboard-stats">
          <span>🏃 ${item.wpm} WPM</span>
          <span>🎯 ${item.accuracy}%</span>
          <span class="text-red">❌ ${item.errors ?? 0}</span>
          <span class="text-yellow">⌫ ${item.backspaces ?? 0}</span>
        </span>
      </div>
    `).join('')}
  `;
});

socket.on('finalResults', (data) => {
  console.log('Final Results:', data.rankings);
  statusDisplay.textContent = 'Completed';
  statusDisplay.className = 'status-badge completed';
  
  // Show export section
  exportSection.classList.remove('hidden');
  
  leaderboardContainer.innerHTML = `
    <h4>🏆 Final Rankings 🏆</h4>
    ${data.rankings.map((item, index) => {
      const medals = ['🥇', '🥈', '🥉'];
      const medal = medals[index] || `#${index + 1}`;
      return `
        <div class="leaderboard-item final-rank">
          <span class="medal">${medal}</span>
          <span class="leaderboard-name">${item.name}</span>
          <span class="leaderboard-stats">
            <span>Avg: ${item.avgWpm} WPM</span>
            <span>🎯 ${item.avgAccuracy}%</span>
            <span class="text-red">❌ ${item.totalErrors ?? 0}</span>
            <span class="text-yellow">⌫ ${item.totalBackspaces ?? 0}</span>
          </span>
        </div>
      `;
    }).join('')}
  `;
});

// Display organizer name
const organizerName = localStorage.getItem('organizerName');
if (organizerName) {
  document.getElementById('organizerName').textContent = organizerName;
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.clear();
    window.location.href = '/login';
  }
});

// Export Functionality
async function fetchRankings() {
  try {
    const response = await fetch(`/api/competition/${competitionId}/rankings`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (data.success) {
      return data;
    }
    throw new Error(data.error || 'Failed to fetch rankings');
  } catch (error) {
    console.error('Export error:', error);
    alert('Error fetching rankings for export: ' + error.message);
    return null;
  }
}

exportExcelBtn.addEventListener('click', async () => {
  const data = await fetchRankings();
  if (!data) return;

  try {
    const sheetData = [
      [data.name],
      ['Generated on', new Date().toLocaleString()],
      [],
      ['Rank', 'Participant Name', 'Average WPM', 'Average Accuracy (%)', 'Total Rounds Completed', 'Highest WPM', 'Lowest WPM']
    ];

    data.rankings.forEach(item => {
      sheetData.push([
        item.rank,
        item.participantName,
        item.averageWpm,
        item.averageAccuracy,
        item.totalRoundsCompleted,
        item.highestWpm,
        item.lowestWpm
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rankings');
    XLSX.writeFile(wb, `${data.code}_rankings_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    alert('Error generating Excel: ' + error.message);
  }
});

exportPdfBtn.addEventListener('click', async () => {
  const data = await fetchRankings();
  if (!data) return;

  try {
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.color = '#000000'; // Force black text for PDF
    element.style.backgroundColor = '#ffffff'; // Force white background for PDF

    let html = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #218080; margin: 10px 0;">${data.name}</h1>
        <p style="color: #666; margin: 5px 0;">Competition Code: ${data.code}</p>
        <p style="color: #999; font-size: 12px;">Generated on ${new Date().toLocaleString()}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; color: #000000;">
        <thead>
          <tr style="background-color: #218080; color: #ffffff;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Rank</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Participant Name</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Avg WPM</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Accuracy</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Rounds</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.rankings.forEach((item, index) => {
      const rowBg = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
      html += `
        <tr style="background-color: ${rowBg}; color: #000000;">
          <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${item.rank}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${item.participantName}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.averageWpm}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.averageAccuracy}%</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.totalRoundsCompleted}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    element.innerHTML = html;

    const options = {
      margin: 10,
      filename: `${data.code}_rankings.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
  } catch (error) {
    alert('Error generating PDF: ' + error.message);
  }
});

// Initialize network monitoring when page loads
document.addEventListener('DOMContentLoaded', initNetworkMonitoring);

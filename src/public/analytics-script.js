// Analytics Dashboard Script
let charts = {};
Chart.defaults.color = '#eaeaea';
Chart.defaults.borderColor = 'rgba(255,255,255,0.15)';
Chart.defaults.plugins.legend.labels.color = '#eaeaea';
Chart.defaults.scale.grid.color = 'rgba(255,255,255,0.08)';

// Check authentication
function checkAuth() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  return token;
}

// API call helper
async function fetchAnalytics(endpoint) {
  const token = checkAuth();
  if (!token) return null;

  try {
    const response = await fetch(`/api/analytics/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = 'login.html';
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  document.getElementById('loading').style.display = 'none';
}

// Update overview stats
function updateOverviewStats(data) {
  document.getElementById('totalCompetitions').textContent =
    data.competitions.total;
  document.getElementById('activeCompetitions').textContent =
    data.competitions.active;
  document.getElementById('completedCompetitions').textContent =
    data.competitions.completed;
  document.getElementById('totalParticipants').textContent =
    data.participants.total;
  document.getElementById('avgParticipants').textContent =
    data.participants.average;
  document.getElementById('avgWPM').textContent = data.performance.avgWPM;
  document.getElementById('maxWPM').textContent = data.performance.maxWPM;
}

// Create Competitions Activity Chart
function createCompetitionsChart(data) {
  const ctx = document.getElementById('competitionsChart');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (charts.competitions) {
    charts.competitions.destroy();
  }

  if (!data || data.length === 0) {
    ctx.parentElement.innerHTML =
      '<div class="empty-state"><h3>No competition data yet</h3><p>Create competitions to see activity trends</p></div>';
    return;
  }

  charts.competitions = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map((c) => c.name),
      datasets: [
        {
          label: 'Participants',
          data: data.map((c) => c.participants),
          backgroundColor: 'rgba(52, 152, 219, 0.7)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 2,
        },
        {
          label: 'Rounds',
          data: data.map((c) => c.rounds),
          backgroundColor: 'rgba(46, 204, 113, 0.7)',
          borderColor: 'rgba(46, 204, 113, 1)',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            afterLabel: function (context) {
              const index = context.dataIndex;
              return `Code: ${data[index].code}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });
}

// Create Performance Trends Chart
function createTrendsChart(performanceData) {
  const ctx = document.getElementById('trendsChart');
  if (!ctx) return;

  // Destroy existing chart
  if (charts.trends) {
    charts.trends.destroy();
  }

  if (!performanceData || performanceData.length === 0) {
    ctx.parentElement.innerHTML =
      '<div class="empty-state"><h3>No performance data yet</h3><p>Complete rounds to see performance trends</p></div>';
    return;
  }

  charts.trends = new Chart(ctx, {
    type: 'line',
    data: {
      labels: performanceData.map((d) => formatDate(d.date)),
      datasets: [
        {
          label: 'Avg WPM',
          data: performanceData.map((d) => d.avgWPM),
          borderColor: 'rgba(52, 152, 219, 1)',
          tension: 0.4,
          fill: true,
          backgroundColor: (ctx) => {
            const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(52, 152, 219, 0.4)');
            gradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
            return gradient;
          },
        },
        {
          label: 'Avg Accuracy (%)',
          data: performanceData.map((d) => d.avgAccuracy),
          borderColor: 'rgba(46, 204, 113, 1)',
          tension: 0.4,
          fill: true,
          backgroundColor: (ctx) => {
            const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(46, 204, 113, 0.4)');
            gradient.addColorStop(1, 'rgba(46, 204, 113, 0)');
            return gradient;
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => {
              if (context.dataset.label.includes('Accuracy')) {
                return `${context.raw}% Accuracy`;
              }
              return `${context.raw} WPM`;
            },
          },
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

// Create Participant Distribution Chart
function createParticipantsChart(distribution) {
  const ctx = document.getElementById('participantsChart');
  if (!ctx) return;

  // Destroy existing chart
  if (charts.participants) {
    charts.participants.destroy();
  }

  if (!distribution || distribution.length === 0) {
    ctx.parentElement.innerHTML =
      '<div class="empty-state"><h3>No participant data</h3><p>Participants will appear after joining competitions</p></div>';
    return;
  }

  charts.participants = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: distribution.map((d) => d.competition),
      datasets: [
        {
          label: 'Participants',
          data: distribution.map((d) => d.participants),
          backgroundColor: [
            'rgba(52, 152, 219, 0.8)',
            'rgba(46, 204, 113, 0.8)',
            'rgba(155, 89, 182, 0.8)',
            'rgba(241, 196, 15, 0.8)',
            'rgba(230, 126, 34, 0.8)',
            'rgba(231, 76, 60, 0.8)',
            'rgba(149, 165, 166, 0.8)',
            'rgba(52, 73, 94, 0.8)',
            'rgba(26, 188, 156, 0.8)',
            'rgba(243, 156, 18, 0.8)',
          ],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 10,
          },
        },
      },
    },
  });
}

// Create Competition Performance Chart
function createPerformanceChart(data) {
  const ctx = document.getElementById('performanceChart');
  if (!ctx) return;

  // Destroy existing chart
  if (charts.performance) {
    charts.performance.destroy();
  }

  if (!data || data.length === 0) {
    ctx.parentElement.innerHTML =
      '<div class="empty-state"><h3>No performance data</h3><p>Complete rounds to see competition performance</p></div>';
    return;
  }

  charts.performance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map((c) => c.name),
      datasets: [
        {
          label: 'Average WPM',
          data: data.map((c) => c.avgWPM),
          backgroundColor: 'rgba(155, 89, 182, 0.7)',
          borderColor: 'rgba(155, 89, 182, 1)',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        yWPM: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          title: { display: true, text: 'WPM' },
        },
        yAccuracy: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          max: 100,
          title: { display: true, text: 'Accuracy (%)' },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

// Update top performers table
function updateTopPerformersTable(performers) {
  const tableBody = document.getElementById('topPerformersTable');
  if (!tableBody) return;

  if (!performers || performers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #95a5a6;">
          No performance data available yet
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = performers
    .map((performer, index) => {
      let badge = '';
      if (index === 0) badge = '<span class="badge badge-gold">🥇 1st</span>';
      else if (index === 1)
        badge = '<span class="badge badge-silver">🥈 2nd</span>';
      else if (index === 2)
        badge = '<span class="badge badge-bronze">🥉 3rd</span>';
      else badge = `<span style="color: #95a5a6;">#${index + 1}</span>`;

      return `
        <tr>
          <td>${badge}</td>
          <td><strong>${performer.name}</strong></td>
          <td>${performer.avgWPM} WPM</td>
          <td>${performer.maxWPM} WPM</td>
          <td>${performer.totalRounds}</td>
          <td>${performer.avgAccuracy}%</td>
        </tr>
      `;
    })
    .join('');
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Load all analytics data
async function loadAnalytics() {
  try {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('content').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';

    const period = document.getElementById('periodSelector').value;

    // Fetch all data in parallel
    const [overview, competitions, participants, trends] = await Promise.all([
      fetchAnalytics('overview'),
      fetchAnalytics('competitions'),
      fetchAnalytics('participants'),
      fetchAnalytics(`trends?period=${period}`),
    ]);

    if (!overview || !competitions || !participants || !trends) {
      throw new Error('Failed to fetch analytics data');
    }

    // Update overview stats
    updateOverviewStats(overview.data);

    // Create charts
    createCompetitionsChart(competitions.data);
    createPerformanceChart(competitions.data);
    createParticipantsChart(participants.data.distribution);
    createTrendsChart(trends.data.performance);

    // Update top performers table
    updateTopPerformersTable(participants.data.topPerformers);
    createAccuracyVsWpmChart(participants.data.topPerformers);

    // Show content
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
  } catch (error) {
    console.error('Error loading analytics:', error);
    showError(
      'Failed to load analytics data. Please try again or check your connection.'
    );
  }
}

function createAccuracyVsWpmChart(data) {
  const ctx = document.getElementById('accuracyVsWpmChart');
  if (!ctx) return;

  if (charts.accuracyVsWpm) {
    charts.accuracyVsWpm.destroy();
  }

  charts.accuracyVsWpm = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Participants',
          data: data.map((p) => ({
            x: p.avgWPM,
            y: p.avgAccuracy,
          })),
          backgroundColor: 'rgba(241, 196, 15, 0.8)',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: 'WPM' },
        },
        y: {
          title: { display: true, text: 'Accuracy (%)' },
          max: 100,
        },
      },
    },
  });
}

// Period selector change handler
document.getElementById('periodSelector').addEventListener('change', () => {
  loadAnalytics();
});

// Load analytics on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadAnalytics();
});

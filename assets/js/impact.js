(function () {
  /* --- Module Setup --- */
  const storage = window.GreenTrackStorage;
  if (!storage) {
    return;
  }

  const statAreas = document.getElementById('statAreas');
  const statGroups = document.getElementById('statGroups');
  const statResolved = document.getElementById('statResolved');
  const leaderboardBody = document.querySelector('#leaderboardTable tbody');

  /* --- Statistics Aggregation --- */
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString();
  }

  function renderStats(logs, reports) {
    const uniqueGroups = new Set(logs.map(function (log) {
      return log.group_name;
    }));

    statAreas.textContent = String(logs.length);
    statGroups.textContent = String(uniqueGroups.size);
    statResolved.textContent = String(reports.filter(function (report) {
      return report.status === 'Resolved';
    }).length);
  }

  /* --- Leaderboard Calculation --- */
  function buildLeaderboard(logs) {
    const byGroup = {};

    logs.forEach(function (log) {
      if (!byGroup[log.group_name]) {
        byGroup[log.group_name] = {
          group_name: log.group_name,
          count: 0,
          last_timestamp: log.timestamp
        };
      }

      byGroup[log.group_name].count += 1;
      if (new Date(log.timestamp) > new Date(byGroup[log.group_name].last_timestamp)) {
        byGroup[log.group_name].last_timestamp = log.timestamp;
      }
    });

    return Object.values(byGroup).sort(function (a, b) {
      if (b.count === a.count) {
        return new Date(b.last_timestamp) - new Date(a.last_timestamp);
      }
      return b.count - a.count;
    });
  }

  /* --- Leaderboard Rendering --- */
  function renderLeaderboard(sortedRows) {
    leaderboardBody.innerHTML = '';

    if (!sortedRows.length) {
      leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center">No tasks logged yet.</td></tr>';
      return;
    }

    sortedRows.forEach(function (row, index) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>#' + (index + 1) + '</td>' +
        '<td>' + row.group_name + '</td>' +
        '<td>' + row.count + '</td>' +
        '<td>' + formatDate(row.last_timestamp) + '</td>';
      leaderboardBody.appendChild(tr);
    });
  }

  /* --- Page Bootstrap --- */
  async function init() {
    const logs = await storage.getCleaningLogs();
    const reports = await storage.getIssueReports();
    const leaderboard = buildLeaderboard(logs);
    renderStats(logs, reports);
    renderLeaderboard(leaderboard);
  }

  init().catch(function () {
    if (leaderboardBody) {
      leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Unable to load leaderboard data.</td></tr>';
    }
  });
})();

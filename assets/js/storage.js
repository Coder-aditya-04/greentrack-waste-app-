(function () {
  /* --- Session Key Registry --- */
  const KEYS = {
    currentUser: 'gt_current_user'
  };

  /* --- In-Memory Metadata Cache --- */
  const state = {
    zones: [],
    groups: []
  };

  /* --- API Wrapper --- */
  async function api(path, options) {
    const response = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    const body = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      throw new Error(body.message || 'Request failed.');
    }

    return body;
  }

  /* --- Metadata Loading --- */
  async function loadMeta() {
    const payload = await api('/api/meta');
    state.zones = payload.zones || [];
    state.groups = payload.groups || [];
    return payload;
  }

  /* --- Session Storage Helpers --- */
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getCurrentUser() {
    return readJSON(KEYS.currentUser, null);
  }

  function setCurrentUser(user) {
    writeJSON(KEYS.currentUser, user);
  }

  function clearCurrentUser() {
    localStorage.removeItem(KEYS.currentUser);
  }

  /* --- Authentication APIs --- */
  async function signup(payload) {
    return api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async function login(payload) {
    return api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /* --- Task and Issue APIs --- */
  async function getCleaningLogs() {
    return api('/api/cleaning-logs');
  }

  async function addCleaningLog(payload) {
    return api('/api/cleaning-logs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async function getIssueReports() {
    return api('/api/issues');
  }

  async function addIssueReport(payload) {
    return api('/api/issues', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /* --- Public Module Export --- */
  window.GreenTrackStorage = {
    KEYS,
    loadMeta,
    get zones() {
      return state.zones;
    },
    get defaultGroups() {
      return state.groups;
    },
    signup,
    login,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    getCleaningLogs,
    addCleaningLog,
    getIssueReports,
    addIssueReport
  };
})();

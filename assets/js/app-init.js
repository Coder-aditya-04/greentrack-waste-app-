(function () {
  /* --- Module Setup --- */
  const storage = window.GreenTrackStorage;

  if (!storage) {
    return;
  }

  /* --- Route Protection --- */
  function enforceAuth() {
    const currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();
    const protectedPages = ['dashboard.html', 'impact.html', 'gallery.html'];
    const user = storage.getCurrentUser();

    if (protectedPages.includes(currentPage) && !user) {
      window.location.replace('auth.html');
    }

    if (currentPage === 'auth.html' && user) {
      window.location.replace('index.html');
    }
  }

  /* --- Logout Wiring --- */
  function setupLogout() {
    const logoutButton = document.getElementById('logoutBtn');
    if (!logoutButton) {
      return;
    }

    logoutButton.addEventListener('click', function () {
      storage.clearCurrentUser();
      window.location.replace('auth.html');
    });
  }

  enforceAuth();
  setupLogout();
})();

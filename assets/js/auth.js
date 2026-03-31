(function () {
  /* --- Module Setup --- */
  const storage = window.GreenTrackStorage;
  if (!storage) {
    return;
  }

  /* --- UI References --- */
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const authAlert = document.getElementById('authAlert');
  const loginEmailInput = document.getElementById('loginEmail');
  const loginPasswordInput = document.getElementById('loginPassword');
  const signupRoleSelect = document.getElementById('signupRole');
  const signupGroupSelect = document.getElementById('signupGroupName');
  const signupCustomGroupInput = document.getElementById('signupCustomGroup');

  /* --- Alert Renderer --- */
  function showAlert(type, message) {
    if (!authAlert) {
      return;
    }
    const alertClass = type === 'danger' ? 'form-alert error' : 'form-alert';
    authAlert.innerHTML = '<div class="' + alertClass + '">' + message + '</div>';
  }

  /* --- Role-Based Group Field Rules --- */
  function applyRoleRules() {
    if (!signupRoleSelect || !signupGroupSelect || !signupCustomGroupInput) {
      return;
    }

    const role = signupRoleSelect.value;
    const isBisMember = role === 'bis_member';

    signupGroupSelect.required = false;
    signupCustomGroupInput.required = false;

    if (isBisMember) {
      signupGroupSelect.setAttribute('aria-label', 'BIS Group required for BIS members');
      signupCustomGroupInput.setAttribute('aria-label', 'Custom group name required when no BIS group selected');
    } else {
      signupGroupSelect.value = '';
      signupCustomGroupInput.value = '';
      signupGroupSelect.setAttribute('aria-label', 'BIS Group optional for students');
      signupCustomGroupInput.setAttribute('aria-label', 'Custom group name optional for students');
    }
  }

  /* --- BIS Group Dropdown Loader --- */
  async function populateGroups() {
    if (!signupGroupSelect) {
      return;
    }

    try {
      if (!storage.defaultGroups.length) {
        await storage.loadMeta();
      }

      signupGroupSelect.innerHTML = '<option value="">Choose BIS Group (Optional)</option>';
      storage.defaultGroups.forEach(function (groupName) {
        const option = document.createElement('option');
        option.value = groupName;
        option.textContent = groupName;
        signupGroupSelect.appendChild(option);
      });
    } catch (error) {
      showAlert('danger', 'Unable to load BIS groups. Please refresh the page.');
    }
  }

  if (window.location.protocol === 'file:') {
    showAlert('danger', 'Open GreenTrack using http://localhost:3000/auth.html, not by double-clicking the HTML file.');
  }

  populateGroups();

  if (signupRoleSelect) {
    signupRoleSelect.addEventListener('change', applyRoleRules);
    applyRoleRules();
  }

  /* --- Signup Handler --- */
  if (signupForm) {
    signupForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim().toLowerCase();
      const password = document.getElementById('signupPassword').value.trim();
      const role = signupRoleSelect ? signupRoleSelect.value : '';
      const selectedGroupName = signupGroupSelect ? signupGroupSelect.value.trim() : '';
      const customGroupName = signupCustomGroupInput ? signupCustomGroupInput.value.trim() : '';
      const groupName = selectedGroupName || customGroupName;

      if (!name || !email || !password || !role) {
        showAlert('danger', 'Please complete all required signup fields.');
        return;
      }

      if (password.length < 6) {
        showAlert('danger', 'Password must be at least 6 characters long.');
        return;
      }

      if (!['student', 'bis_member'].includes(role)) {
        showAlert('danger', 'Please select a valid role.');
        return;
      }

      if (role === 'bis_member' && !groupName) {
        showAlert('danger', 'Please select or add a BIS group name.');
        return;
      }

      try {
        await storage.signup({
          name: name,
          email: email,
          password: password,
          role: role,
          group_name: groupName || null
        });
        if (loginEmailInput) {
          loginEmailInput.value = email;
        }
        if (loginPasswordInput) {
          loginPasswordInput.value = password;
        }
        const loginTabTrigger = document.getElementById('login-tab');
        if (loginTabTrigger && window.bootstrap && window.bootstrap.Tab) {
          window.bootstrap.Tab.getOrCreateInstance(loginTabTrigger).show();
        }
        showAlert('success', 'Signup successful. Continue with Login to enter GreenTrack.');
        signupForm.reset();
      } catch (error) {
        showAlert('danger', error.message);
      }
    });
  }

  /* --- Login Handler --- */
  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value.trim();

      if (!email || !password) {
        showAlert('danger', 'Please provide email and password.');
        return;
      }

      try {
        const payload = await storage.login({ email: email, password: password });
        storage.setCurrentUser(payload.user);
        showAlert('success', 'Login successful. Redirecting to homepage...');
        setTimeout(function () {
          window.location.replace('index.html');
        }, 500);
      } catch (error) {
        showAlert('danger', error.message || 'Invalid credentials. Please try again.');
      }
    });
  }
})();

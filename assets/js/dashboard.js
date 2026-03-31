(function () {
  /* --- Module Setup --- */
  const storage = window.GreenTrackStorage;
  if (!storage) {
    return;
  }

  /* --- UI References --- */
  const userBadge = document.getElementById('currentUserBadge');
  const form = document.getElementById('taskLoggerForm');
  const zoneSelect = document.getElementById('taskZone');
  const groupSelect = document.getElementById('taskGroupName');
  const dateInput = document.getElementById('taskDate');
  const beforeInput = document.getElementById('beforePhoto');
  const afterInput = document.getElementById('afterPhoto');
  const alertBox = document.getElementById('taskAlert');

  /* --- Local UI Helpers --- */
  function showAlert(type, message) {
    if (!alertBox) {
      return;
    }
    alertBox.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
  }

  /* --- File Conversion --- */
  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        reject(new Error('Both before and after photos are required.'));
        return;
      }
      if (!file.type.startsWith('image/')) {
        reject(new Error('Only image files can be uploaded.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = function (event) {
        resolve(event.target.result);
      };
      reader.onerror = function () {
        reject(new Error('Image read failed. Please try again.'));
      };
      reader.readAsDataURL(file);
    });
  }

  /* --- Metadata Rendering --- */
  function populateZones() {
    if (!zoneSelect) {
      return;
    }
    zoneSelect.innerHTML = '<option value="">Select zone</option>';
    storage.zones.forEach(function (zone) {
      const option = document.createElement('option');
      option.value = zone.zone_id;
      option.textContent = zone.name;
      zoneSelect.appendChild(option);
    });
  }

  function populateGroups() {
    if (!groupSelect) {
      return;
    }
    groupSelect.innerHTML = '<option value="">Select BIS group</option>';
    storage.defaultGroups.forEach(function (groupName) {
      const option = document.createElement('option');
      option.value = groupName;
      option.textContent = groupName;
      groupSelect.appendChild(option);
    });

    const user = storage.getCurrentUser();
    if (user && user.group_name) {
      groupSelect.value = user.group_name;
    }
  }

  /* --- User Badge Rendering --- */
  function setCurrentUserBadge() {
    const user = storage.getCurrentUser();
    if (!user || !userBadge) {
      return;
    }
    userBadge.textContent = user.name + ' | ' + user.role.replace('_', ' ');
  }

  /* --- Task Submission Handler --- */
  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      const zoneId = zoneSelect.value;
      const groupName = groupSelect.value;
      const selectedDate = dateInput.value;
      const beforeFile = beforeInput.files[0];
      const afterFile = afterInput.files[0];

      if (!zoneId || !groupName || !selectedDate) {
        showAlert('danger', 'Please fill all required task fields.');
        return;
      }

      try {
        const beforeImage = await fileToBase64(beforeFile);
        const afterImage = await fileToBase64(afterFile);

        await storage.addCleaningLog({
          zone_id: zoneId,
          group_name: groupName,
          before_image_data: beforeImage,
          after_image_data: afterImage,
          timestamp: new Date(selectedDate + 'T12:00:00').toISOString()
        });

        showAlert('success', 'Cleaning task logged successfully. Great work!');
        form.reset();
        const user = storage.getCurrentUser();
        if (user && user.group_name) {
          groupSelect.value = user.group_name;
        }
      } catch (error) {
        showAlert('danger', error.message);
      }
    });
  }

  /* --- Page Bootstrap --- */
  async function init() {
    if (!dateInput) {
      return;
    }
    dateInput.valueAsDate = new Date();
    await storage.loadMeta();
    populateZones();
    populateGroups();
    setCurrentUserBadge();
  }

  init().catch(function () {
    showAlert('danger', 'Unable to load metadata. Check API and MySQL setup.');
  });
})();

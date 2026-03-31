(function () {
  /* --- Module Setup --- */
  const storage = window.GreenTrackStorage;
  if (!storage) {
    return;
  }

  /* --- UI References --- */
  const reportForm = document.getElementById('reportIssueForm');
  const zoneSelect = document.getElementById('issueZone');
  const alertBox = document.getElementById('reportIssueAlert');
  const photoInput = document.getElementById('issuePhoto');
  const descriptionInput = document.getElementById('issueDescription');

  /* --- Alert Renderer --- */
  function showAlert(type, message) {
    if (!alertBox) {
      return;
    }
    alertBox.innerHTML = '<div class="alert alert-' + type + ' mb-2">' + message + '</div>';
  }

  /* --- Zone Dropdown Bootstrap --- */
  async function fillZones() {
    if (!zoneSelect) {
      return;
    }

    if (!storage.zones.length) {
      await storage.loadMeta();
    }

    zoneSelect.innerHTML = '<option value="">Select zone</option>';
    storage.zones.forEach(function (zone) {
      const option = document.createElement('option');
      option.value = zone.zone_id;
      option.textContent = zone.name;
      zoneSelect.appendChild(option);
    });
  }

  /* --- File Conversion --- */
  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        resolve(null);
        return;
      }

      if (!file.type.startsWith('image/')) {
        reject(new Error('Only image files are supported.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = function (event) {
        resolve(event.target.result);
      };
      reader.onerror = function () {
        reject(new Error('Unable to read image file.'));
      };
      reader.readAsDataURL(file);
    });
  }

  /* --- Static Assignment Mapping --- */
  function resolveAssignedGroup(zoneId) {
    const zoneToGroup = {
      'Z-01': 'Group Beta',
      'Z-02': 'Group Alpha',
      'Z-03': 'Group Gamma',
      'Z-04': 'Group Delta',
      'Z-05': 'Group Beta'
    };
    return zoneToGroup[zoneId] || 'Group Beta';
  }

  /* --- Form Submission Handler --- */
  if (reportForm) {
    reportForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const zoneId = zoneSelect.value;
      const description = descriptionInput.value.trim();

      if (!zoneId || !description) {
        showAlert('danger', 'Please select a zone and enter a description.');
        return;
      }

      try {
        const imageData = await fileToBase64(photoInput.files[0]);
        await storage.addIssueReport({
          zone_id: zoneId,
          description: description,
          status: 'Pending',
          image_data: imageData,
          timestamp: new Date().toISOString()
        });

        const assignedGroup = resolveAssignedGroup(zoneId);
        showAlert('success', 'Issue reported to ' + assignedGroup + '! Thank you for keeping the campus clean.');

        reportForm.reset();
        zoneSelect.value = '';
      } catch (error) {
        showAlert('danger', error.message);
      }
    });
  }

  fillZones().catch(function () {
    showAlert('danger', 'Unable to load zones. Check database connection.');
  });
})();

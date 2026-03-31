(function () {
  /* --- UI References --- */
  const form = document.getElementById('issuePageForm');
  const alertBox = document.getElementById('issueAlert');

  if (!form || !alertBox) {
    return;
  }

  /* --- Alert Renderer --- */
  function showAlert(message, isError) {
    const cls = isError ? 'form-alert error' : 'form-alert';
    alertBox.innerHTML = '<div class="' + cls + '">' + message + '</div>';
  }

  /* --- File Conversion --- */
  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        resolve(null);
        return;
      }

      if (!file.type.startsWith('image/')) {
        reject(new Error('Please upload a valid image file.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = function (event) {
        resolve(event.target.result);
      };
      reader.onerror = function () {
        reject(new Error('Could not read photo file.'));
      };
      reader.readAsDataURL(file);
    });
  }

  /* --- Location Mapper --- */
  function zoneToId(zoneName) {
    const map = {
      Canteen: 'Z-02',
      Library: 'Z-01',
      'Main Gate': 'Z-04',
      Parking: 'Z-05'
    };
    return map[zoneName] || 'Z-01';
  }

  /* --- Form Submission Handler --- */
  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const zoneName = document.getElementById('locationZone').value;
    const issueType = document.getElementById('issueType').value;
    const descriptionText = document.getElementById('issueDescriptionText').value.trim();
    const photoFile = document.getElementById('issuePhotoUpload').files[0];

    if (!zoneName || !issueType || !descriptionText) {
      showAlert('Please complete all required fields before submitting.', true);
      return;
    }

    try {
      const imageData = await fileToBase64(photoFile);
      const payload = {
        zone_id: zoneToId(zoneName),
        description: issueType + ': ' + descriptionText,
        status: 'Pending',
        image_data: imageData,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(function () {
        return {};
      });

      if (!response.ok) {
        throw new Error(body.message || 'Failed to report issue.');
      }

      showAlert('Issue reported successfully. Thank you for helping keep campus clean!', false);
      form.reset();
    } catch (error) {
      showAlert(error.message || 'Unexpected error while submitting issue.', true);
    }
  });
})();

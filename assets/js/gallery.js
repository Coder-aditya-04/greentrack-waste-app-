(function () {
  /* --- Module Setup --- */
  const storage = window.GreenTrackStorage;
  if (!storage) {
    return;
  }

  /* --- UI References --- */
  const taskList = document.getElementById('taskList');
  const galleryEmpty = document.getElementById('galleryEmpty');
  const detailZone = document.getElementById('detailZone');
  const detailGroup = document.getElementById('detailGroup');
  const detailDate = document.getElementById('detailDate');
  const detailBeforeImage = document.getElementById('detailBeforeImage');
  const detailAfterImage = document.getElementById('detailAfterImage');
  const taskDetailModalElement = document.getElementById('taskDetailModal');
  const taskDetailModal = taskDetailModalElement ? new window.bootstrap.Modal(taskDetailModalElement) : null;

  if (!taskList || !galleryEmpty) {
    return;
  }

  /* --- Zone Name Lookup --- */
  function zoneName(zoneId) {
    const zone = storage.zones.find(function (item) {
      return item.zone_id === zoneId;
    });
    return zone ? zone.name : zoneId;
  }

  /* --- Task Details Modal --- */
  function openTaskDetails(log) {
    if (!taskDetailModal) {
      return;
    }

    detailZone.textContent = zoneName(log.zone_id);
    detailGroup.textContent = log.group_name;
    detailDate.textContent = new Date(log.timestamp).toLocaleString();
    detailBeforeImage.src = log.before_image_data;
    detailAfterImage.src = log.after_image_data;
    taskDetailModal.show();
  }

  /* --- Completed Task List Rendering --- */
  function renderTaskList(logs) {
    taskList.innerHTML = '';

    logs.forEach(function (log, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'task-list-item';
      button.innerHTML =
        '<span class="task-index">#' + (index + 1) + '</span>' +
        '<span class="task-zone">' + zoneName(log.zone_id) + '</span>' +
        '<span class="task-group">' + log.group_name + '</span>' +
        '<span class="task-date">' + new Date(log.timestamp).toLocaleDateString() + '</span>' +
        '<span class="task-status">Completed</span>';

      button.addEventListener('click', function () {
        openTaskDetails(log);
      });

      taskList.appendChild(button);
    });
  }

  /* --- Page Bootstrap --- */
  async function renderGallery() {
    await storage.loadMeta();
    const logs = (await storage.getCleaningLogs())
      .slice()
      .sort(function (a, b) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      })
      .slice(0, 30);

    if (!logs.length) {
      galleryEmpty.classList.remove('d-none');
      taskList.classList.add('d-none');
      return;
    }

    galleryEmpty.classList.add('d-none');
    taskList.classList.remove('d-none');
    renderTaskList(logs);
  }

  renderGallery().catch(function () {
    taskList.innerHTML = '<div class="alert alert-danger mb-0">Unable to load completed tasks.</div>';
  });
})();

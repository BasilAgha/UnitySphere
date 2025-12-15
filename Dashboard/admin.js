// Admin Dashboard Script - Cleaned and enhanced for UX, feedback, and table/card views

// ===== CONFIG =====
const API_URL = 'https://script.google.com/macros/s/AKfycbxErCCEs6YOSy18SufoYe4ZSYSbh6yOvvu7pAvpygqtTUE2m1LPZ_z9xH1TjK3abDlS/exec'; // TODO: replace with deployed Apps Script URL

// ===== STATE =====
const VIEW_PREF_KEY = 'admin:view:';
const COMPACT_STORAGE_KEY = 'dashboard:compact';
const toastStackId = 'toastStack';
const sortState = {
  centers: { key: null, dir: 'asc' },
  specialists: { key: null, dir: 'asc' },
  children: { key: null, dir: 'asc' },
  modules: { key: null, dir: 'asc' }
};

// ===== GENERIC HELPER =====
async function apiCall(action, params = {}) {
  const fd = new FormData();
  fd.append('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) fd.append(key, value);
  });

  const res = await fetch(API_URL, { method: 'POST', body: fd });
  const data = await res.json();
  if (!data.success) {
    console.error('API error:', action, data.error);
  }
  return data;
}

// ===== UI HELPERS =====
function setButtonLoading(btn, isLoading, loadingLabel = 'Loading...') {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingLabel;
    btn.classList.add('btn-loading');
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}

function getToastStack() {
  let stack = document.getElementById(toastStackId);
  if (!stack) {
    stack = document.createElement('div');
    stack.id = toastStackId;
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type = 'success', title = 'Status') {
  const stack = getToastStack();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-title">${title}</div><div>${message}</div>`;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function setViewPref(section, view) {
  localStorage.setItem(VIEW_PREF_KEY + section, view);
}

function getViewPref(section) {
  return localStorage.getItem(VIEW_PREF_KEY + section) || 'card';
}

function formatDateSafe(value) {
  if (!value) return 'Not set';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function getInitials(name = '') {
  if (!name) return 'US';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function applyAvatarInitials(selector, name) {
  document.querySelectorAll(selector).forEach(el => {
    el.setAttribute('data-initials', getInitials(name));
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
// ===== COMPACT MODE =====
function applyCompactMode(isCompact) {
  const enable = Boolean(isCompact);
  document.body.classList.toggle('compact', enable);
  localStorage.setItem(COMPACT_STORAGE_KEY, enable ? '1' : '0');

  document.querySelectorAll('[data-compact-toggle]').forEach(btn => {
    btn.setAttribute('aria-pressed', enable ? 'true' : 'false');
    btn.classList.toggle('active', enable);
    const status = btn.querySelector('[data-compact-status]');
    if (status) status.textContent = enable ? 'On' : 'Off';
  });
}

function initCompactToggle() {
  const saved = localStorage.getItem(COMPACT_STORAGE_KEY) === '1';
  applyCompactMode(saved);

  document.querySelectorAll('[data-compact-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyCompactMode(!document.body.classList.contains('compact'));
    });
  });
}

// ===== VIEW SWITCHES =====
function initViewSwitches() {
  document.querySelectorAll('[data-view-switch]').forEach(switchEl => {
    const section = switchEl.getAttribute('data-view-switch');
    const saved = getViewPref(section);
    switchEl.querySelectorAll('button').forEach(btn => {
      const view = btn.getAttribute('data-view');
      btn.classList.toggle('active', view === saved);
      btn.addEventListener('click', () => {
        switchEl.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setViewPref(section, view);
        refreshSection(section);
      });
    });
  });
}

function refreshSection(section) {
  switch (section) {
    case 'dashboard': loadDashboard(); break;
    case 'centers': loadCenters(); break;
    case 'specialists': loadSpecialists(); break;
    case 'children': loadChildren(); break;
    case 'modules': loadModules(); break;
    case 'questions': loadQuestions(); break;
  }
}

// ===== NAVIGATION =====
function showSection(sectionName) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  const sectionEl = document.getElementById(`section-${sectionName}`);
  if (sectionEl) sectionEl.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === sectionName);
  });

  refreshSection(sectionName);
}

// ===== DASHBOARD =====
async function loadDashboard() {
  const data = await apiCall('getAdminStats');
  if (!data.success) return;
  const t = data.totals || {};
  setText('statCenters', t.centers ?? 0);
  setText('statSpecialists', t.specialists ?? 0);
  setText('statChildren', t.children ?? 0);
  setText('statModules', t.modules ?? 0);
  updateDonutChart(t);
}
// ===== CENTERS =====
async function loadCenters() {
  const view = getViewPref('centers');
  const grid = document.getElementById('centersGrid');
  const empty = document.getElementById('centersEmpty');
  const hint = document.getElementById('centersCountHint');
  const tableWrap = document.getElementById('centersTableWrap');
  grid.innerHTML = '';
  if (tableWrap) tableWrap.innerHTML = '';

  const data = await apiCall('listCenters');
  if (!data.success) return;

  const centers = data.centers || [];
  if (hint) hint.textContent = `${centers.length} center${centers.length !== 1 ? 's' : ''}`;

  const hasData = centers.length > 0;
  empty.style.display = hasData ? 'none' : 'block';
  grid.style.display = view === 'card' ? 'grid' : 'none';
  if (tableWrap) tableWrap.style.display = view === 'table' ? 'block' : 'none';
  if (!hasData) return;

  if (view === 'card') {
    centers.forEach(c => {
      const card = document.createElement('article');
      card.className = 'center-card';

      card.innerHTML = `
        ${c.photo ? `<div class="center-photo" style="background-image:url('${c.photo}')"></div>` : ''}
        <div class="card-body">
          <div class="title">${c.name || 'Center'}</div>
          <div class="place muted">ID: ${c.center_id}</div>
          <div class="desc">
            ${c.description || '<span class="muted">No description provided</span>'}
          </div>
        </div>
        <footer>
          <div class="center-footer">
            <div class="center-credentials">
              <span class="pill small">User: ${c.username}</span>
              <span class="pill small">Specs: ${c.num_specialists}</span>
              <span class="pill small">Children: ${c.num_children}</span>
            </div>
            <div class="card-actions">
              <button class="ghost small" data-edit-center="${c.center_id}">Edit</button>
              <button class="ghost small danger" data-delete-center="${c.center_id}">Delete</button>
            </div>
          </div>
        </footer>
      `;

      grid.appendChild(card);
    });
    grid.addEventListener('click', handleCenterCardClick, { once: true });
  } else if (tableWrap) {
    const sort = sortState.centers;
    const sorted = [...centers].sort((a, b) => {
      if (!sort.key) return 0;
      const av = a[sort.key] || '';
      const bv = b[sort.key] || '';
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    const table = document.createElement('table');
    table.className = 'management-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th data-sort="name">Center</th>
          <th data-sort="center_id">ID</th>
          <th data-sort="num_specialists">Specialists</th>
          <th data-sort="num_children">Children</th>
          <th data-sort="username">Username</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${sorted
          .map(
            c => `
              <tr>
                <td>${c.name || 'Center'}</td>
                <td class="meta-muted">${c.center_id || '—'}</td>
                <td>${c.num_specialists ?? 0}</td>
                <td>${c.num_children ?? 0}</td>
                <td class="meta-muted">${c.username || '—'}</td>
                <td class="table-actions">
                  <button class="ghost small" data-edit-center="${c.center_id}">Edit</button>
                  <button class="ghost small danger" data-delete-center="${c.center_id}">Delete</button>
                </td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    `;
    tableWrap.innerHTML = '';
    tableWrap.appendChild(table);
    table.addEventListener('click', handleCenterCardClick, { once: true });
    table.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort');
        const dir = sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
        sortState.centers = { key, dir };
        loadCenters();
      });
    });
  }
}

async function handleCenterCardClick(e) {
  const editBtn = e.target.closest('[data-edit-center]');
  const delBtn = e.target.closest('[data-delete-center]');

  if (editBtn) {
    const id = editBtn.getAttribute('data-edit-center');
    openCenterModalForEdit(id);
  } else if (delBtn) {
    const id = delBtn.getAttribute('data-delete-center');
    if (await confirmAction('Delete this center?')) {
      showToast('Removing center...', 'success', 'Working');
      apiCall('deleteCenter', {
        center_id: id,
        actor_username: getCurrentUserName(),
        actor_role: 'admin'
      }).then(() => {
        showToast('Center deleted');
        loadCenters();
        setTimeout(loadDashboard, 300);
      });
    }
  }
}

function openCenterModalForCreate() {
  document.getElementById('centerId').value = '';
  document.getElementById('centerModalTitle').textContent = 'Add Center';
  document.getElementById('centerNameInput').value = '';
  document.getElementById('centerUsernameInput').value = '';
  document.getElementById('centerPasswordInput').value = '';
  document.getElementById('centerDescInput').value = '';
  document.getElementById('centerPhotoInput').value = '';
  setCenterPhotoPreview('');
  openModal('centerModal');
}

async function openCenterModalForEdit(centerId) {
  showToast('Loading center...', 'success', 'Working');
  const data = await apiCall('listCenters');
  if (!data.success) return;
  const center = (data.centers || []).find(c => c.center_id == centerId);
  if (!center) return;

  document.getElementById('centerId').value = center.center_id;
  document.getElementById('centerModalTitle').textContent = 'Edit Center';
  document.getElementById('centerNameInput').value = center.name || '';
  document.getElementById('centerUsernameInput').value = center.username || '';
  document.getElementById('centerPasswordInput').value = center.password || '';
  document.getElementById('centerDescInput').value = center.description || '';
  const photo = center.photo || center.photo_url || center.photo_base64 || '';
  document.getElementById('centerPhotoInput').value = photo;
  setCenterPhotoPreview(photo);
  openModal('centerModal');
}

async function saveCenter() {
  const saveBtn = document.getElementById('centerSaveBtn');
  setButtonLoading(saveBtn, true, 'Saving...');
  const id = document.getElementById('centerId').value;
  const payload = {
    name: document.getElementById('centerNameInput').value,
    username: document.getElementById('centerUsernameInput').value,
    password: document.getElementById('centerPasswordInput').value,
    description: document.getElementById('centerDescInput').value,
    photo: document.getElementById('centerPhotoInput').value,
    actor_username: getCurrentUserName(),
    actor_role: 'admin'
  };

  try {
    let res;
    if (id) {
      res = await apiCall('updateCenter', { center_id: id, ...payload });
    } else {
      res = await apiCall('createCenter', payload);
    }

    if (res.success) {
      closeModal('centerModal');
      showToast('Center saved successfully');
      loadCenters();
      loadDashboard();
    } else {
      showToast(res.error || 'Error saving center', 'error', 'Save failed');
    }
  } finally {
    setButtonLoading(saveBtn, false);
  }
}
// ===== SPECIALISTS =====
async function loadSpecialists() {
  const view = getViewPref('specialists');
  const grid = document.getElementById('specialistsGrid');
  const empty = document.getElementById('specialistsEmpty');
  const tableWrap = document.getElementById('specialistsTableWrap');
  grid.innerHTML = '';
  if (tableWrap) tableWrap.innerHTML = '';

  const data = await apiCall('listSpecialists');
  if (!data.success) return;

  const specialists = data.specialists || [];
  const hasData = specialists.length > 0;
  empty.style.display = hasData ? 'none' : 'block';
  grid.style.display = view === 'card' ? 'grid' : 'none';
  if (tableWrap) tableWrap.style.display = view === 'table' ? 'block' : 'none';
  if (!hasData) return;

  if (view === 'card') {
    specialists.forEach(s => {
      const photo = s.photo || s.photo_url || s.photo_base64 || '';
      const avatarStyle = photo ? `style="background-image:url('${photo}')"` : '';
      const avatarClasses = `avatar avatar-static${photo ? ' has-photo' : ''}`;
      const initials = photo ? '' : `data-initials="${getInitials(s.name || s.username)}"`;

      const card = document.createElement('article');
      card.className = 'specialist-card';
      card.innerHTML = `
        <div class="${avatarClasses}" ${avatarStyle} ${initials}></div>
        <strong>${s.name || s.username || 'Specialist'}</strong>
        <p>${s.description || '<span class="muted">No description</span>'}</p>
        <div class="specialist-credentials">
          <span class="chip subtle">${s.type === 'freelance' ? 'Freelance' : 'Center-linked'}</span>
          ${s.center_id ? `<span class="chip subtle">Center: ${s.center_id}</span>` : ''}
          <span class="chip subtle">Children: ${s.num_children ?? 0}</span>
          <span class="chip subtle">User: ${s.username}</span>
        </div>
        <div class="card-actions">
          <button class="ghost small" data-edit-spec="${s.specialist_id}">Edit</button>
          <button class="ghost small danger" data-delete-spec="${s.specialist_id}">Delete</button>
        </div>
      `;
      grid.appendChild(card);
    });
    grid.addEventListener('click', handleSpecialistCardClick, { once: true });
  } else if (tableWrap) {
    const sort = sortState.specialists;
    const sorted = [...specialists].sort((a, b) => {
      if (!sort.key) return 0;
      const av = a[sort.key] || '';
      const bv = b[sort.key] || '';
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    const table = document.createElement('table');
    table.className = 'management-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th data-sort="name">Specialist</th>
          <th data-sort="specialist_id">ID</th>
          <th data-sort="center_id">Center</th>
          <th data-sort="num_children">Children</th>
          <th data-sort="username">Username</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${sorted
          .map(
            s => `
              <tr>
                <td>${s.name || s.username || 'Specialist'}</td>
                <td class="meta-muted">${s.specialist_id || '—'}</td>
                <td class="meta-muted">${s.center_id || '—'}</td>
                <td>${s.num_children ?? 0}</td>
                <td class="meta-muted">${s.username || '—'}</td>
                <td class="table-actions">
                  <button class="ghost small" data-edit-spec="${s.specialist_id}">Edit</button>
                  <button class="ghost small danger" data-delete-spec="${s.specialist_id}">Delete</button>
                </td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    `;
    tableWrap.innerHTML = '';
    tableWrap.appendChild(table);
    table.addEventListener('click', handleSpecialistCardClick, { once: true });
    table.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort');
        const dir = sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
        sortState.specialists = { key, dir };
        loadSpecialists();
      });
    });
  }
}

async function handleSpecialistCardClick(e) {
  const editBtn = e.target.closest('[data-edit-spec]');
  const delBtn = e.target.closest('[data-delete-spec]');

  if (editBtn) {
    const id = editBtn.getAttribute('data-edit-spec');
    openSpecialistModalForEdit(id);
  } else if (delBtn) {
    const id = delBtn.getAttribute('data-delete-spec');
    if (await confirmAction('Delete this specialist?')) {
      showToast('Removing specialist...', 'success', 'Working');
      apiCall('deleteSpecialist', {
        specialist_id: id,
        actor_username: getCurrentUserName(),
        actor_role: 'admin'
      }).then(() => {
        showToast('Specialist deleted');
        loadSpecialists();
        setTimeout(loadDashboard, 300);
      });
    }
  }
}

function openSpecialistModalForCreate() {
  document.getElementById('specId').value = '';
  document.getElementById('specialistModalTitle').textContent = 'Add Specialist';
  document.getElementById('specNameInput').value = '';
  document.getElementById('specUsernameInput').value = '';
  document.getElementById('specPasswordInput').value = '';
  document.getElementById('specTypeInput').value = 'freelance';
  document.getElementById('specCenterIdInput').value = '';
  document.getElementById('specDescInput').value = '';
  document.getElementById('specPhotoInput').value = '';
  setSpecPhotoPreview('');
  openModal('specialistModal');
}

async function openSpecialistModalForEdit(specId) {
  showToast('Loading specialist...', 'success', 'Working');
  const data = await apiCall('listSpecialists');
  if (!data.success) return;
  const spec = (data.specialists || []).find(s => s.specialist_id == specId);
  if (!spec) return;

  document.getElementById('specId').value = spec.specialist_id;
  document.getElementById('specialistModalTitle').textContent = 'Edit Specialist';
  document.getElementById('specNameInput').value = spec.name || '';
  document.getElementById('specUsernameInput').value = spec.username || '';
  document.getElementById('specPasswordInput').value = spec.password || '';
  document.getElementById('specTypeInput').value = spec.type || 'freelance';
  document.getElementById('specCenterIdInput').value = spec.center_id || '';
  document.getElementById('specDescInput').value = spec.description || '';
  const photo = spec.photo || spec.photo_url || spec.photo_base64 || '';
  document.getElementById('specPhotoInput').value = photo;
  setSpecPhotoPreview(photo);
  openModal('specialistModal');
}

async function saveSpecialist() {
  const saveBtn = document.getElementById('specialistSaveBtn');
  setButtonLoading(saveBtn, true, 'Saving...');
  const id = document.getElementById('specId').value;
  const payload = {
    name: document.getElementById('specNameInput').value,
    username: document.getElementById('specUsernameInput').value,
    password: document.getElementById('specPasswordInput').value,
    type: document.getElementById('specTypeInput').value,
    center_id: document.getElementById('specCenterIdInput').value,
    description: document.getElementById('specDescInput').value,
    photo: document.getElementById('specPhotoInput').value,
    actor_username: getCurrentUserName(),
    actor_role: 'admin'
  };

  try {
    let res;
    if (id) {
      res = await apiCall('updateSpecialist', { specialist_id: id, ...payload });
    } else {
      res = await apiCall('createSpecialist', payload);
    }

    if (res.success) {
      closeModal('specialistModal');
      showToast('Specialist saved');
      loadSpecialists();
      loadDashboard();
    } else {
      showToast(res.error || 'Error saving specialist', 'error', 'Save failed');
    }
  } finally {
    setButtonLoading(saveBtn, false);
  }
}
// ===== CHILDREN =====
async function loadChildren() {
  const view = getViewPref('children');
  const grid = document.getElementById('childrenGrid');
  const empty = document.getElementById('childrenEmpty');
  const tableWrap = document.getElementById('childrenTableWrap');
  grid.innerHTML = '';
  if (tableWrap) tableWrap.innerHTML = '';

  const data = await apiCall('listChildren');
  if (!data.success) return;
  const children = data.children || [];

  const hasData = children.length > 0;
  empty.style.display = hasData ? 'none' : 'block';
  grid.style.display = view === 'card' ? 'grid' : 'none';
  if (tableWrap) tableWrap.style.display = view === 'table' ? 'block' : 'none';
  if (!hasData) return;

  if (view === 'card') {
    children.forEach(ch => {
      const card = document.createElement('article');
      card.className = 'module-card';

      card.innerHTML = `
        <header>
          <div>
            <strong>${ch.name || 'Child'}</strong>
            <div class="hint">ID: ${ch.child_id}</div>
          </div>
          <span class="chip subtle">${ch.age ? ch.age + ' yrs' : 'Age N/A'}</span>
        </header>
        <div class="module-meta">
          <span>Center: ${ch.center_id || '—'}</span>
          <span>Specialist: ${ch.specialist_id || '—'}</span>
          <span>Sessions: ${ch.num_sessions || 0}</span>
        </div>
        <div class="hint">
          Latest assessment: ${formatDateSafe(ch.latest_assessment_date)}
        </div>
        <div class="card-actions">
          <button class="ghost small" data-view-child="${ch.child_id}">View profile</button>
        </div>
      `;

      grid.appendChild(card);
    });
    grid.addEventListener('click', handleChildCardClick, { once: true });
  } else if (tableWrap) {
    const sort = sortState.children;
    const sorted = [...children].sort((a, b) => {
      if (!sort.key) return 0;
      const av = a[sort.key] || '';
      const bv = b[sort.key] || '';
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    const table = document.createElement('table');
    table.className = 'management-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th data-sort="name">Child</th>
          <th data-sort="child_id">ID</th>
          <th data-sort="center_id">Center</th>
          <th data-sort="specialist_id">Specialist</th>
          <th data-sort="num_sessions">Sessions</th>
          <th data-sort="age">Age</th>
        </tr>
      </thead>
      <tbody>
        ${sorted
          .map(
            ch => `
              <tr>
                <td>${ch.name || 'Child'}</td>
                <td class="meta-muted">${ch.child_id || '—'}</td>
                <td class="meta-muted">${ch.center_id || '—'}</td>
                <td class="meta-muted">${ch.specialist_id || '—'}</td>
                <td>${ch.num_sessions ?? 0}</td>
                <td>${ch.age ?? '—'}</td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    `;
    tableWrap.innerHTML = '';
    tableWrap.appendChild(table);
    table.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort');
        const dir = sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
        sortState.children = { key, dir };
        loadChildren();
      });
    });
  }
}

async function handleChildCardClick(e) {
  const btn = e.target.closest('[data-view-child]');
  if (!btn) return;
  const childId = btn.getAttribute('data-view-child');
  showToast(`Child profile view (ID: ${childId}) coming soon`, 'success', 'Info');
}

// ===== MODULES =====
async function loadModules() {
  const view = getViewPref('modules');
  const grid = document.getElementById('modulesGrid');
  const empty = document.getElementById('modulesEmpty');
  const tableWrap = document.getElementById('modulesTableWrap');
  grid.innerHTML = '';
  if (tableWrap) tableWrap.innerHTML = '';

  const data = await apiCall('listModules');
  if (!data.success) return;

  const modules = data.modules || [];
  const hasData = modules.length > 0;
  empty.style.display = hasData ? 'none' : 'block';
  grid.style.display = view === 'card' ? 'grid' : 'none';
  if (tableWrap) tableWrap.style.display = view === 'table' ? 'block' : 'none';
  if (!hasData) return;

  if (view === 'card') {
    modules.forEach(m => {
      const card = document.createElement('article');
      card.className = 'module-card';

      card.innerHTML = `
        <header>
          <div>
            <strong>${m.name || 'VR Module'}</strong>
            <div class="hint">ID: ${m.module_id}</div>
          </div>
          <span class="chip subtle">${m.minutes_to_play || 0} min</span>
        </header>
        <div class="module-meta">
          <span>Centers: ${m.num_centers_assigned || 0}</span>
          <span>Status: ${m.status || 'active'}</span>
        </div>
        <div class="hint">
          ${m.description || '<span class="muted">No description.</span>'}
        </div>
        <div class="card-actions">
          <button class="ghost small" data-edit-module="${m.module_id}">Edit</button>
          <button class="ghost small danger" data-delete-module="${m.module_id}">Delete</button>
        </div>
      `;
      grid.appendChild(card);
    });
    grid.addEventListener('click', handleModuleCardClick, { once: true });
  } else if (tableWrap) {
    const sort = sortState.modules;
    const sorted = [...modules].sort((a, b) => {
      if (!sort.key) return 0;
      const av = a[sort.key] || '';
      const bv = b[sort.key] || '';
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    const table = document.createElement('table');
    table.className = 'management-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th data-sort="name">VR Module</th>
          <th data-sort="module_id">ID</th>
          <th data-sort="minutes_to_play">Minutes</th>
          <th data-sort="num_centers_assigned">Centers</th>
          <th data-sort="status">Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${sorted
          .map(
            m => `
              <tr>
                <td>${m.name || 'VR Module'}</td>
                <td class="meta-muted">${m.module_id || '—'}</td>
                <td>${m.minutes_to_play ?? 0}</td>
                <td>${m.num_centers_assigned ?? 0}</td>
                <td class="meta-muted">${m.status || 'active'}</td>
                <td class="table-actions">
                  <button class="ghost small" data-edit-module="${m.module_id}">Edit</button>
                  <button class="ghost small danger" data-delete-module="${m.module_id}">Delete</button>
                </td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    `;
    tableWrap.innerHTML = '';
    tableWrap.appendChild(table);
    table.addEventListener('click', handleModuleCardClick, { once: true });
    table.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort');
        const dir = sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
        sortState.modules = { key, dir };
        loadModules();
      });
    });
  }
}

async function handleModuleCardClick(e) {
  const editBtn = e.target.closest('[data-edit-module]');
  const delBtn = e.target.closest('[data-delete-module]');

  if (editBtn) {
    const id = editBtn.getAttribute('data-edit-module');
    openModuleModalForEdit(id);
  } else if (delBtn) {
    const id = delBtn.getAttribute('data-delete-module');
    if (await confirmAction('Delete this module?')) {
      showToast('Removing module...', 'success', 'Working');
      apiCall('deleteModule', {
        module_id: id,
        actor_username: getCurrentUserName(),
        actor_role: 'admin'
      }).then(() => {
        showToast('Module deleted');
        loadModules();
        setTimeout(loadDashboard, 300);
      });
    }
  }
}

function openModuleModalForCreate() {
  document.getElementById('moduleId').value = '';
  document.getElementById('moduleModalTitle').textContent = 'Add VR Module';
  document.getElementById('modNameInput').value = '';
  document.getElementById('modulePhotoInput').value = '';
  document.getElementById('modulePhotoFile').value = '';
  setModulePhotoPreview('');
  document.getElementById('modMinutesInput').value = '';
  document.getElementById('modDescInput').value = '';
  openModal('moduleModal');
}

async function openModuleModalForEdit(moduleId) {
  showToast('Loading module...', 'success', 'Working');
  const data = await apiCall('listModules');
  if (!data.success) return;
  const m = (data.modules || []).find(x => x.module_id == moduleId);
  if (!m) return;

  document.getElementById('moduleId').value = m.module_id;
  document.getElementById('moduleModalTitle').textContent = 'Edit VR Module';
  document.getElementById('modNameInput').value = m.name || '';
  document.getElementById('modulePhotoInput').value = m.photo_url || '';
  document.getElementById('modulePhotoFile').value = '';
  setModulePhotoPreview(m.photo_url || '');
  document.getElementById('modMinutesInput').value = m.minutes_to_play || '';
  document.getElementById('modDescInput').value = m.description || '';
  openModal('moduleModal');
}

async function saveModule() {
  const saveBtn = document.getElementById('moduleSaveBtn');
  setButtonLoading(saveBtn, true, 'Saving...');
  const id = document.getElementById('moduleId').value;
  const payload = {
    name: document.getElementById('modNameInput').value,
    photo_url: document.getElementById('modulePhotoInput').value,
    minutes_to_play: document.getElementById('modMinutesInput').value,
    description: document.getElementById('modDescInput').value,
    actor_username: getCurrentUserName(),
    actor_role: 'admin'
  };

  try {
    let res;
    if (id) {
      res = await apiCall('updateModule', { module_id: id, ...payload });
    } else {
      res = await apiCall('createModule', payload);
    }

    if (res.success) {
      closeModal('moduleModal');
      showToast('Module saved');
      loadModules();
      loadDashboard();
    } else {
      showToast(res.error || 'Error saving module', 'error', 'Save failed');
    }
  } finally {
    setButtonLoading(saveBtn, false);
  }
}
// ===== QUESTIONS =====
async function loadQuestions() {
  const list = document.getElementById('questionsList');
  const empty = document.getElementById('questionsEmpty');
  list.innerHTML = '';

  const data = await apiCall('listQuestions');
  if (!data.success) return;
  const qs = data.questions || [];

  if (!qs.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  qs.forEach(q => {
    const item = document.createElement('div');
    item.className = 'recommendation';
    item.innerHTML = `
      <div class="recommendation-icon">Q</div>
      <div class="recommendation-body">
        <strong>${q.question_text}</strong>
        <div class="hint">
          Category: ${q.category || 'General'} | Difficulty: ${q.difficulty || 'N/A'} | ID: ${q.question_id}
        </div>
        <div style="margin-top:0.3rem;">
          <button class="ghost small" data-edit-question="${q.question_id}">Edit</button>
          <button class="ghost small danger" data-delete-question="${q.question_id}">Delete</button>
        </div>
      </div>
    `;
    list.appendChild(item);
  });

  list.addEventListener('click', handleQuestionListClick, { once: true });
}

async function handleQuestionListClick(e) {
  const editBtn = e.target.closest('[data-edit-question]');
  const delBtn = e.target.closest('[data-delete-question]');

  if (editBtn) {
    const id = editBtn.getAttribute('data-edit-question');
    openQuestionModalForEdit(id);
  } else if (delBtn) {
    const id = delBtn.getAttribute('data-delete-question');
    if (await confirmAction('Delete this question?')) {
      showToast('Removing question...', 'success', 'Working');
      apiCall('deleteQuestion', {
        question_id: id,
        actor_username: getCurrentUserName(),
        actor_role: 'admin'
      }).then(() => {
        showToast('Question deleted');
        loadQuestions();
      });
    }
  }
}

function openQuestionModalForCreate() {
  document.getElementById('questionId').value = '';
  document.getElementById('questionModalTitle').textContent = 'Add Question';
  document.getElementById('qTextInput').value = '';
  document.getElementById('qCategoryInput').value = '';
  document.getElementById('qDifficultyInput').value = '';
  openModal('questionModal');
}

async function openQuestionModalForEdit(questionId) {
  showToast('Loading question...', 'success', 'Working');
  const data = await apiCall('listQuestions');
  if (!data.success) return;
  const q = (data.questions || []).find(x => x.question_id == questionId);
  if (!q) return;

  document.getElementById('questionId').value = q.question_id;
  document.getElementById('questionModalTitle').textContent = 'Edit Question';
  document.getElementById('qTextInput').value = q.question_text || '';
  document.getElementById('qCategoryInput').value = q.category || '';
  document.getElementById('qDifficultyInput').value = q.difficulty || '';
  openModal('questionModal');
}

async function saveQuestion() {
  const saveBtn = document.getElementById('questionSaveBtn');
  setButtonLoading(saveBtn, true, 'Saving...');
  const id = document.getElementById('questionId').value;
  const payload = {
    question_text: document.getElementById('qTextInput').value,
    category: document.getElementById('qCategoryInput').value,
    difficulty: document.getElementById('qDifficultyInput').value,
    actor_username: getCurrentUserName(),
    actor_role: 'admin'
  };

  try {
    let res;
    if (id) {
      res = await apiCall('updateQuestion', { question_id: id, ...payload });
    } else {
      res = await apiCall('createQuestion', payload);
    }

    if (res.success) {
      closeModal('questionModal');
      showToast('Question saved');
      loadQuestions();
    } else {
      showToast(res.error || 'Error saving question', 'error', 'Save failed');
    }
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

// ===== MODAL HELPERS =====
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function initModalCloseButtons() {
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-close-modal');
      closeModal(id);
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) backdrop.classList.remove('active');
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(backdrop => backdrop.classList.remove('active'));
    }
  });
}

// ===== SESSION / USER =====
function getCurrentUserData() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

function getCurrentUserName() {
  const user = getCurrentUserData();
  return user.name || user.full_name || user.fullName || user.displayName || user.username || 'Admin';
}

function getCurrentUserRole() {
  const user = getCurrentUserData();
  const fromStorage = localStorage.getItem('role');
  return user.role || fromStorage || 'admin';
}

function initUserChip() {
  const name = getCurrentUserName();
  const el = document.getElementById('currentUserName');
  if (el) el.textContent = name || 'Admin';
  applyAvatarInitials('.sidebar .avatar', name);

  const roleEl = document.getElementById('currentUserRole');
  const role = getCurrentUserRole();
  if (roleEl) roleEl.textContent = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Admin';
}

function initDynamicLabels() {
  const name = getCurrentUserName();
  const roleLabel = getCurrentUserRole();
  const rolePretty = roleLabel ? roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1) : 'Admin';

  setText('welcomeName', name);
  setText('brandName', 'UnitySphere');
  const avatar = document.querySelector('.sidebar .avatar');
  const photo = getCurrentUserData().photo || getCurrentUserData().photo_url || '';
  if (avatar) {
    if (photo) {
      avatar.style.backgroundImage = `url('${photo}')`;
      avatar.classList.add('has-photo');
      avatar.removeAttribute('data-initials');
    } else {
      avatar.style.backgroundImage = '';
      avatar.classList.remove('has-photo');
      avatar.setAttribute('data-initials', getInitials(name));
    }
  }

  const brandRole = document.getElementById('brandRole');
  if (brandRole) {
    brandRole.textContent = `${rolePretty} workspace`;
  }
}
function openAccountSettings() {
  const user = getCurrentUserData();
  document.getElementById('accountNameInput').value = user.name || user.full_name || user.fullName || user.displayName || user.username || '';
  const photo = user.photo || user.photo_url || '';
  document.getElementById('accountPhotoInput').value = photo;
  setAccountPhotoPreview(photo);
  openModal('accountModal');
}

function saveAccountSettings() {
  const name = document.getElementById('accountNameInput').value;
  const photo = document.getElementById('accountPhotoInput').value;
  const user = { ...getCurrentUserData(), name, photo };
  localStorage.setItem('user', JSON.stringify(user));
  initUserChip();
  initDynamicLabels();
  closeModal('accountModal');
}

function handleSpecPhotoChange(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    document.getElementById('specPhotoInput').value = dataUrl;
    setSpecPhotoPreview(dataUrl);
  };
  reader.readAsDataURL(file);
}

function setSpecPhotoPreview(src) {
  const preview = document.getElementById('specPhotoPreview');
  if (!preview) return;
  if (src) {
    preview.style.backgroundImage = `url('${src}')`;
    preview.classList.add('has-photo');
  } else {
    preview.style.backgroundImage = '';
    preview.classList.remove('has-photo');
  }
}

function handleCenterPhotoChange(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    document.getElementById('centerPhotoInput').value = dataUrl;
    setCenterPhotoPreview(dataUrl);
  };
  reader.readAsDataURL(file);
}

function setCenterPhotoPreview(src) {
  const preview = document.getElementById('centerPhotoPreview');
  if (!preview) return;
  if (src) {
    preview.style.backgroundImage = `url('${src}')`;
    preview.classList.add('has-photo');
  } else {
    preview.style.backgroundImage = '';
    preview.classList.remove('has-photo');
  }
}

function handleModulePhotoChange(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    document.getElementById('modulePhotoInput').value = dataUrl;
    setModulePhotoPreview(dataUrl);
  };
  reader.readAsDataURL(file);
}

function setModulePhotoPreview(src) {
  const preview = document.getElementById('modulePhotoPreview');
  if (!preview) return;
  if (src) {
    preview.style.backgroundImage = `url('${src}')`;
    preview.classList.add('has-photo');
  } else {
    preview.style.backgroundImage = '';
    preview.classList.remove('has-photo');
  }
}

function handleAccountPhotoChange(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    document.getElementById('accountPhotoInput').value = dataUrl;
    setAccountPhotoPreview(dataUrl);
  };
  reader.readAsDataURL(file);
}

function setAccountPhotoPreview(src) {
  const preview = document.getElementById('accountPhotoPreview');
  if (!preview) return;
  if (src) {
    preview.style.backgroundImage = `url('${src}')`;
    preview.classList.add('has-photo');
  } else {
    preview.style.backgroundImage = '';
    preview.classList.remove('has-photo');
  }
}

// Branded confirmation modal
function confirmAction(message = 'Are you sure?') {
  return new Promise(resolve => {
    const modal = document.getElementById('confirmModal');
    const msgEl = document.getElementById('confirmMessage');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    if (!modal || !msgEl || !okBtn || !cancelBtn) return resolve(false);

    msgEl.textContent = message;
    modal.classList.add('active');

    const cleanup = () => {
      modal.classList.remove('active');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
    };

    const onOk = () => {
      cleanup();
      resolve(true);
    };
    const onCancel = () => {
      cleanup();
      resolve(false);
    };
    const onBackdrop = e => {
      if (e.target === modal) onCancel();
    };

    okBtn.addEventListener('click', onOk, { once: true });
    cancelBtn.addEventListener('click', onCancel, { once: true });
    modal.addEventListener('click', onBackdrop);
  });
}

// Quick Breakdown donut chart
function updateDonutChart(totals = {}) {
  const donut = document.getElementById('donutChart');
  if (!donut) return;

  const centers = Number(totals.centers || 0);
  const specialists = Number(totals.specialists || 0);
  const children = Number(totals.children || 0);
  const modules = Number(totals.modules || 0);

  setText('legendCenters', centers);
  setText('legendSpecialists', specialists);
  setText('legendChildren', children);
  setText('legendModules', modules);

  const slices = [
    { value: centers, color: '#6366f1' },
    { value: specialists, color: '#22c55e' },
    { value: children, color: '#fbbf24' },
    { value: modules, color: '#0ea5e9' }
  ];

  const total = slices.reduce((sum, s) => sum + (isFinite(s.value) ? s.value : 0), 0);
  let acc = 0;
  const gradient = slices
    .map(slice => {
      const pct = total > 0 ? (slice.value / total) * 100 : 25;
      const start = acc;
      const end = acc + pct;
      acc = end;
      return `${slice.color} ${start}% ${end}%`;
    })
    .join(', ');

  donut.style.background = `conic-gradient(${gradient})`;
}

function initAuthGuard() {
  const role = localStorage.getItem('role');
  if (role !== 'admin') {
    window.location.href = 'login.html';
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initAuthGuard();
  initUserChip();
  initDynamicLabels();
  initModalCloseButtons();
  initCompactToggle();
  initViewSwitches();
  document.getElementById('specPhotoFile')?.addEventListener('change', handleSpecPhotoChange);
  document.getElementById('centerPhotoFile')?.addEventListener('change', handleCenterPhotoChange);
  document.getElementById('modulePhotoFile')?.addEventListener('change', handleModulePhotoChange);
  document.getElementById('accountPhotoFile')?.addEventListener('change', handleAccountPhotoChange);
  document.getElementById('accountSettingsBtn')?.addEventListener('click', openAccountSettings);
  document.getElementById('accountSaveBtn')?.addEventListener('click', saveAccountSettings);

  // nav
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => {
      showSection(btn.dataset.section);
    });
  });

  document.getElementById('refreshAllBtn')?.addEventListener('click', () => {
    const active = document.querySelector('.section.active');
    if (active) {
      const id = active.id.replace('section-', '');
      showSection(id);
      showToast('Section refreshed', 'success', 'Refreshed');
    } else {
      loadDashboard();
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  });

  // empty-state CTAs
  document.getElementById('centersEmptyAdd')?.addEventListener('click', openCenterModalForCreate);
  document.getElementById('specialistsEmptyAdd')?.addEventListener('click', openSpecialistModalForCreate);
  document.getElementById('childrenEmptyAddCenter')?.addEventListener('click', openCenterModalForCreate);
  document.getElementById('childrenEmptyAddSpecialist')?.addEventListener('click', openSpecialistModalForCreate);
  document.getElementById('modulesEmptyAdd')?.addEventListener('click', openModuleModalForCreate);
  document.getElementById('questionsEmptyAdd')?.addEventListener('click', openQuestionModalForCreate);

  // center buttons
  document.getElementById('btnAddCenter')?.addEventListener('click', openCenterModalForCreate);
  document.getElementById('centerSaveBtn')?.addEventListener('click', saveCenter);

  // specialist buttons
  document.getElementById('btnAddSpecialist')?.addEventListener('click', openSpecialistModalForCreate);
  document.getElementById('specialistSaveBtn')?.addEventListener('click', saveSpecialist);

  // module buttons
  document.getElementById('btnAddModule')?.addEventListener('click', openModuleModalForCreate);
  document.getElementById('moduleSaveBtn')?.addEventListener('click', saveModule);

  // question buttons
  document.getElementById('btnAddQuestion')?.addEventListener('click', openQuestionModalForCreate);
  document.getElementById('questionSaveBtn')?.addEventListener('click', saveQuestion);

  // initial load
  loadDashboard();
});

















// Admin Dashboard Script - Cleaned and enhanced for UX, feedback, and table/card views

// ===== CONFIG =====
const API_URL = 'https://script.google.com/macros/s/AKfycbxErCCEs6YOSy18SufoYe4ZSYSbh6yOvvu7pAvpygqtTUE2m1LPZ_z9xH1TjK3abDlS/exec'; // TODO: replace with deployed Apps Script URL

// ===== STATE =====
const toastStackId = 'toastStack';
let questionsCache = [];
const questionFilters = {
  category: '',
  difficulty: '',
  status: ''
};
const sortState = {
  centers: { key: null, dir: 'asc' },
  specialists: { key: null, dir: 'asc' },
  children: { key: null, dir: 'asc' },
  modules: { key: null, dir: 'asc' }
};
let lastUpdatedAt = null;
const SECTION_TITLES = {
  dashboard: 'Dashboard',
  centers: 'Centers',
  specialists: 'Specialists',
  'vr-modules': 'VR Modules',
  assessment: 'Assessment',
  settings: 'Settings'
};
let shellSidebar = null;
let shellHeader = null;
let charts = {};
let centersMap = null;
let centersMapMarkers = [];
let lastSearchQuery = '';
let assessmentCharts = {};
let assessmentChildrenCache = [];

function markDataUpdated() {
  lastUpdatedAt = new Date();
  updateLastUpdatedLabel();
}

function formatTimeAgo(date) {
  if (!date) return 'Last updated --';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes <= 0) return 'Last updated just now';
  if (minutes === 1) return 'Last updated 1 minute ago';
  if (minutes < 60) return `Last updated ${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'Last updated 1 hour ago';
  return `Last updated ${hours} hours ago`;
}

function updateLastUpdatedLabel() {
  const el = document.getElementById('lastUpdated');
  if (!el) return;
  el.textContent = formatTimeAgo(lastUpdatedAt);
  if (lastUpdatedAt) {
    el.title = `Last updated: ${lastUpdatedAt.toLocaleString()}`;
  }
}

function renderSortIndicator(sort, key) {
  if (sort.key === key) {
    return `<span class="sort-indicator active">${sort.dir === 'asc' ? '▲' : '▼'}</span>`;
  }
  return '<span class="sort-indicator">▲▼</span>';
}

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

function apiRequest(action, params = {}) {
  return apiCall(action, {
    ...params,
    actor_username: getCurrentUserName(),
    actor_role: 'admin'
  });
}

// ===== UI HELPERS =====
function setButtonLoading(btn, isLoading, loadingLabel = 'Loading...') {
  if (!btn) return;
  const isIconButton = btn.classList.contains('icon-action');
  if (isLoading) {
    if (isIconButton) {
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
    } else {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = loadingLabel;
      btn.classList.add('btn-loading');
    }
    btn.disabled = true;
  } else {
    if (isIconButton) {
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
    } else {
      btn.textContent = btn.dataset.originalText || btn.textContent;
      btn.classList.remove('btn-loading');
    }
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

function formatDateSafe(value) {
  if (!value) return 'Not set';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function getSelectedChildrenIds() {
  return Array.from(document.querySelectorAll('.child-select:checked'))
    .map(cb => cb.dataset.childId)
    .filter(Boolean);
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

function getSpecialtyLabel(spec) {
  return spec.specialty || spec.type || 'Therapist';
}

function getLanguagePills(spec) {
  const lang = spec.language || spec.languages || '';
  const list = Array.isArray(lang) ? lang : String(lang).split(/[,\s/]+/).filter(Boolean);
  if (!list.length) return ['EN'];
  return Array.from(new Set(list.map(code => code.toUpperCase()))).slice(0, 3);
}

function getModuleDomains(module) {
  const domains = module.domains || module.skills || module.tags || '';
  const list = Array.isArray(domains) ? domains : String(domains).split(/[,\s/]+/).filter(Boolean);
  if (!list.length) return ['Cognitive'];
  return Array.from(new Set(list.map(item => item.trim()))).slice(0, 3);
}

function formatModuleStars(level) {
  const value = Number(level || 0);
  const clamped = Math.max(1, Math.min(5, Math.round(value)));
  return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
}

function initShell() {
  const sidebarHost = document.getElementById('appSidebar');
  const headerHost = document.getElementById('appHeader');
  if (!sidebarHost || !headerHost || !window.UnitySphereShell) return;

  const active = 'dashboard';
  shellSidebar = window.UnitySphereShell.buildSidebar({ role: 'admin', active });
  shellHeader = window.UnitySphereShell.buildHeader({ title: "" });

  sidebarHost.replaceWith(shellSidebar);
  headerHost.replaceWith(shellHeader);

  const lastUpdated = document.createElement('div');
  lastUpdated.id = 'lastUpdated';
  lastUpdated.className = 'last-updated';
  lastUpdated.textContent = 'Last updated --';
  shellHeader.querySelector('.header-actions')?.prepend(lastUpdated);

  shellSidebar.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-nav]');
    if (!nav) return;
    showSection(nav.dataset.nav);
  });

  window.UnitySphereShell.wireEscManager();
}

function initSettingsControls() {
  const themeBtn = document.getElementById('themeToggleBtn');
  const langBtn = document.getElementById('languageToggleBtn');
  const storedLang = localStorage.getItem('unitysphere:language') || 'en';

  applyThemePreference('dark');
  applyLanguagePreference(storedLang);
  updateProfileSummary();

  if (themeBtn) {
    themeBtn.textContent = 'Theme: Dark';
    themeBtn.disabled = true;
    themeBtn.title = 'Theme is locked to dark mode';
  }

  langBtn?.addEventListener('click', () => {
    const next = document.documentElement.lang === 'ar' ? 'en' : 'ar';
    applyLanguagePreference(next);
    localStorage.setItem('unitysphere:language', next);
  });
}

function applyThemePreference(theme) {
  const themeBtn = document.getElementById('themeToggleBtn');
  const value = 'dark';
  if (window.UnitySphereShell?.applyTheme) {
    window.UnitySphereShell.applyTheme(value);
  } else {
    document.body.dataset.theme = value;
    localStorage.setItem('unitysphere:theme', value);
  }
  if (themeBtn) themeBtn.textContent = 'Theme: Dark';
}

function applyLanguagePreference(lang) {
  const langBtn = document.getElementById('languageToggleBtn');
  const value = lang === 'ar' ? 'ar' : 'en';
  document.documentElement.lang = value;
  if (langBtn) langBtn.textContent = `Language: ${value.toUpperCase()}`;
}

function updateProfileSummary() {
  const user = getCurrentUserData();
  const name = user.name || user.full_name || user.fullName || user.displayName || user.username || 'Admin';
  const role = getCurrentUserRole();
  const center = user.center_name || user.center_id || '--';
  const avatar = document.getElementById('settingsAvatar');
  if (avatar) {
    const photo = user.photo || user.photo_url || '';
    avatar.classList.toggle('has-photo', Boolean(photo));
    avatar.style.backgroundImage = photo ? `url('${photo}')` : '';
    avatar.setAttribute('data-initials', getInitials(name));
  }
  setText('settingsProfileName', name);
  setText('settingsProfileRole', `Role: ${role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Admin'}`);
  setText('settingsProfileCenter', `Center: ${center}`);
}

function applyGlobalSearch(query) {
  lastSearchQuery = String(query || '').trim().toLowerCase();
  const section = document.querySelector('.section.active');
  if (!section) return;

  const cards = section.querySelectorAll(
    '.card, .stat-card, .center-card, .specialist-card, .module-card, .assessment-card'
  );

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    const match = !lastSearchQuery || text.includes(lastSearchQuery);
    card.classList.toggle('search-hidden', !match);
  });
}

// ===== VIEW SWITCHES =====
function refreshSection(section) {
  switch (section) {
    case 'dashboard': loadDashboard(); break;
    case 'centers': loadCenters(); break;
    case 'specialists': loadSpecialists(); break;
    case 'vr-modules': loadModules(); break;
    case 'assessment': loadAssessmentSection(); break;
    case 'settings': break;
  }
}

// ===== NAVIGATION =====
function showSection(sectionName) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  const sectionEl = document.getElementById(`section-${sectionName}`);
  if (sectionEl) sectionEl.classList.add('active');
  if (shellSidebar && window.UnitySphereShell) {
    window.UnitySphereShell.setActiveNavItem(shellSidebar, sectionName);
  }
  if (shellHeader) {
    const title = shellHeader.querySelector('.title');
    if (title) title.textContent = SECTION_TITLES[sectionName] || '';
  }

  refreshSection(sectionName);
  applyGlobalSearch(lastSearchQuery);
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
  renderDashboardCharts();
  renderRecommendations();
  markDataUpdated();
}
// ===== CENTERS =====
async function loadCenters() {
  const view = 'card';
  const grid = document.getElementById('centersGrid');
  const empty = document.getElementById('centersEmpty');
  const hint = document.getElementById('centersCountHint');
  const tableWrap = document.getElementById('centersTableWrap');
  grid.innerHTML = '';
  if (tableWrap) tableWrap.innerHTML = '';

  const data = await apiCall('listCenters');
  if (!data.success) return;

  const centers = data.centers || [];
  markDataUpdated();
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

      const cover = c.cover || c.cover_photo || c.cover_url || c.photo || '';
      const coverHtml = cover
        ? `<div class="center-cover" style="background-image:url('${cover}')"></div>`
        : '<div class="center-cover placeholder"></div>';
      card.innerHTML = `
        ${coverHtml}
        <div class="card-body">
          <div class="title">${c.name || 'Center'}</div>
          <div class="center-tag">${c.focus_area || c.specialty || 'Social Skills'}</div>
          <div class="desc">
            ${c.description || '<span class="muted">A leading provider of VR-based developmental therapies.</span>'}
          </div>
        </div>
        <footer>
          <div class="center-footer">
            <div class="center-credentials">
              <span class="pill small">${c.address || '—'}</span>
              <span class="pill small">${c.email || c.username || '—'}</span>
            </div>
            <div class="card-actions">
              <button class="icon-action" aria-label="Edit center" data-edit-center="${c.center_id}">✏️</button>
              <button class="icon-action danger" aria-label="Delete center" data-delete-center="${c.center_id}">🗑️</button>
            </div>
          </div>
        </footer>
      `;

      grid.appendChild(card);
    });
    if (!grid.dataset.listener) {
      grid.addEventListener('click', handleCenterCardClick);
      grid.dataset.listener = 'true';
    }
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
          <th data-sort="name">Center ${renderSortIndicator(sort, 'name')}</th>
          <th data-sort="center_id">ID ${renderSortIndicator(sort, 'center_id')}</th>
          <th data-sort="num_specialists">Specialists ${renderSortIndicator(sort, 'num_specialists')}</th>
          <th data-sort="num_children">Children ${renderSortIndicator(sort, 'num_children')}</th>
          <th data-sort="username">Username ${renderSortIndicator(sort, 'username')}</th>
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
    if (tableWrap && !tableWrap.dataset.listener) {
      tableWrap.addEventListener('click', handleCenterCardClick);
      tableWrap.dataset.listener = 'true';
    }
    table.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort');
        const dir = sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
        sortState.centers = { key, dir };
        loadCenters();
      });
    });
  }

  applyGlobalSearch(lastSearchQuery);
}

async function handleCenterCardClick(e) {
  const editBtn = e.target.closest('[data-edit-center]');
  const delBtn = e.target.closest('[data-delete-center]');

  if (editBtn) {
    const id = editBtn.getAttribute('data-edit-center');
    setButtonLoading(editBtn, true, 'Loading...');
    try {
      await openCenterModalForEdit(id);
    } finally {
      setButtonLoading(editBtn, false);
    }
  } else if (delBtn) {
    const id = delBtn.getAttribute('data-delete-center');
    if (await confirmAction('Delete this center?')) {
      setButtonLoading(delBtn, true, 'Deleting...');
      showToast('Removing center...', 'success', 'Working');
      try {
        const res = await apiCall('deleteCenter', {
          center_id: id,
          actor_username: getCurrentUserName(),
          actor_role: 'admin'
        });
        if (!res.success) {
          showToast(res.error || 'Error deleting center', 'error', 'Delete failed');
          return;
        }
        showToast('Center deleted');
        loadCenters();
        setTimeout(loadDashboard, 300);
      } finally {
        setButtonLoading(delBtn, false);
      }
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
  document.getElementById('centerCoverInput').value = '';
  setCenterPhotoPreview('');
  setCenterCoverPreview('');
  openModal('centerModal');
}

async function openCenterModalForEdit(centerId) {
  showToast('Loading center...', 'success', 'Working');
  const data = await apiCall('listCenters');
  if (!data.success) {
    showToast(data.error || 'Unable to load center', 'error', 'Load failed');
    return;
  }
  const center = (data.centers || []).find(c => c.center_id == centerId);
  if (!center) {
    showToast('Center not found', 'error', 'Load failed');
    return;
  }

  document.getElementById('centerId').value = center.center_id;
  document.getElementById('centerModalTitle').textContent = 'Edit Center';
  document.getElementById('centerNameInput').value = center.name || '';
  document.getElementById('centerUsernameInput').value = center.username || '';
  document.getElementById('centerPasswordInput').value = center.password || '';
  document.getElementById('centerDescInput').value = center.description || '';
  const photo = center.photo || center.photo_url || center.photo_base64 || '';
  document.getElementById('centerPhotoInput').value = photo;
  setCenterPhotoPreview(photo);
  const cover = center.cover || center.cover_url || center.cover_photo || center.photo || '';
  document.getElementById('centerCoverInput').value = cover;
  setCenterCoverPreview(cover);
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
    cover: document.getElementById('centerCoverInput').value,
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
  const view = 'card';
  const grid = document.getElementById('specialistsGrid');
  const empty = document.getElementById('specialistsEmpty');
  const tableWrap = document.getElementById('specialistsTableWrap');
  grid.innerHTML = '';
  if (tableWrap) tableWrap.innerHTML = '';

  const data = await apiCall('listSpecialists');
  if (!data.success) return;

  const specialists = data.specialists || [];
  markDataUpdated();
  const hasData = specialists.length > 0;
  empty.style.display = hasData ? 'none' : 'block';
  grid.style.display = view === 'card' ? 'grid' : 'none';
  if (tableWrap) tableWrap.style.display = view === 'table' ? 'block' : 'none';
  if (!hasData) return;

  if (view === 'card') {
    specialists.forEach(s => {
      const card = document.createElement('article');
      card.className = 'specialist-card flip-card hover-lift';
      card.dataset.specId = s.specialist_id;
      card.tabIndex = 0;
      const photo = s.photo || s.photo_url || s.photo_base64 || '';
      const initials = getInitials(s.name || s.username);
      const languages = getLanguagePills(s);
      const specialty = getSpecialtyLabel(s);
      const extended = s.description || 'Extended specialization details not provided yet.';
      card.innerHTML = `
        <div class="flip-card-inner">
          <div class="flip-card-face front">
            <div class="specialist-top">
              <div class="avatar profile-avatar${photo ? ' has-photo' : ''}" style="${photo ? `background-image:url('${photo}')` : ''}" data-initials="${initials}"></div>
              <div>
                <strong>${s.name || s.username || 'Specialist'}</strong>
                <div class="specialist-specialty">${specialty}</div>
              </div>
            </div>
            <div class="language-pills">
              ${languages.map(lang => `<span class="pill small">${lang}</span>`).join('')}
            </div>
          </div>
          <div class="flip-card-face back">
            <div class="specialist-back">
              <div class="specialist-extended">${extended}</div>
              ${s.center_id ? `<div class="hint">Center: ${s.center_id}</div>` : '<div class="hint">No center assigned</div>'}
              <div class="assessment-actions">
                <button class="ghost small" data-edit-spec="${s.specialist_id}">Edit</button>
                <button class="ghost small danger" data-delete-spec="${s.specialist_id}">Delete</button>
              </div>
            </div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
    if (!grid.dataset.listener) {
      grid.addEventListener('click', handleSpecialistCardClick);
      grid.addEventListener('keydown', handleSpecialistCardKeydown);
      grid.dataset.listener = 'true';
    }
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
          <th data-sort="name">Specialist ${renderSortIndicator(sort, 'name')}</th>
          <th data-sort="specialist_id">ID ${renderSortIndicator(sort, 'specialist_id')}</th>
          <th data-sort="center_id">Center ${renderSortIndicator(sort, 'center_id')}</th>
          <th data-sort="num_children">Children ${renderSortIndicator(sort, 'num_children')}</th>
          <th data-sort="username">Username ${renderSortIndicator(sort, 'username')}</th>
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
    table.addEventListener('click', handleSpecialistCardClick);
    table.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort');
        const dir = sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
        sortState.specialists = { key, dir };
        loadSpecialists();
      });
    });
  }

  applyGlobalSearch(lastSearchQuery);
}

async function handleSpecialistCardClick(e) {
  const editBtn = e.target.closest('[data-edit-spec]');
  const delBtn = e.target.closest('[data-delete-spec]');
  const card = e.target.closest('.flip-card');

  if (editBtn) {
    const id = editBtn.getAttribute('data-edit-spec');
    setButtonLoading(editBtn, true, 'Loading...');
    try {
      await openSpecialistModalForEdit(id);
    } finally {
      setButtonLoading(editBtn, false);
    }
  } else if (delBtn) {
    const id = delBtn.getAttribute('data-delete-spec');
    if (await confirmAction('Delete this specialist?')) {
      setButtonLoading(delBtn, true, 'Deleting...');
      showToast('Removing specialist...', 'success', 'Working');
      try {
        const res = await apiCall('deleteSpecialist', {
          specialist_id: id,
          actor_username: getCurrentUserName(),
          actor_role: 'admin'
        });
        if (!res.success) {
          showToast(res.error || 'Error deleting specialist', 'error', 'Delete failed');
          return;
        }
        showToast('Specialist deleted');
        loadSpecialists();
        setTimeout(loadDashboard, 300);
      } finally {
        setButtonLoading(delBtn, false);
      }
    }
  } else if (card) {
    card.classList.toggle('flipped');
  }
}

function handleSpecialistCardKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  if (e.target.closest('button')) return;
  const card = e.target.closest('.flip-card');
  if (!card) return;
  e.preventDefault();
  card.classList.toggle('flipped');
}

function openSpecialistModalForCreate() {
  document.getElementById('specId').value = '';
  document.getElementById('specialistModalTitle').textContent = 'Add Specialist';
  document.getElementById('specNameInput').value = '';
  document.getElementById('specUsernameInput').value = '';
  document.getElementById('specPasswordInput').value = '';
  document.getElementById('specTypeInput').value = 'freelance';
  populateSpecialistCenterSelect();
  setSpecialistCenterSelectState(false);
  document.getElementById('specDescInput').value = '';
  document.getElementById('specPhotoInput').value = '';
  setSpecPhotoPreview('');
  openModal('specialistModal');
}

async function openSpecialistModalForEdit(specId) {
  showToast('Loading specialist...', 'success', 'Working');
  const data = await apiCall('listSpecialists');
  if (!data.success) {
    showToast(data.error || 'Unable to load specialist', 'error', 'Load failed');
    return;
  }
  const spec = (data.specialists || []).find(s => s.specialist_id == specId);
  if (!spec) {
    showToast('Specialist not found', 'error', 'Load failed');
    return;
  }

  document.getElementById('specId').value = spec.specialist_id;
  document.getElementById('specialistModalTitle').textContent = 'Edit Specialist';
  document.getElementById('specNameInput').value = spec.name || '';
  document.getElementById('specUsernameInput').value = spec.username || '';
  document.getElementById('specPasswordInput').value = spec.password || '';
  document.getElementById('specTypeInput').value = spec.type || 'freelance';
  await populateSpecialistCenterSelect(spec.center_id || '');
  setSpecialistCenterSelectState(spec.type === 'center');
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
  const type = document.getElementById('specTypeInput').value;
  const centerId = document.getElementById('specCenterIdInput').value;
  if (type === 'center' && !centerId) {
    showToast('Select a center for linked specialists', 'error', 'Missing center');
    setButtonLoading(saveBtn, false);
    return;
  }
  const payload = {
    name: document.getElementById('specNameInput').value,
    username: document.getElementById('specUsernameInput').value,
    password: document.getElementById('specPasswordInput').value,
    type,
    center_id: centerId,
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

function setSpecialistCenterSelectState(isLinked) {
  const select = document.getElementById('specCenterIdInput');
  if (!select) return;
  const enable = Boolean(isLinked);
  select.disabled = !enable;
  select.required = enable;
  if (!enable) select.value = '';
}

async function populateSpecialistCenterSelect(selectedId = '') {
  const select = document.getElementById('specCenterIdInput');
  if (!select) return;
  select.innerHTML = '<option value="">Select a center</option>';
  const data = await apiCall('listCenters');
  if (!data.success) return;
  (data.centers || []).forEach(center => {
    const option = document.createElement('option');
    option.value = center.center_id || '';
    option.textContent = center.name || center.center_id || 'Center';
    select.appendChild(option);
  });
  if (selectedId) {
    select.value = selectedId;
  }
}

function handleSpecTypeChange(e) {
  const type = e.target.value;
  if (type === 'center') {
    populateSpecialistCenterSelect();
    setSpecialistCenterSelectState(true);
  } else {
    setSpecialistCenterSelectState(false);
  }
}
// ===== CHILDREN =====
async function loadChildren() {
  const view = 'card';
  const grid = document.getElementById('childrenGrid');
  const empty = document.getElementById('childrenEmpty');
  const tableWrap = document.getElementById('childrenTableWrap');
  grid.innerHTML = '';
  if (tableWrap) tableWrap.innerHTML = '';

  const data = await apiCall('listChildren');
  if (!data.success) return;
  const children = data.children || [];
  markDataUpdated();

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
          <th id="selectAllChildren">
            <input type="checkbox" aria-label="Select all children">
          </th>
          <th data-sort="name">Child ${renderSortIndicator(sort, 'name')}</th>
          <th data-sort="child_id">ID ${renderSortIndicator(sort, 'child_id')}</th>
          <th data-sort="center_id">Center ${renderSortIndicator(sort, 'center_id')}</th>
          <th data-sort="specialist_id">Specialist ${renderSortIndicator(sort, 'specialist_id')}</th>
          <th data-sort="num_sessions">Sessions ${renderSortIndicator(sort, 'num_sessions')}</th>
          <th data-sort="age">Age ${renderSortIndicator(sort, 'age')}</th>
        </tr>
      </thead>
      <tbody>
        ${sorted
          .map(
            ch => `
              <tr>
                <td>
                  <input type="checkbox" class="child-select" data-child-id="${ch.child_id}">
                </td>
                <td>${ch.name || 'Child'}</td>
                <td class="meta-muted">${ch.child_id || '-'}</td>
                <td class="meta-muted">${ch.center_id || '-'}</td>
                <td class="meta-muted">${ch.specialist_id || '-'}</td>
                <td>${ch.num_sessions ?? 0}</td>
                <td>${ch.age ?? '-'}</td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    `;
    tableWrap.innerHTML = '';
    tableWrap.appendChild(table);
    const selectAllCell = table.querySelector('#selectAllChildren');
    const selectAll = selectAllCell ? selectAllCell.querySelector('input[type="checkbox"]') : null;
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        const checked = selectAll.checked;
        table.querySelectorAll('.child-select').forEach(cb => {
          cb.checked = checked;
        });
      });
      table.addEventListener('change', e => {
        if (!e.target.classList.contains('child-select')) return;
        const all = table.querySelectorAll('.child-select');
        const checked = table.querySelectorAll('.child-select:checked');
        selectAll.checked = all.length > 0 && checked.length === all.length;
        selectAll.indeterminate = checked.length > 0 && checked.length < all.length;
      });
    }
    table.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort');
        const dir = sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
        sortState.children = { key, dir };
        loadChildren();
      });
    });
  }

  applyGlobalSearch(lastSearchQuery);
}

async function handleChildCardClick(e) {
  const btn = e.target.closest('[data-view-child]');
  if (!btn) return;
  const childId = btn.getAttribute('data-view-child');
  showToast(`Child profile view (ID: ${childId}) coming soon`, 'success', 'Info');
}

// ===== MODULES =====
async function loadModules() {
  const view = 'card';
  const grid = document.getElementById('modulesGrid');
  const empty = document.getElementById('modulesEmpty');
  const tableWrap = document.getElementById('modulesTableWrap');
  grid.innerHTML = '';
  if (tableWrap) tableWrap.innerHTML = '';

  const data = await apiCall('listModules');
  if (!data.success) return;

  const modules = data.modules || [];
  const seenModuleKeys = new Set();
  const uniqueModules = [];
  modules.forEach(m => {
    const key = String(m.module_id ?? m.id ?? m.name ?? '');
    if (!key || seenModuleKeys.has(key)) return;
    seenModuleKeys.add(key);
    uniqueModules.push(m);
  });
  markDataUpdated();
  const hasData = uniqueModules.length > 0;
  empty.style.display = hasData ? 'none' : 'block';
  grid.style.display = view === 'card' ? 'grid' : 'none';
  if (tableWrap) tableWrap.style.display = view === 'table' ? 'block' : 'none';
  if (!hasData) return;

  if (view === 'card') {
    uniqueModules.forEach(m => {
      const domains = getModuleDomains(m);
      const difficulty = formatModuleStars(m.difficulty || m.level || 3);
      const usage = m.usage_count || m.num_sessions || m.num_centers_assigned || 0;
      const score = m.avg_score || m.score || 0;
      const scoreValue = Number(score);
      const scoreDisplay = Number.isFinite(scoreValue) ? scoreValue.toFixed(0) : '0';
      const duration = m.minutes_to_play || 0;
      const card = document.createElement('article');
      card.className = 'module-card module-card-clickable hover-lift';
      card.dataset.moduleId = m.module_id;
      card.tabIndex = 0;

      card.innerHTML = `
        <div class="module-header">
          <strong>${m.name || 'VR Module'}</strong>
          <div class="module-domains">
            ${domains.map(domain => `<span class="module-domain">${domain}</span>`).join('')}
          </div>
        </div>
        <div class="hint">${m.description || 'No description available yet.'}</div>
        <div class="module-metrics">
          <div>
            <span class="metric-label">Difficulty</span>
            <span class="metric-value">${difficulty}</span>
          </div>
          <div>
            <span class="metric-label">Usage</span>
            <span class="metric-value">${usage}</span>
          </div>
          <div>
            <span class="metric-label">Score</span>
            <span class="metric-value">${scoreDisplay}%</span>
          </div>
          <div>
            <span class="metric-label">Duration</span>
            <span class="metric-value">${duration} min</span>
          </div>
        </div>
        <div class="module-actions">
          <button class="ghost small" data-edit-module="${m.module_id}">Edit</button>
          <button class="ghost small danger" data-delete-module="${m.module_id}">Delete</button>
        </div>
      `;
      grid.appendChild(card);
    });
    if (!grid.dataset.listener) {
      grid.addEventListener('click', handleModuleCardClick);
      grid.addEventListener('keydown', handleModuleCardKeydown);
      grid.dataset.listener = 'true';
    }
  } else if (tableWrap) {
    const sort = sortState.modules;
    const sorted = [...uniqueModules].sort((a, b) => {
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
          <th data-sort="name">VR Module ${renderSortIndicator(sort, 'name')}</th>
          <th data-sort="module_id">ID ${renderSortIndicator(sort, 'module_id')}</th>
          <th data-sort="minutes_to_play">Minutes ${renderSortIndicator(sort, 'minutes_to_play')}</th>
          <th data-sort="num_centers_assigned">Centers ${renderSortIndicator(sort, 'num_centers_assigned')}</th>
          <th data-sort="status">Status ${renderSortIndicator(sort, 'status')}</th>
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
    table.addEventListener('click', handleModuleCardClick);
    table.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort');
        const dir = sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
        sortState.modules = { key, dir };
        loadModules();
      });
    });
  }

  applyGlobalSearch(lastSearchQuery);
}

async function handleModuleCardClick(e) {
  const editBtn = e.target.closest('[data-edit-module]');
  const delBtn = e.target.closest('[data-delete-module]');
  const card = e.target.closest('.module-card');

  if (editBtn) {
    const id = editBtn.getAttribute('data-edit-module');
    setButtonLoading(editBtn, true, 'Loading...');
    try {
      await openModuleModalForEdit(id);
    } finally {
      setButtonLoading(editBtn, false);
    }
  } else if (delBtn) {
    const id = delBtn.getAttribute('data-delete-module');
    if (await confirmAction('Delete this module?')) {
      setButtonLoading(delBtn, true, 'Deleting...');
      showToast('Removing module...', 'success', 'Working');
      try {
        const res = await apiCall('deleteModule', {
          module_id: id,
          actor_username: getCurrentUserName(),
          actor_role: 'admin'
        });
        if (!res.success) {
          showToast(res.error || 'Error deleting module', 'error', 'Delete failed');
          return;
        }
        showToast('Module deleted');
        loadModules();
        setTimeout(loadDashboard, 300);
      } finally {
        setButtonLoading(delBtn, false);
      }
    }
  } else if (card && card.dataset.moduleId) {
    await openModuleModalForEdit(card.dataset.moduleId);
  }
}

async function handleModuleCardKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  if (e.target.closest('button')) return;
  const card = e.target.closest('.module-card');
  if (!card || !card.dataset.moduleId) return;
  e.preventDefault();
  await openModuleModalForEdit(card.dataset.moduleId);
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
  if (!data.success) {
    showToast(data.error || 'Unable to load module', 'error', 'Load failed');
    return;
  }
  const m = (data.modules || []).find(x => x.module_id == moduleId);
  if (!m) {
    showToast('Module not found', 'error', 'Load failed');
    return;
  }

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
// ===== ASSESSMENT DASHBOARD =====
async function loadAssessmentSection() {
  await loadAssessmentChildren();
  clearAssessmentDetails();
}

async function loadAssessmentChildren() {
  const data = await apiCall('listChildren');
  if (!data.success) return;
  const children = data.children || [];
  assessmentChildrenCache = [...children].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
  );
  renderAssessmentChildrenList(assessmentChildrenCache);
  renderAssessmentChildSelect(assessmentChildrenCache);
}

function renderAssessmentChildrenList(children) {
  const list = document.getElementById('assessmentChildList');
  if (!list) return;
  list.innerHTML = '';
  const wrapper = list.closest('.child-dropdown');
  if (wrapper) {
    wrapper.classList.toggle('has-items', children.length > 0);
  }
  children.forEach(child => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'child-option';
    btn.setAttribute('role', 'option');
    btn.dataset.childId = child.child_id;
    btn.textContent = child.name || `Child ${child.child_id}`;
    list.appendChild(btn);
  });
}

function renderAssessmentChildSelect(children) {
  const select = document.getElementById('assessmentChildSelect');
  if (!select) return;
  select.innerHTML = '<option value="">Select child</option>';
  children.forEach(child => {
    const option = document.createElement('option');
    option.value = child.child_id;
    option.textContent = child.name || `Child ${child.child_id}`;
    select.appendChild(option);
  });
}

function clearAssessmentDetails() {
  const details = document.getElementById('assessmentDetails');
  const emptyCard = document.getElementById('assessmentEmptyCard');
  if (details) details.style.display = 'none';
  if (emptyCard) emptyCard.style.display = 'grid';
  clearAssessmentCharts();
}

function clearAssessmentCharts() {
  Object.values(assessmentCharts).forEach(chart => {
    if (chart && typeof chart.destroy === 'function') chart.destroy();
  });
  assessmentCharts = {};
}

async function handleAssessmentChildSelect(childId) {
  const child = assessmentChildrenCache.find(item => String(item.child_id) === String(childId));
  if (!child) return;

  const avatar = document.getElementById('assessmentChildAvatar');
  if (avatar) {
    const photo = child.photo || child.photo_url || child.photo_base64 || '';
    avatar.classList.toggle('has-photo', Boolean(photo));
    avatar.style.backgroundImage = photo ? `url('${photo}')` : '';
    avatar.setAttribute('data-initials', getInitials(child.name || 'Child'));
  }

  setText('assessmentChildName', child.name || 'Child');
  setText('assessmentChildAge', `Age: ${child.age || '--'}`);
  setText('assessmentChildCenter', `Center: ${child.center_name || child.center_id || '--'}`);

  const details = document.getElementById('assessmentDetails');
  const emptyCard = document.getElementById('assessmentEmptyCard');
  if (details) details.style.display = 'grid';
  if (emptyCard) emptyCard.style.display = 'none';

  const assessmentData = await fetchAssessmentData(child.child_id);
  renderAssessmentCharts(assessmentData);
}

async function fetchAssessmentData(childId) {
  const domains = [
    'Cognitive',
    'Language & Communication',
    'Social & Emotional',
    'Motor & Sensory',
    'Early Academic Skills',
    'Executive Function'
  ];

  let radarScores = null;
  let progressScores = null;

  const res = await apiCall('listAssessmentResponses', { child_id: childId });
  if (res?.success && Array.isArray(res.responses) && res.responses.length) {
    const responses = res.responses;
    const grouped = domains.reduce((acc, domain) => {
      acc[domain] = [];
      return acc;
    }, {});

    responses.forEach(r => {
      const domain = r.category || r.domain || '';
      const score = Number(r.score || 0);
      if (grouped[domain]) grouped[domain].push(score);
    });

    radarScores = domains.map(domain => {
      const scores = grouped[domain] || [];
      if (!scores.length) return 0;
      const avg = scores.reduce((acc, value) => acc + value, 0) / scores.length;
      return Math.round(avg);
    });

    const sorted = [...responses]
      .filter(r => r.created_at || r.date)
      .sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date))
      .slice(-5);
    if (sorted.length) {
      progressScores = sorted.map(r => Math.round(Number(r.score || 0)));
    }
  }

  if (!radarScores) {
    radarScores = [72, 64, 70, 58, 66, 74];
  }
  if (!progressScores) {
    progressScores = [58, 64, 70, 76, 82];
  }

  return { domains, radarScores, progressScores };
}

function renderAssessmentCharts({ domains, radarScores, progressScores }) {
  if (!window.Chart) return;

  clearAssessmentCharts();

  const radarCtx = document.getElementById('assessmentRadarChart')?.getContext('2d');
  if (radarCtx) {
    assessmentCharts.radar = new Chart(radarCtx, {
      type: 'radar',
      data: {
        labels: domains,
        datasets: [
          {
            label: 'Score',
            data: radarScores,
            backgroundColor: 'rgba(168, 85, 247, 0.25)',
            borderColor: '#a855f7',
            pointBackgroundColor: '#a855f7',
            borderWidth: 2
          }
        ]
      },
      options: {
        scales: {
          r: {
            angleLines: { color: 'rgba(255,255,255,0.08)' },
            grid: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: { color: '#cfd2e5', font: { size: 11 } },
            ticks: { color: '#9aa0b4', backdropColor: 'transparent' },
            suggestedMin: 0,
            suggestedMax: 100
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  const lineCtx = document.getElementById('assessmentProgressChart')?.getContext('2d');
  if (lineCtx) {
    assessmentCharts.progress = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: ['S1', 'S2', 'S3', 'S4', 'S5'],
        datasets: [
          {
            label: 'Progress',
            data: progressScores,
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        scales: {
          x: { ticks: { color: '#9aa0b4' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: {
            min: 0,
            max: 100,
            ticks: { color: '#9aa0b4' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }
}

// ===== QUESTIONS =====
async function loadQuestions() {
  await loadAssessmentLibrary();
}

async function loadAssessmentLibrary() {
  const list = document.getElementById('questionsList');
  const empty = document.getElementById('questionsEmpty');
  if (list) list.innerHTML = '';

  const data = await apiCall('listQuestions');
  if (!data.success) return;
  const qs = data.questions || [];
  questionsCache = qs;
  markDataUpdated();

  if (!qs.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  populateQuestionFilters(qs);
  renderQuestionsList(applyQuestionFilters(qs));
  applyGlobalSearch(lastSearchQuery);
}

function renderQuestionsList(qs) {
  const list = document.getElementById('questionsList');
  if (!list) return;
  list.innerHTML = '';

  qs.forEach(q => {
    const statusValue = String(q.status || 'active').toLowerCase();
    const card = document.createElement('article');
    card.className = 'assessment-card';
    card.innerHTML = `
      <strong>${q.question_text || '-'}</strong>
      <div class="assessment-meta">
        <span>Category: ${q.category || 'General'}</span>
        <span>Difficulty: ${q.difficulty || 'N/A'}</span>
        <span>Status: ${q.status || 'Active'}</span>
      </div>
      <div class="assessment-actions">
        <button class="ghost small" data-edit-question="${q.question_id}">Edit</button>
        ${renderAssessmentActions({ ...q, status: statusValue })}
      </div>
    `;
    list.appendChild(card);
  });

  if (!list.dataset.listener) {
    list.addEventListener('click', handleQuestionListClick);
    list.dataset.listener = 'true';
  }
}

function populateQuestionFilters(qs) {
  const categorySelect = document.getElementById('questionFilterCategory');
  const difficultySelect = document.getElementById('questionFilterDifficulty');
  const statusSelect = document.getElementById('questionFilterStatus');
  if (!categorySelect || !difficultySelect || !statusSelect) return;

  const currentCategory = categorySelect.value;
  const currentDifficulty = difficultySelect.value;
  const currentStatus = statusSelect.value;

  const categories = Array.from(
    new Set(qs.map(q => q.category).filter(Boolean))
  ).sort((a, b) => String(a).localeCompare(String(b)));
  const difficulties = Array.from(
    new Set(qs.map(q => q.difficulty).filter(Boolean))
  ).sort((a, b) => String(a).localeCompare(String(b)));

  categorySelect.innerHTML = '<option value="">All categories</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });

  difficultySelect.innerHTML = '<option value="">All difficulties</option>';
  difficulties.forEach(difficulty => {
    const option = document.createElement('option');
    option.value = difficulty;
    option.textContent = difficulty;
    difficultySelect.appendChild(option);
  });

  statusSelect.innerHTML = `
    <option value="">All statuses</option>
    <option value="Active">Active</option>
    <option value="Archived">Archived</option>
  `;

  if (currentCategory) categorySelect.value = currentCategory;
  if (currentDifficulty) difficultySelect.value = currentDifficulty;
  if (currentStatus) statusSelect.value = currentStatus;
}

function applyQuestionFilters(qs) {
  const category = questionFilters.category;
  const difficulty = questionFilters.difficulty;
  const status = questionFilters.status;
  return qs.filter(q => {
    const matchesCategory = !category || q.category === category;
    const matchesDifficulty = !difficulty || q.difficulty === difficulty;
    const questionStatus = String(q.status || 'Active');
    const matchesStatus =
      !status || questionStatus.toLowerCase() === status.toLowerCase();
    return matchesCategory && matchesDifficulty && matchesStatus;
  });
}

function handleQuestionFilterChange() {
  const categorySelect = document.getElementById('questionFilterCategory');
  const difficultySelect = document.getElementById('questionFilterDifficulty');
  const statusSelect = document.getElementById('questionFilterStatus');
  questionFilters.category = categorySelect ? categorySelect.value : '';
  questionFilters.difficulty = difficultySelect ? difficultySelect.value : '';
  questionFilters.status = statusSelect ? statusSelect.value : '';
  renderQuestionsList(applyQuestionFilters(questionsCache));
}

async function handleQuestionListClick(e) {
  const editBtn = e.target.closest('[data-edit-question]');

  if (editBtn) {
    const id = editBtn.getAttribute('data-edit-question');
    openQuestionModalForEdit(id);
  }
}

function renderAssessmentActions(question) {
  if (question.status === 'active') {
    return `<button class="ghost small danger" title="Archiving hides this question from new assessments."
      onclick="archiveAssessmentQuestion('${question.question_id}', this)">
      Archive</button>`;
  }
  if (question.status === 'archived') {
    return `<button class="ghost small" title="Activate to make this question available again."
      onclick="activateAssessmentQuestion('${question.question_id}', this)">
      Activate</button>`;
  }
  return '';
}

async function archiveAssessmentQuestion(questionId, btn) {
  if (!confirm('Archive this assessment question?')) return;
  setButtonLoading(btn, true, 'Archiving...');
  const res = await apiRequest('updateQuestion', {
    question_id: questionId,
    status: 'archived'
  });
  if (!res.success) {
    showToast('Failed to archive question', 'error');
    setButtonLoading(btn, false);
    return;
  }
  showToast('Question archived');
  loadAssessmentLibrary();
  setButtonLoading(btn, false);
}

async function activateAssessmentQuestion(questionId, btn) {
  setButtonLoading(btn, true, 'Activating...');
  const res = await apiRequest('updateQuestion', {
    question_id: questionId,
    status: 'active'
  });
  if (!res.success) {
    showToast('Failed to activate question', 'error');
    setButtonLoading(btn, false);
    return;
  }
  showToast('Question activated');
  loadAssessmentLibrary();
  setButtonLoading(btn, false);
}

function openQuestionModalForCreate() {
  document.getElementById('questionId').value = '';
  document.getElementById('questionModalTitle').textContent = 'Add Question';
  document.getElementById('qTextInput').value = '';
  document.getElementById('qCategoryInput').value = '';
  document.getElementById('qDifficultyInput').value = '';
  document.getElementById('qStatusInput').value = 'active';
  openModal('questionModal');
}

async function openQuestionModalForEdit(questionId) {
  showToast('Loading question...', 'success', 'Working');
  const data = await apiCall('listQuestions');
  if (!data.success) {
    showToast(data.error || 'Unable to load question', 'error', 'Load failed');
    return;
  }
  const q = (data.questions || []).find(x => x.question_id == questionId);
  if (!q) {
    showToast('Question not found', 'error', 'Load failed');
    return;
  }

  document.getElementById('questionId').value = q.question_id;
  document.getElementById('questionModalTitle').textContent = 'Edit Question';
  document.getElementById('qTextInput').value = q.question_text || '';
  document.getElementById('qCategoryInput').value = q.category || '';
  document.getElementById('qDifficultyInput').value = q.difficulty || '';
  document.getElementById('qStatusInput').value = String(q.status || 'active').toLowerCase();
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
    status: document.getElementById('qStatusInput').value,
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
  updateProfileSummary();
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

function handleCenterCoverChange(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    document.getElementById('centerCoverInput').value = dataUrl;
    setCenterCoverPreview(dataUrl);
  };
  reader.readAsDataURL(file);
}

function setCenterCoverPreview(src) {
  const preview = document.getElementById('centerCoverPreview');
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

function clearCharts() {
  Object.values(charts).forEach(chart => {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  });
  charts = {};
}

function renderDashboardCharts() {
  if (!window.Chart) return;

  clearCharts();

  const minutesCtx = document.getElementById('vrMinutesChart')?.getContext('2d');
  if (minutesCtx) {
    charts.vrMinutes = new Chart(minutesCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Therapy',
            data: [420, 510, 460, 580, 620, 710, 680],
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            tension: 0.35,
            fill: true
          },
          {
            label: 'Assessment',
            data: [260, 300, 280, 340, 360, 390, 410],
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124, 58, 237, 0.12)',
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: '#cfd2e5' } }
        },
        scales: {
          x: { ticks: { color: '#9aa0b4' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#9aa0b4' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  const deviceCtx = document.getElementById('sessionsDeviceChart')?.getContext('2d');
  if (deviceCtx) {
    charts.sessions = new Chart(deviceCtx, {
      type: 'doughnut',
      data: {
        labels: ['Quest', 'Vive', 'Pico', 'Mobile'],
        datasets: [
          {
            data: [42, 28, 18, 12],
            backgroundColor: ['#a855f7', '#7c3aed', '#ec4899', '#22c55e'],
            borderWidth: 0
          }
        ]
      },
      options: {
        cutout: '68%',
        plugins: {
          legend: { labels: { color: '#cfd2e5' } }
        }
      }
    });
  }

  const progressCtx = document.getElementById('learningProgressChart')?.getContext('2d');
  if (progressCtx) {
    charts.learning = new Chart(progressCtx, {
      type: 'doughnut',
      data: {
        labels: ['Complete', 'Remaining'],
        datasets: [
          {
            data: [72, 28],
            backgroundColor: ['#a855f7', 'rgba(255,255,255,0.08)'],
            borderWidth: 0
          }
        ]
      },
      options: {
        cutout: '72%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  const rateCtx = document.getElementById('progressRateChart')?.getContext('2d');
  if (rateCtx) {
    const centers = [
      { name: 'North Ridge', value: 86 },
      { name: 'East Harbor', value: 74 },
      { name: 'Summit', value: 68 },
      { name: 'Cedar Gate', value: 62 }
    ].sort((a, b) => b.value - a.value);

    charts.rate = new Chart(rateCtx, {
      type: 'bar',
      data: {
        labels: centers.map(c => c.name),
        datasets: [
          {
            label: 'Progress Rate',
            data: centers.map(c => c.value),
            backgroundColor: 'rgba(168, 85, 247, 0.6)',
            borderRadius: 10
          }
        ]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: '#9aa0b4' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#cfd2e5' }, grid: { display: false } }
        }
      }
    });
  }
}

function renderRecommendations() {
  const list = document.getElementById('aiRecommendations');
  if (!list) return;
  list.innerHTML = '';
  const items = [
    'Prioritize onboarding at centers below 60% progress.',
    'Review VR module usage for kids under 8 sessions.',
    'Schedule specialist pairing for high-demand centers.',
    'Flag devices with repeated session drop-offs.'
  ];
  items.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    list.appendChild(li);
  });
}

function buildPurpleIcon() {
  if (!window.L) return null;
  return L.divIcon({
    className: 'purple-marker',
    iconSize: [14, 14]
  });
}

function getCenterCoordinates(center) {
  const lat = center.lat || center.latitude || center.center_lat || center.centerLatitude;
  const lng = center.lng || center.longitude || center.center_lng || center.centerLongitude;
  if (!lat || !lng) return null;
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
  return [latNum, lngNum];
}

function renderCentersMap(centers) {
  const status = document.getElementById('centersMapStatus');
  if (!window.L) {
    if (status) status.textContent = 'Map unavailable.';
    return;
  }

  if (!centersMap) {
    centersMap = L.map('centersMap', { zoomControl: false }).setView([40.73, -73.93], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(centersMap);
  }

  centersMapMarkers.forEach(marker => marker.remove());
  centersMapMarkers = [];

  const icon = buildPurpleIcon();
  const coords = centers.map(getCenterCoordinates).filter(Boolean);
  if (!coords.length) {
    if (status) status.textContent = 'No center coordinates yet.';
    return;
  }

  coords.forEach(([lat, lng]) => {
    const marker = L.marker([lat, lng], { icon });
    marker.addTo(centersMap);
    centersMapMarkers.push(marker);
  });

  if (status) status.textContent = `${coords.length} center location${coords.length !== 1 ? 's' : ''}`;
  const bounds = L.latLngBounds(coords);
  centersMap.fitBounds(bounds.pad(0.2));
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
  initShell();
  initUserChip();
  initDynamicLabels();
  initModalCloseButtons();
  updateLastUpdatedLabel();
  setInterval(updateLastUpdatedLabel, 60000);
  document.getElementById('specPhotoFile')?.addEventListener('change', handleSpecPhotoChange);
  document.getElementById('specTypeInput')?.addEventListener('change', handleSpecTypeChange);
  document.getElementById('centerPhotoFile')?.addEventListener('change', handleCenterPhotoChange);
  document.getElementById('centerCoverFile')?.addEventListener('change', handleCenterCoverChange);
  document.getElementById('modulePhotoFile')?.addEventListener('change', handleModulePhotoChange);
  document.getElementById('accountPhotoFile')?.addEventListener('change', handleAccountPhotoChange);
  document.getElementById('accountSettingsBtn')?.addEventListener('click', openAccountSettings);
  document.getElementById('accountSaveBtn')?.addEventListener('click', saveAccountSettings);

  const childSearch = document.getElementById('assessmentChildSearch');
  const childList = document.getElementById('assessmentChildList');
  const childSelect = document.getElementById('assessmentChildSelect');
  childSearch?.addEventListener('input', () => {
    const term = childSearch.value.trim().toLowerCase();
    if (childSelect) childSelect.value = '';
    const filtered = assessmentChildrenCache.filter(child =>
      String(child.name || '').toLowerCase().includes(term)
    );
    renderAssessmentChildrenList(filtered);
  });
  childList?.addEventListener('click', (event) => {
    const option = event.target.closest('[data-child-id]');
    if (!option) return;
    childSearch.value = option.textContent;
    if (childSelect) childSelect.value = option.dataset.childId;
    handleAssessmentChildSelect(option.dataset.childId);
  });
  childSelect?.addEventListener('change', () => {
    const selectedId = childSelect.value;
    if (!selectedId) return;
    const child = assessmentChildrenCache.find(item => String(item.child_id) === String(selectedId));
    if (childSearch) childSearch.value = child?.name || '';
    handleAssessmentChildSelect(selectedId);
  });

  initSettingsControls();

  document.addEventListener('unitysphere:search', (event) => {
    applyGlobalSearch(event.detail.query);
  });

  document.getElementById('refreshAllBtn')?.addEventListener('click', () => {
    const btn = document.getElementById('refreshAllBtn');
    setButtonLoading(btn, true, 'Refreshing...');
    const active = document.querySelector('.section.active');
    if (active) {
      const id = active.id.replace('section-', '');
      showSection(id);
      showToast('Section refreshed', 'success', 'Refreshed');
    } else {
      loadDashboard();
    }
    setTimeout(() => setButtonLoading(btn, false), 500);
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  });

  // empty-state CTAs
  document.getElementById('centersEmptyAdd')?.addEventListener('click', openCenterModalForCreate);
  document.getElementById('specialistsEmptyAdd')?.addEventListener('click', openSpecialistModalForCreate);
  document.getElementById('modulesEmptyAdd')?.addEventListener('click', openModuleModalForCreate);

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
  showSection('dashboard');
});

















// ===== CONFIG =====
const API_URL = 'https://script.google.com/macros/s/AKfycbxErCCEs6YOSy18SufoYe4ZSYSbh6yOvvu7pAvpygqtTUE2m1LPZ_z9xH1TjK3abDlS/exec'; // TODO: replace with deployed Apps Script URL

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

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ===== NAVIGATION =====
function showSection(sectionName) {
  document.querySelectorAll('.section').forEach(sec => {
    sec.classList.remove('active');
  });
  document.getElementById(`section-${sectionName}`).classList.add('active');

  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === sectionName);
  });

  switch (sectionName) {
    case 'dashboard': loadDashboard(); break;
    case 'centers': loadCenters(); break;
    case 'specialists': loadSpecialists(); break;
    case 'children': loadChildren(); break;
    case 'modules': loadModules(); break;
    case 'questions': loadQuestions(); break;
  }
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
}

// ===== CENTERS =====
async function loadCenters() {
  const grid = document.getElementById('centersGrid');
  const empty = document.getElementById('centersEmpty');
  const hint = document.getElementById('centersCountHint');
  grid.innerHTML = '';

  const data = await apiCall('listCenters');
  if (!data.success) return;

  const centers = data.centers || [];
  if (hint) hint.textContent = `${centers.length} center${centers.length !== 1 ? 's' : ''}`;

  if (!centers.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  centers.forEach(c => {
    const card = document.createElement('article');
    card.className = 'center-card';

    card.innerHTML = `
      <div class="card-body">
        <div class="title">${c.name || 'Unnamed center'}</div>
        <div class="place muted">Center ID: ${c.center_id}</div>
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
          <div>
            <button class="ghost small" data-edit-center="${c.center_id}">Edit</button>
            <button class="ghost small" data-delete-center="${c.center_id}">Delete</button>
          </div>
        </div>
      </footer>
    `;

    grid.appendChild(card);
  });

  grid.addEventListener('click', handleCenterCardClick, { once: true });
}

async function handleCenterCardClick(e) {
  const editBtn = e.target.closest('[data-edit-center]');
  const delBtn = e.target.closest('[data-delete-center]');

  if (editBtn) {
    const id = editBtn.getAttribute('data-edit-center');
    openCenterModalForEdit(id);
  } else if (delBtn) {
    const id = delBtn.getAttribute('data-delete-center');
    if (confirm('Soft delete this center?')) {
      await apiCall('deleteCenter', {
        center_id: id,
        actor_username: getCurrentUserName(),
        actor_role: 'admin'
      });
      loadCenters();
      loadDashboard();
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
  openModal('centerModal');
}

async function openCenterModalForEdit(centerId) {
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
  openModal('centerModal');
}

async function saveCenter() {
  const id = document.getElementById('centerId').value;
  const payload = {
    name: document.getElementById('centerNameInput').value,
    username: document.getElementById('centerUsernameInput').value,
    password: document.getElementById('centerPasswordInput').value,
    description: document.getElementById('centerDescInput').value,
    actor_username: getCurrentUserName(),
    actor_role: 'admin'
  };

  let res;
  if (id) {
    res = await apiCall('updateCenter', { center_id: id, ...payload });
  } else {
    res = await apiCall('createCenter', payload);
  }

  if (res.success) {
    closeModal('centerModal');
    loadCenters();
    loadDashboard();
  } else {
    alert(res.error || 'Error saving center');
  }
}

// ===== SPECIALISTS =====
async function loadSpecialists() {
  const grid = document.getElementById('specialistsGrid');
  const empty = document.getElementById('specialistsEmpty');
  grid.innerHTML = '';

  const data = await apiCall('listSpecialists');
  if (!data.success) return;

  const specialists = data.specialists || [];
  if (!specialists.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  specialists.forEach(s => {
    const card = document.createElement('article');
    card.className = 'specialist-card';

    const avatarUrl = 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=60';

    card.innerHTML = `
      <div class="avatar" style="background-image:url('${avatarUrl}')"></div>
      <div>
        <strong>${s.name || 'Unnamed specialist'}</strong>
        <p>${s.description || '<span class="muted">No description provided</span>'}</p>
      </div>
      <div class="specialist-credentials">
        <span class="chip subtle">${s.type === 'freelance' ? 'Freelance' : 'Center-linked'}</span>
        ${s.center_id ? `<span class="chip subtle">Center: ${s.center_id}</span>` : ''}
        <span class="chip subtle">Children: ${s.num_children}</span>
        <span class="chip subtle">User: ${s.username}</span>
      </div>
      <div>
        <button class="ghost small" data-edit-spec="${s.specialist_id}">Edit</button>
        <button class="ghost small" data-delete-spec="${s.specialist_id}">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.addEventListener('click', handleSpecialistCardClick, { once: true });
}

async function handleSpecialistCardClick(e) {
  const editBtn = e.target.closest('[data-edit-spec]');
  const delBtn = e.target.closest('[data-delete-spec]');

  if (editBtn) {
    const id = editBtn.getAttribute('data-edit-spec');
    openSpecialistModalForEdit(id);
  } else if (delBtn) {
    const id = delBtn.getAttribute('data-delete-spec');
    if (confirm('Soft delete this specialist?')) {
      await apiCall('deleteSpecialist', {
        specialist_id: id,
        actor_username: getCurrentUserName(),
        actor_role: 'admin'
      });
      loadSpecialists();
      loadDashboard();
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
  openModal('specialistModal');
}

async function openSpecialistModalForEdit(specId) {
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
  openModal('specialistModal');
}

async function saveSpecialist() {
  const id = document.getElementById('specId').value;
  const payload = {
    name: document.getElementById('specNameInput').value,
    username: document.getElementById('specUsernameInput').value,
    password: document.getElementById('specPasswordInput').value,
    type: document.getElementById('specTypeInput').value,
    center_id: document.getElementById('specCenterIdInput').value,
    description: document.getElementById('specDescInput').value,
    actor_username: getCurrentUserName(),
    actor_role: 'admin'
  };

  let res;
  if (id) {
    res = await apiCall('updateSpecialist', { specialist_id: id, ...payload });
  } else {
    res = await apiCall('createSpecialist', payload);
  }

  if (res.success) {
    closeModal('specialistModal');
    loadSpecialists();
    loadDashboard();
  } else {
    alert(res.error || 'Error saving specialist');
  }
}

// ===== CHILDREN =====
async function loadChildren() {
  const grid = document.getElementById('childrenGrid');
  const empty = document.getElementById('childrenEmpty');
  grid.innerHTML = '';

  const data = await apiCall('listChildren');
  if (!data.success) return;
  const children = data.children || [];

  if (!children.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  children.forEach(ch => {
    const card = document.createElement('article');
    card.className = 'module-card'; // reuse module card style

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
        Latest assessment: ${ch.latest_assessment_date ? new Date(ch.latest_assessment_date).toLocaleDateString() : 'None'}
      </div>
      <div>
        <button class="ghost small" data-view-child="${ch.child_id}">View profile</button>
      </div>
    `;

    grid.appendChild(card);
  });

  grid.addEventListener('click', handleChildCardClick, { once: true });
}

async function handleChildCardClick(e) {
  const btn = e.target.closest('[data-view-child]');
  if (!btn) return;
  const childId = btn.getAttribute('data-view-child');
  // for now just alert; later you can open a detailed child modal
  alert(`Child profile view not yet implemented (child_id: ${childId})`);
}

// ===== MODULES =====
async function loadModules() {
  const grid = document.getElementById('modulesGrid');
  const empty = document.getElementById('modulesEmpty');
  grid.innerHTML = '';

  const data = await apiCall('listModules');
  if (!data.success) return;

  const modules = data.modules || [];
  if (!modules.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  modules.forEach(m => {
    const card = document.createElement('article');
    card.className = 'module-card';

    card.innerHTML = `
      <header>
        <div>
          <strong>${m.name || 'Module'}</strong>
          <div class="hint">ID: ${m.module_id}</div>
        </div>
        <span class="chip subtle">${m.minutes_to_play || 0} min</span>
      </header>
      <div class="module-meta">
        <span>Centers assigned: ${m.num_centers_assigned || 0}</span>
        <span>Status: ${m.status || 'active'}</span>
      </div>
      <div class="hint">
        ${m.description || '<span class="muted">No description.</span>'}
      </div>
      <div>
        <button class="ghost small" data-edit-module="${m.module_id}">Edit</button>
        <button class="ghost small" data-delete-module="${m.module_id}">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.addEventListener('click', handleModuleCardClick, { once: true });
}

async function handleModuleCardClick(e) {
  const editBtn = e.target.closest('[data-edit-module]');
  const delBtn = e.target.closest('[data-delete-module]');

  if (editBtn) {
    const id = editBtn.getAttribute('data-edit-module');
    openModuleModalForEdit(id);
  } else if (delBtn) {
    const id = delBtn.getAttribute('data-delete-module');
    if (confirm('Soft delete this module?')) {
      await apiCall('deleteModule', {
        module_id: id,
        actor_username: getCurrentUserName(),
        actor_role: 'admin'
      });
      loadModules();
      loadDashboard();
    }
  }
}

function openModuleModalForCreate() {
  document.getElementById('moduleId').value = '';
  document.getElementById('moduleModalTitle').textContent = 'Add Module';
  document.getElementById('modNameInput').value = '';
  document.getElementById('modPhotoInput').value = '';
  document.getElementById('modMinutesInput').value = '';
  document.getElementById('modDescInput').value = '';
  openModal('moduleModal');
}

async function openModuleModalForEdit(moduleId) {
  const data = await apiCall('listModules');
  if (!data.success) return;
  const m = (data.modules || []).find(x => x.module_id == moduleId);
  if (!m) return;

  document.getElementById('moduleId').value = m.module_id;
  document.getElementById('moduleModalTitle').textContent = 'Edit Module';
  document.getElementById('modNameInput').value = m.name || '';
  document.getElementById('modPhotoInput').value = m.photo_url || '';
  document.getElementById('modMinutesInput').value = m.minutes_to_play || '';
  document.getElementById('modDescInput').value = m.description || '';
  openModal('moduleModal');
}

async function saveModule() {
  const id = document.getElementById('moduleId').value;
  const payload = {
    name: document.getElementById('modNameInput').value,
    photo_url: document.getElementById('modPhotoInput').value,
    minutes_to_play: document.getElementById('modMinutesInput').value,
    description: document.getElementById('modDescInput').value,
    actor_username: getCurrentUserName(),
    actor_role: 'admin'
  };

  let res;
  if (id) {
    res = await apiCall('updateModule', { module_id: id, ...payload });
  } else {
    res = await apiCall('createModule', payload);
  }

  if (res.success) {
    closeModal('moduleModal');
    loadModules();
    loadDashboard();
  } else {
    alert(res.error || 'Error saving module');
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
      <div class="recommendation-icon">❓</div>
      <div class="recommendation-body">
        <strong>${q.question_text}</strong>
        <div class="hint">
          Category: ${q.category || '—'} · Difficulty: ${q.difficulty || '—'} · ID: ${q.question_id}
        </div>
        <div style="margin-top:0.3rem;">
          <button class="ghost small" data-edit-question="${q.question_id}">Edit</button>
          <button class="ghost small" data-delete-question="${q.question_id}">Delete</button>
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
    if (confirm('Soft delete this question?')) {
      await apiCall('deleteQuestion', {
        question_id: id,
        actor_username: getCurrentUserName(),
        actor_role: 'admin'
      });
      loadQuestions();
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
  const id = document.getElementById('questionId').value;
  const payload = {
    question_text: document.getElementById('qTextInput').value,
    category: document.getElementById('qCategoryInput').value,
    difficulty: document.getElementById('qDifficultyInput').value,
    actor_username: getCurrentUserName(),
    actor_role: 'admin'
  };

  let res;
  if (id) {
    res = await apiCall('updateQuestion', { question_id: id, ...payload });
  } else {
    res = await apiCall('createQuestion', payload);
  }

  if (res.success) {
    closeModal('questionModal');
    loadQuestions();
  } else {
    alert(res.error || 'Error saving question');
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

  // close when clicking backdrop
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) backdrop.classList.remove('active');
    });
  });
}

// ===== SESSION / USER =====
function getCurrentUserName() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.username || 'admin';
  } catch {
    return 'admin';
  }
}

function initUserChip() {
  const name = getCurrentUserName();
  const el = document.getElementById('currentUserName');
  if (el) el.textContent = name || 'Admin';
}

function initAuthGuard() {
  const role = localStorage.getItem('role');
  if (role !== 'admin') {
    // not an admin → redirect to login
    window.location.href = 'login.html';
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initAuthGuard();
  initUserChip();
  initModalCloseButtons();

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
    } else {
      loadDashboard();
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  });

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
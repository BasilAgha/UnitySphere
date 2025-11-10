// ===== UnitySphere Admin (client-side) =====

const STORAGE_KEY = 'unitysphere-data-v3';
const storageAvailable = typeof localStorage !== 'undefined';

function uid(){ return Math.random().toString(36).slice(2,10); }
function clone(x){ return JSON.parse(JSON.stringify(x)); }

function seedCenter({ name, location, desc, tags = [], image, posX, posY, login }) {
  return {
    id: uid(),
    name,
    location,
    desc,
    tags,
    image,
    posX,
    posY,
    login: login || null
  };
}

function seedSpecialist({ name, skill, centerId = null, avatar = '', login = null }) {
  return {
    id: uid(),
    name,
    skill,
    centerId,
    avatar,
    login
  };
}

const seedCenters = [];

const seedSpecialists = [];

const DEFAULT_DATA = {
  users: [
    { username: 'unity-admin', password: 'Admin123!', name: 'UnitySphere Admin', role: 'main-admin', email: 'admin@unitysphere.test' }
  ],
  centers: seedCenters,
  specialists: seedSpecialists,
  modules: [
    { id: uid(), title: 'Balance Training 1', category: 'Rehab', durationMin: 15 }
  ],
  assessments: []
};

// ---- persistence ----
function loadData() {
  if (!storageAvailable) return clone(DEFAULT_DATA);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { saveData(DEFAULT_DATA); return clone(DEFAULT_DATA); }
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || clone(DEFAULT_DATA.users),
      centers: parsed.centers || [],
      specialists: parsed.specialists || [],
      modules: parsed.modules || [],
      assessments: parsed.assessments || []
    };
  } catch {
    return clone(DEFAULT_DATA);
  }
}
function saveData(data){
  if (!storageAvailable) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}
function normalizeCenterLogin(center) {
  if (!center) return null;
  if (!center.login && (center.centerUsername || center.centerPassword)) {
    center.login = {
      username: center.centerUsername || '',
      password: center.centerPassword || ''
    };
  }
  if (!center.login) return null;
  center.login = {
    username: (center.login.username || '').trim(),
    password: center.login.password || ''
  };
  if (!center.login.username) {
    center.login = null;
  }
  return center.login;
}
function normalizeSpecialistLogin(specialist) {
  if (!specialist) return null;
  if (!specialist.login && (specialist.username || specialist.password)) {
    specialist.login = {
      username: specialist.username || '',
      password: specialist.password || ''
    };
    delete specialist.username;
    delete specialist.password;
  }
  if (!specialist.login) return null;
  specialist.login = {
    username: (specialist.login.username || '').trim(),
    password: specialist.login.password || ''
  };
  if (!specialist.login.username) {
    specialist.login = null;
  }
  return specialist.login;
}
function upsertUser(user) {
  if (!user || !user.username) return;
  db.users = Array.isArray(db.users) ? db.users : [];
  const key = user.username.toLowerCase();
  const existing = db.users.find(u => u.username && u.username.toLowerCase() === key);
  if (existing) {
    Object.assign(existing, user);
  } else {
    db.users.push(user);
  }
}
function removeUserByUsername(username) {
  if (!username) return;
  const key = username.toLowerCase();
  db.users = (db.users || []).filter(u => !u.username || u.username.toLowerCase() !== key);
}
function syncUsersWithEntities() {
  db.users = Array.isArray(db.users) ? db.users.filter(Boolean) : [];
  db.centers = Array.isArray(db.centers) ? db.centers : [];
  db.specialists = Array.isArray(db.specialists) ? db.specialists : [];

  const userLookup = new Map();
  db.users.forEach(u => {
    if (u && u.username) {
      userLookup.set(u.username.toLowerCase(), u);
    }
  });

  db.centers.forEach(center => {
    const login = normalizeCenterLogin(center);
    if (!login || !login.username) return;
    const key = login.username.toLowerCase();
    const payload = {
      username: login.username,
      password: login.password || '',
      role: 'center-admin',
      centerId: center.id,
      name: center.name ? `${center.name} Admin` : 'Center Admin'
    };
    if (userLookup.has(key)) {
      Object.assign(userLookup.get(key), payload);
    } else {
      db.users.push(payload);
      userLookup.set(key, payload);
    }
  });

  const specialistUsers = new Set();
  db.specialists.forEach(spec => {
    const login = normalizeSpecialistLogin(spec);
    if (!login || !login.username) return;
    const key = login.username.toLowerCase();
    const payload = {
      username: login.username,
      password: login.password || '',
      role: 'specialist',
      centerId: spec.centerId || null,
      name: spec.name || login.username
    };
    if (userLookup.has(key)) {
      Object.assign(userLookup.get(key), payload);
    } else {
      db.users.push(payload);
      userLookup.set(key, payload);
    }
    specialistUsers.add(key);
  });

  db.users = db.users.filter(user => {
    if (!user || !user.username) return false;
    if (user.role === 'center-admin') {
      return db.centers.some(center => center.id === user.centerId);
    }
    if (user.role === 'specialist') {
      return specialistUsers.has(user.username.toLowerCase());
    }
    return true;
  });
}
const db = loadData();
syncUsersWithEntities();

// ---- routing ----
function isLoginPage(){ return location.pathname.endsWith('index.html') || !location.pathname.includes('.html'); }
function isDashboardPage(){ return location.pathname.endsWith('dashboard.html'); }

// ---- tiny DOM helpers ----
const qs = (s)=>document.querySelector(s);
const qsa = (s)=>[...document.querySelectorAll(s)];
const qi = (id)=>document.getElementById(id);
function el(tag, attrs={}, ...kids){
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k==='class') n.className = v;
    else if (k==='style') Object.assign(n.style, v);
    else n.setAttribute(k,v);
  });
  kids.forEach(k => n.append(k));
  return n;
}
function esc(s){return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));}

// ================= AUTH =================
if (isLoginPage()) {
  const form = qi('auth-form');
  const userI = qi('auth-username');
  const passI = qi('auth-password');

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const u = (userI.value||'').trim().toLowerCase();
    const p = passI.value||'';
    const user = (db.users||[]).find(x=>x.username && x.username.toLowerCase()===u && x.password===p);
    if (!user) { alert('Invalid credentials'); return; }
    if (!['main-admin','center-admin'].includes(user.role)) { alert('Access restricted to admin accounts.'); return; }
    sessionStorage.setItem('us_username', user.username);
    sessionStorage.setItem('us_name', user.name || user.username);
    sessionStorage.setItem('us_email', user.email || '');
    sessionStorage.setItem('us_role', user.role);
    if (user.role === 'center-admin' && user.centerId) {
      sessionStorage.setItem('us_center', user.centerId);
    } else {
      sessionStorage.removeItem('us_center');
    }
    location.href = 'dashboard.html';
  });
}

// ================= DASHBOARD =================
if (isDashboardPage()) {
  // guard
  const username = sessionStorage.getItem('us_username');
  if (!username) location.href = 'index.html';

  const name = sessionStorage.getItem('us_name');
  const email = sessionStorage.getItem('us_email');
  const role = sessionStorage.getItem('us_role') || 'main-admin';
  const centerIdForRole = sessionStorage.getItem('us_center');
  qi('sidebar-name').textContent = name || username;
  qi('sidebar-email').textContent = email || '—';
  qi('user-name').textContent = name || username;
  const userRoleLabel = role === 'center-admin' ? 'Center admin' : 'Main admin';
  const roleEl = qi('user-role');
  if (roleEl) roleEl.textContent = userRoleLabel;
  const isCenterAdmin = role === 'center-admin';
  const centersForRole = () => (isCenterAdmin && centerIdForRole) ? db.centers.filter(c => c.id === centerIdForRole) : db.centers;
  const specialistsForRole = () => (isCenterAdmin && centerIdForRole) ? db.specialists.filter(s => s.centerId === centerIdForRole) : db.specialists;
  const modulesForRole = () => db.modules;
  const assessmentsForRole = () => {
    if (!isCenterAdmin || !centerIdForRole) return db.assessments;
    const allowed = new Set(specialistsForRole().map(s => s.id));
    return db.assessments.filter(a => allowed.has(a.specialistId));
  };
  const accessibleSections = isCenterAdmin ? ['overview','centers','specialists'] : ['overview','centers','specialists','modules','assessments'];
  if (isCenterAdmin) {
    const hint = qi('specialist-form-hint');
    if (hint) hint.textContent = 'Add new specialists for your center and share their login credentials.';
  }

  const hour = new Date().getHours();
  qi('greeting').textContent = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const avatar = 'https://i.pravatar.cc/150?u=admin';
  ['header-avatar','sidebar-avatar'].forEach(id=>{
    const el = qi(id); el.style.backgroundImage = `url(${avatar})`; el.style.backgroundSize='cover'; el.style.backgroundPosition='center';
  });

  qi('logout').addEventListener('click', ()=>{
    ['us_username','us_name','us_email','us_role','us_center'].forEach(k=>sessionStorage.removeItem(k));
    location.href = 'index.html';
  });

  // nav
  const setSectionTitle = (btn)=>{
    const label = btn.querySelector('span')?.textContent.trim() || btn.textContent.trim();
    qi('section-title').textContent = label;
  };

  qsa('.sidebar-nav .nav-link').forEach(btn=>{
    const key = btn.dataset.section;
    const allowed = accessibleSections.includes(key);
    btn.classList.toggle('hidden', !allowed);
  });
  qsa('main .section').forEach(sec=>{
    const key = sec.id.replace('section-','');
    const allowed = accessibleSections.includes(key);
    sec.classList.toggle('hidden', !allowed);
  });

  qsa('.sidebar-nav .nav-link').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      qsa('.sidebar-nav .nav-link').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.section;
      qsa('main .section').forEach(sec=>sec.classList.remove('active'));
      qi(`section-${key}`).classList.add('active');
      setSectionTitle(btn);
      if (key === 'specialists' || key === 'assessments') refreshSelectors();
      refreshStats();
    });
  });

  let initialNav = qs('.sidebar-nav .nav-link.active');
  if (!initialNav || initialNav.classList.contains('hidden')) {
    const defaultKey = accessibleSections[0];
    if (defaultKey) {
      qsa('.sidebar-nav .nav-link').forEach(b=>b.classList.remove('active'));
      initialNav = qs(`.sidebar-nav .nav-link[data-section="${defaultKey}"]`);
      if (initialNav) initialNav.classList.add('active');
      qsa('main .section').forEach(sec=>{
        sec.classList.toggle('active', sec.id === `section-${defaultKey}`);
      });
    }
  }
  if (initialNav) setSectionTitle(initialNav);

  // ---------- Centers ----------
  const addPanel = qi('add-center-panel');
  const toggleBtn = qi('btn-toggle-add-center');
  const cancelBtn = qi('btn-cancel-center');
  const centerForm = qi('form-center');
  if (addPanel && toggleBtn) {
    if (isCenterAdmin) {
      addPanel.classList.add('hidden');
      toggleBtn.classList.add('hidden');
      cancelBtn?.classList.add('hidden');
    } else {
      const defaultOpenLabel = toggleBtn.dataset.labelOpen || toggleBtn.textContent.trim();
      const defaultCloseLabel = toggleBtn.dataset.labelClose || 'Close form';
      const labelEl = toggleBtn.querySelector('.label');
      const updateToggleLabel = (text)=>{
        if (labelEl) {
          labelEl.textContent = text;
        } else {
          toggleBtn.textContent = text;
        }
      };
      const setToggleState = (isOpen)=>{
        addPanel.classList.toggle('active', isOpen);
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
        toggleBtn.classList.toggle('is-open', isOpen);
        updateToggleLabel(isOpen ? defaultCloseLabel : defaultOpenLabel);
      };
      setToggleState(false);
      toggleBtn.addEventListener('click', ()=>{
        const isOpen = !addPanel.classList.contains('active');
        setToggleState(isOpen);
        if (isOpen) {
          addPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      cancelBtn?.addEventListener('click', ()=>{
        setToggleState(false);
      });

      centerForm?.addEventListener('submit', e=>{
        e.preventDefault();
        const name = qi('center-name').value.trim();
        const location = qi('center-location').value.trim();
        const image = qi('center-image').value.trim();
        const desc = qi('center-desc').value.trim();
        const tags = (qi('center-tags').value||'').split(',').map(s=>s.trim()).filter(Boolean);
        const loginUsername = qi('center-username').value.trim();
        const loginPassword = qi('center-password').value.trim();
        const posX = parseFloat(qi('center-posx').value);
        const posY = parseFloat(qi('center-posy').value);
        if (!name || !loginUsername || !loginPassword) return;
        // prevent duplicate usernames
        const usernameTaken = (db.users || []).some(
          u => u.username && u.username.toLowerCase() === loginUsername.toLowerCase()
        );
        if (usernameTaken) {
          alert('This center username is already in use. Choose another username.');
          return;
        }
        const centerId = uid();
        db.centers.push({
          id: centerId, name, location, image, desc, tags,
          login: { username: loginUsername, password: loginPassword },
          posX: isFinite(posX)? posX : Math.round(20 + Math.random()*60),
          posY: isFinite(posY)? posY : Math.round(30 + Math.random()*40)
        });
        upsertUser({ username: loginUsername, password: loginPassword, role: 'center-admin', centerId, name: name ? `${name} Admin` : loginUsername });
        persistAndRender();
        e.target.reset();
        setToggleState(false);
      });
    }
  }

  const exportBtn = qi('btn-export-centers');
  if (exportBtn) {
    exportBtn.classList.toggle('hidden', isCenterAdmin);
    exportBtn.addEventListener('click', ()=>{
      const out = centersForRole().map(({id, ...rest})=>rest);
      const blob = new Blob([JSON.stringify(out,null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='centers.json'; a.click();
      URL.revokeObjectURL(url);
    });
  }

  function renderCenters(){
    const centers = centersForRole();
    const totalCenters = centers.length;
    const loginReady = centers.filter(c=>{
      const login = c.login || {};
      return Boolean((login.username || c.centerUsername) && (login.password || c.centerPassword));
    }).length;
    const capabilityCounts = new Map();
    const locationSet = new Set();

    centers.forEach(c=>{
      (c.tags || []).forEach(tag=>{
        const clean = tag && tag.trim();
        if (!clean) return;
        const key = clean.toLowerCase();
        const existing = capabilityCounts.get(key);
        if (existing) existing.count += 1;
        else capabilityCounts.set(key, { label: clean, count: 1 });
      });
      const loc = c.location && c.location.trim();
      if (loc) locationSet.add(loc);
    });

    const totalEl = qi('centers-total'); if (totalEl) totalEl.textContent = totalCenters;
    const readyEl = qi('center-login-ready'); if (readyEl) readyEl.textContent = totalCenters ? `${loginReady}/${totalCenters}` : loginReady;
    const capabilityCountEl = qi('center-capability-count'); if (capabilityCountEl) capabilityCountEl.textContent = capabilityCounts.size;
    const locationCountEl = qi('center-location-count'); if (locationCountEl) locationCountEl.textContent = locationSet.size;

    const capPills = qi('center-capability-pills');
    if (capPills) {
      capPills.innerHTML = '';
      const caps = [...capabilityCounts.values()];
      if (caps.length === 0) {
        capPills.append(el('span', { class: 'pill small' }, 'No capabilities logged yet'));
      } else {
        caps
          .sort((a,b)=> b.count - a.count || a.label.localeCompare(b.label))
          .slice(0,6)
          .forEach(({label,count})=>{
            capPills.append(el('span', { class: 'pill small' }, `${label} (${count})`));
          });
      }
    }

    // map pins
    const map = qi('map-pins'); map.innerHTML = '';
    centers.forEach(c=>{
      const pin = el('div', { class:'map-pin', style:{ left:c.posX+'%', top:c.posY+'%' } },
        el('span', {}, c.name)
      );
      map.append(pin);
    });

    // cards
    const grid = qi('centers-grid'); grid.innerHTML = '';
    centers.forEach(c=>{
      const card = el('article', {class:'center-card'});
      const img = el('img', {src: c.image || 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?q=80&w=1600&auto=format&fit=crop', alt:c.name});
      const body = el('div', {class:'card-body'},
        el('div', {class:'title'}, c.name),
        el('div', {class:'place muted'}, `📍 ${c.location || 'Not specified'}`),
        el('div', {class:'desc muted'}, c.desc || 'Awaiting description'),
        el('div', {class:'tag-row'},
          ...(c.tags && c.tags.length ? c.tags : ['General']).map(t=> el('span', {class:'tag'}, t))
        )
      );
      const login = c.login || { username: c.centerUsername, password: c.centerPassword } || {};
      const credentials = el('div',{class:'center-credentials'},
        el('span',{class:'badge badge-soft'}, login && login.username ? `Login: ${login.username}` : 'Login pending')
      );
      if (login && login.password) {
        credentials.append(el('span',{class:'pill'}, login.password));
      }
// current list of specialists for this center
const centerSpecialists = db.specialists.filter(s => s.centerId === c.id);

// build the list (or an empty state)
const rosterList = centerSpecialists.length
  ? el('ul', { class: 'center-roster-list' },
      ...centerSpecialists.map(s => {
        const loginInfo = normalizeSpecialistLogin(s);
        return el('li', {},
          el('strong', {}, s.name),
          el('span', { class: 'role muted' }, s.skill || '—'),
          loginInfo && loginInfo.username
            ? el('div', { class: 'login-pill' },
                el('span', { class: 'badge badge-soft' }, `Login: ${loginInfo.username}`),
                loginInfo.password ? el('span', { class: 'pill small' }, loginInfo.password) : null
              )
            : null
        );
      })
    )
  : el('div', { class: 'muted center-roster-empty' }, 'No specialists assigned yet.');

// toggle button
const rosterToggle = el('button', { class: 'ghost', 'aria-expanded': 'true' }, 'Hide specialists');
rosterToggle.addEventListener('click', () => {
  const hidden = rosterList.classList.toggle('hidden');
  rosterToggle.setAttribute('aria-expanded', String(!hidden));
  rosterToggle.textContent = hidden ? 'Show specialists' : 'Hide specialists';
});

// header + roster container
const rosterHeader = el('div', { class: 'center-roster-header' },
  el('span', {}, 'Specialists'),
  el('span', { class: 'hint' },
    centerSpecialists.length
      ? `${centerSpecialists.length} ${centerSpecialists.length === 1 ? 'specialist' : 'specialists'}`
      : 'No specialists'
  ),
  rosterToggle
);

// final roster block
const roster = el('div', { class: 'center-roster' }, rosterHeader, rosterList);

      const footerActions = [credentials];
      if (!isCenterAdmin) {
        footerActions.push((()=>{ const b=el('button',{class:'primary ghost'},"Delete"); b.addEventListener('click',()=>{
          const loginDetails = normalizeCenterLogin(c);
          if (loginDetails && loginDetails.username) removeUserByUsername(loginDetails.username);
          db.specialists = db.specialists.map(s => s.centerId === c.id ? { ...s, centerId: null } : s);
          db.centers = db.centers.filter(x=>x.id!==c.id);
          persistAndRender();
        }); return b; })());
      }
      const footer = el('footer', {class:'center-footer'}, ...footerActions);
      card.append(img, body, roster, footer);
      grid.append(card);
    });

    if (!centers.length) {
      grid.append(el('div', { class: 'empty-state' }, 'No centers yet. Use “Add New Center” to start your network.'));
    }
  }

  // ---------- Specialists ----------
  const specialistForm = qi('form-specialist');
  specialistForm?.addEventListener('submit', e=>{
    e.preventDefault();
    const name = qi('spec-name').value.trim();
    const skill = qi('spec-skill').value.trim();
    let centerId = qi('spec-center').value || null;
    const avatar = qi('spec-avatar').value.trim();
    const loginUsername = qi('spec-username').value.trim();
    const loginPassword = qi('spec-password').value.trim();
    if (isCenterAdmin) {
      if (!centerIdForRole) { alert('Your center assignment is missing. Contact the main admin.'); return; }
      centerId = centerIdForRole;
    }
    if (!name || !loginUsername || !loginPassword) { alert('Please provide a name and login credentials for the specialist.'); return; }
    const existingUser = (db.users || []).some(u => u.username && u.username.toLowerCase() === loginUsername.toLowerCase());
    if (existingUser) { alert('This username is already in use. Choose another username.'); return; }
    const specialistId = uid();
    db.specialists.push({ id: specialistId, name, skill, centerId, avatar, login: { username: loginUsername, password: loginPassword } });
    upsertUser({ username: loginUsername, password: loginPassword, role: 'specialist', centerId, name });
    persistAndRender();
    e.target.reset();
    if (isCenterAdmin) {
      const centerSelect = qi('spec-center');
      if (centerSelect) centerSelect.value = centerIdForRole;
    }
  });

  function renderSpecialists(){
    const grid = qi('specialists-grid'); grid.innerHTML='';
    const specialists = specialistsForRole();
    let assigned = 0;
    const focusCounts = new Map();

    specialists.forEach(s=>{
      const centerName = db.centers.find(c=>c.id===s.centerId)?.name || '—';
      if (s.centerId) assigned += 1;
      const focusKey = (s.skill && s.skill.trim()) ? s.skill.trim() : 'Generalist';
      focusCounts.set(focusKey, (focusCounts.get(focusKey) || 0) + 1);
      const card = el('div',{class:'specialist-card'});
      const avatarEl = (()=>{const a=el('div',{class:'avatar'}); if (s.avatar){ a.style.backgroundImage=`url(${s.avatar})`; a.style.backgroundSize='cover'; a.style.backgroundPosition='center'; } return a; })();
      const loginInfo = normalizeSpecialistLogin(s);
      const deleteBtn = el('button',{class:'primary ghost'},"Delete");
      deleteBtn.addEventListener('click',()=>{
        if (loginInfo && loginInfo.username) removeUserByUsername(loginInfo.username);
        db.specialists = db.specialists.filter(x=>x.id!==s.id);
        db.assessments = db.assessments.filter(a=>a.specialistId!==s.id);
        persistAndRender();
      });
      card.append(
        avatarEl,
        el('strong',{}, s.name),
        el('p',{}, s.skill || '—'),
        el('span',{class:'badge badge-soft'}, centerName)
      );
      if (loginInfo && loginInfo.username) {
        card.append(
          el('div',{class:'specialist-credentials'},
            el('span',{class:'badge badge-soft'}, `Login: ${loginInfo.username}`),
            loginInfo.password ? el('span',{class:'pill'}, loginInfo.password) : null
          )
        );
      }
      card.append(deleteBtn);
      grid.append(card);
    });

    if (!specialists.length) {
      grid.append(el('div', { class: 'empty-state' }, 'No specialists registered yet. Add your first expert above.'));
    }

    const total = specialists.length;
    const totalEl = qi('specialists-total'); if (totalEl) totalEl.textContent = total;
    const assignedEl = qi('specialists-assigned'); if (assignedEl) assignedEl.textContent = assigned;
    const unassignedEl = qi('specialists-unassigned'); if (unassignedEl) unassignedEl.textContent = Math.max(total - assigned, 0);
    const coverageEl = qi('specialists-coverage'); if (coverageEl) {
      const coverage = total ? Math.round((assigned / total) * 100) : 0;
      coverageEl.textContent = total ? `Center coverage — ${coverage}% (${assigned}/${total})` : 'Center coverage — 0%';
    }

    const focusWrap = qi('specialist-focus-pills');
    if (focusWrap) {
      focusWrap.innerHTML = '';
      if (!focusCounts.size) {
        focusWrap.append(el('span', { class: 'pill small' }, 'No focus areas yet'));
      } else {
        [...focusCounts.entries()]
          .sort((a,b)=>b[1]-a[1])
          .slice(0,6)
          .forEach(([label,count])=>{
            focusWrap.append(el('span', { class: 'pill small' }, `${label} (${count})`));
          });
      }
    }
  }

  /* ---------- Specialists dropdown & toggle card (fixed) ---------- */
  function initSpecialistsPicker() {
    const sel = qi('specialist-select');        // element IDs (no # because qi gets by id)
    const details = qi('specialist-details');
    if (!sel || !details) return;

    const centerName = id => (db.centers || []).find(c => c.id === id)?.name || '—';
    const label = s => {
      const n = s.name || s.login?.username || 'Unnamed';
      const t = s.skill || s.role || '';
      return t ? `${n} (${t})` : n;
    };

    function populate(selectedId) {
      const keep = selectedId ?? sel.value;
      sel.innerHTML = '<option value="">Select specialist…</option>';
      (specialistsForRole() || []).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = label(s);
        if (keep && keep === s.id) opt.selected = true;
        sel.appendChild(opt);
      });
    }

    function render(id) {
      if (!id) {
        details.classList.remove('active');
        details.style.display = 'none';
        details.innerHTML = '';
        return;
      }
      const s = (db.specialists || []).find(x => x.id === id);
      if (!s) return;

      const login = normalizeSpecialistLogin(s);
      const loginUser = login?.username || '—';
      const loginPass = login?.password || '—';

      details.style.display = 'block';
      details.classList.add('active');
      details.innerHTML = `
        <div class="card-header" style="padding:12px 16px;">
          <div>
            <h3 style="margin:0">${s.name || loginUser || 'Unnamed'}</h3>
            <p class="hint" style="margin-top:4px">${s.skill || '—'} · Center: ${centerName(s.centerId)}</p>
          </div>
          <div class="card-actions">
            <button id="btn-toggle-spec-creds" class="ghost" aria-expanded="false">Show credentials</button>
          </div>
        </div>
        <div id="spec-creds" class="collapsible" style="padding:12px 16px;">
          <div class="pill">Login: ${loginUser}</div>
          <div class="pill" style="margin-top:6px;">${loginPass}</div>
        </div>
        <div style="padding:0 16px 12px;">
          <button class="ghost" id="btn-back-spec">Back</button>
        </div>
      `;

      const creds = qi('spec-creds');
      const toggleBtn = qi('btn-toggle-spec-creds');
      toggleBtn?.addEventListener('click', () => {
        const open = creds.classList.toggle('active');
        toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggleBtn.textContent = open ? 'Hide credentials' : 'Show credentials';
      });

      qi('btn-back-spec')?.addEventListener('click', () => {
        sel.value = '';
        render(null);
      });
    }

    sel.addEventListener('change', () => render(sel.value || null));
    populate();
    render(null);

    // refresh hook after DB changes
    window.__refreshSpecPicker = () => {
      const cur = sel.value;
      populate(cur);
      render(cur || null);
    };
  }

  // ---------- Modules ----------
  qi('form-module').addEventListener('submit', e=>{
    e.preventDefault();
    const title = qi('mod-title').value.trim();
    const category = qi('mod-category').value.trim();
    const dur = parseInt(qi('mod-duration').value||'0',10) || null;
    if (!title) return;
    db.modules.push({ id: uid(), title, category, durationMin: dur });
    persistAndRender();
    e.target.reset();
  });

  function renderModules(){
    const modules = modulesForRole();
    const grid = qi('modules-grid'); grid.innerHTML='';
    const categoryCounts = new Map();
    const durations = [];

    modules.forEach(m=>{
      const card = el('div',{class:'module-card'},
        el('header',{}, el('strong',{}, m.title), el('span',{class:'tag'}, m.category || '—')),
        el('div',{class:'module-meta'},
          el('span',{}, '⏱ ', (m.durationMin? `${m.durationMin} min`:'—'))
        ),
        (()=>{ const b=el('button',{class:'primary ghost'},"Delete"); b.addEventListener('click',()=>{ db.modules = db.modules.filter(x=>x.id!==m.id); db.assessments = db.assessments.filter(a=>a.moduleId!==m.id); persistAndRender(); }); return b; })()
      );
      grid.append(card);

      const cleanCategory = (m.category && m.category.trim()) ? m.category.trim() : 'Uncategorized';
      const catKey = cleanCategory.toLowerCase();
      const existing = categoryCounts.get(catKey);
      if (existing) existing.count += 1;
      else categoryCounts.set(catKey, { label: cleanCategory, count: 1 });
      if (typeof m.durationMin === 'number' && !isNaN(m.durationMin) && m.durationMin > 0) {
        durations.push(m.durationMin);
      }
    });

    if (!modules.length) {
      grid.append(el('div', { class: 'empty-state' }, 'No modules yet. Add immersive content to build your library.'));
    }

    const total = modules.length;
    const totalEl = qi('modules-total'); if (totalEl) totalEl.textContent = total;
    const avgEl = qi('modules-avg-duration'); if (avgEl) {
      avgEl.textContent = durations.length ? `${Math.round(durations.reduce((a,b)=>a+b,0)/durations.length)} min` : '—';
    }
    const catCountEl = qi('modules-category-count'); if (catCountEl) catCountEl.textContent = categoryCounts.size;

    const catWrap = qi('module-category-pills');
    if (catWrap) {
      catWrap.innerHTML = '';
      if (!categoryCounts.size) {
        catWrap.append(el('span', { class: 'pill small' }, 'No categories yet'));
      } else {
        [...categoryCounts.values()]
          .sort((a,b)=>b.count - a.count || a.label.localeCompare(b.label))
          .slice(0,6)
          .forEach(({label,count})=>{
            catWrap.append(el('span', { class: 'pill small' }, `${label} (${count})`));
          });
      }
    }
  }

  // ---------- Assessments ----------
  qi('form-assessment').addEventListener('submit', e=>{
    e.preventDefault();
    const trainee = qi('ass-trainee').value.trim();
    const moduleId = qi('ass-module').value;
    const specialistId = qi('ass-specialist').value;
    const score = parseFloat(qi('ass-score').value || '0');
    const date = qi('ass-date').value || new Date().toISOString().slice(0,10);
    if (!trainee || !moduleId || !specialistId) return;
    if (isCenterAdmin) {
      const allowedIds = new Set(specialistsForRole().map(s => s.id));
      if (!allowedIds.has(specialistId)) { alert('You can only log assessments for specialists at your center.'); return; }
    }
    db.assessments.push({ id: uid(), trainee, moduleId, specialistId, score, date });
    persistAndRender();
    e.target.reset();
  });

  function renderAssessments(){
    const list = qi('assessments-list'); list.innerHTML='';
    const assessments = assessmentsForRole();
    const scoreValues = [];
    const moduleHitMap = new Map();
    let latestDate = '';
    const formatDate = (value)=>{
      if (!value) return '—';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    assessments.forEach(a=>{
      const m = db.modules.find(x=>x.id===a.moduleId);
      const s = db.specialists.find(x=>x.id===a.specialistId);
      if (!isNaN(a.score)) scoreValues.push(a.score);
      if (a.date) {
        if (!latestDate || a.date > latestDate) latestDate = a.date;
      }
      if (a.moduleId) {
        moduleHitMap.set(a.moduleId, (moduleHitMap.get(a.moduleId) || 0) + 1);
      }
      const row = el('div',{class:'recommendation'},
        el('div',{}, '👤'),
        el('div',{},
          el('strong',{}, a.trainee),
          el('div',{class:'hint'}, (m? m.title:'—') + ' • ' + (s? s.name:'—')),
          el('div',{}, el('span',{class:'pill'}, 'Score: '+(isNaN(a.score)?'—':`${a.score}%`)), ' ', el('span',{class:'pill'}, formatDate(a.date)))
        ),
        (()=>{ const b=el('button',{class:'primary ghost'},"Delete"); b.addEventListener('click',()=>{ db.assessments = db.assessments.filter(x=>x.id!==a.id); persistAndRender(); }); return b; })()
      );
      list.append(row);
    });

    if (!assessments.length) {
      list.append(el('div', { class: 'empty-state' }, 'No assessments logged yet. Capture the first outcome above.'));
    }

    const total = assessments.length;
    const totalEl = qi('assessments-total'); if (totalEl) totalEl.textContent = total;
    const avgEl = qi('assessments-average'); if (avgEl) {
      avgEl.textContent = scoreValues.length ? `${Math.round(scoreValues.reduce((a,b)=>a+b,0)/scoreValues.length)}%` : '—';
    }
    const lastEl = qi('assessments-last-date'); if (lastEl) lastEl.textContent = formatDate(latestDate);
    const topModuleEl = qi('assessments-top-module');
    if (topModuleEl) {
      if (!moduleHitMap.size) {
        topModuleEl.textContent = '—';
      } else {
        const [moduleId] = [...moduleHitMap.entries()].sort((a,b)=>b[1]-a[1])[0];
        const moduleName = db.modules.find(m=>m.id===moduleId)?.title || '—';
        topModuleEl.textContent = moduleName;
      }
    }
  }

  // selectors + stats
  function refreshSelectors(){
    const centerSelect = qi('spec-center');
    if (centerSelect) {
      const centers = centersForRole();
      centerSelect.innerHTML = `<option value="">— No center —</option>` + centers.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
      if (isCenterAdmin) {
        centerSelect.value = centerIdForRole || '';
        centerSelect.disabled = true;
        centerSelect.classList.add('readonly');
        centerSelect.closest('.input-group')?.classList.add('readonly');
      } else {
        centerSelect.disabled = false;
        centerSelect.classList.remove('readonly');
        centerSelect.closest('.input-group')?.classList.remove('readonly');
      }
    }

    const moduleSelect = qi('ass-module');
    if (moduleSelect) {
      const modules = modulesForRole();
      moduleSelect.innerHTML = modules.length ? modules.map(m=>`<option value="${m.id}">${esc(m.title)}</option>`).join('') : '<option value="">No modules available</option>';
      moduleSelect.disabled = !modules.length;
    }

    const specialistSelect = qi('ass-specialist');
    if (specialistSelect) {
      const specialists = specialistsForRole();
      specialistSelect.innerHTML = specialists.length ? specialists.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('') : '<option value="">No specialists</option>';
      specialistSelect.disabled = !specialists.length;
    }
  }
  function refreshStats(){
    qi('stat-centers').textContent = centersForRole().length;
    qi('stat-specialists').textContent = specialistsForRole().length;
    qi('stat-modules').textContent = modulesForRole().length;
    qi('stat-assessments').textContent = assessmentsForRole().length;
  }

  function renderAll(){
    renderCenters();
    renderSpecialists();
    renderModules();
    renderAssessments();
    refreshSelectors();
    refreshStats();
  }
  function persistAndRender(){
    syncUsersWithEntities();
    saveData(db);
    renderAll();
    window.__refreshSpecPicker?.();
  }

  // init picker + initial render
  initSpecialistsPicker();
  renderAll();
}

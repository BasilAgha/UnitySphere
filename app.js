// ===== UnitySphere Admin (client-side) =====

const STORAGE_KEY = 'unitysphere-data-v3';
const storageAvailable = typeof localStorage !== 'undefined';

function uid(){ return Math.random().toString(36).slice(2,10); }
function clone(x){ return JSON.parse(JSON.stringify(x)); }

const DEFAULT_DATA = {
  users: [
    { username: 'unity-admin', password: 'Admin123!', name: 'UnitySphere Admin', role: 'main-admin', email: 'admin@unitysphere.test' }
  ],
  centers: [
    { id: uid(), name: 'Cogniplay City Center', location: 'Riyadh, KSA',
      desc: 'Immersive neurodevelopmental therapy',
      tags: ['Cognitive Focus','Sensory Regulation'],
      image: 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?q=80&w=1600&auto=format&fit=crop',
      posX: 28, posY: 52,
      login: { username: 'center-riyadh', password: 'Center123!' }
    },
    { id: uid(), name: 'NeuroConnect Hub', location: 'Jeddah, KSA',
      desc: 'Executive function and language',
      tags: ['Executive Function','Language Labs'],
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600&auto=format&fit=crop',
      posX: 58, posY: 68,
      login: { username: 'center-jeddah', password: 'Connect@2024' }
    },
    { id: uid(), name: 'Innovata Wellness Center', location: 'Dubai, UAE',
      desc: 'Sensory integration & family coaching',
      tags: ['Sensory Gym','Family Coaching'],
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1600&auto=format&fit=crop',
      posX: 74, posY: 45,
      login: { username: 'center-dubai', password: 'Innovata!9' }
    },
    { id: uid(), name: 'Cortex Meadow Clinic', location: 'Doha, Qatar',
      desc: 'Motor planning & regulation',
      tags: ['Motor Metrics','Calm Transitions'],
      image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop',
      posX: 82, posY: 40,
      login: { username: 'center-doha', password: 'Cortex!2024' }
    }
  ],
  specialists: [
    { id: uid(), name: 'Dr. Noor Al-Fahad', skill: 'PT', centerId: null, avatar: '' }
  ],
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
const db = loadData();

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
    const user = (db.users||[]).find(x=>x.username.toLowerCase()===u && x.password===p);
    if (!user) { alert('Invalid credentials'); return; }
    if (user.role !== 'main-admin') { alert('Only main-admin can sign in here.'); return; }
    sessionStorage.setItem('us_username', user.username);
    sessionStorage.setItem('us_name', user.name || user.username);
    sessionStorage.setItem('us_email', user.email || '');
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
  qi('sidebar-name').textContent = name || username;
  qi('sidebar-email').textContent = email || '—';
  qi('user-name').textContent = name || username;

  const hour = new Date().getHours();
  qi('greeting').textContent = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const avatar = 'https://i.pravatar.cc/150?u=admin';
  ['header-avatar','sidebar-avatar'].forEach(id=>{
    const el = qi(id); el.style.backgroundImage = `url(${avatar})`; el.style.backgroundSize='cover'; el.style.backgroundPosition='center';
  });

  qi('logout').addEventListener('click', ()=>{
    ['us_username','us_name','us_email'].forEach(k=>sessionStorage.removeItem(k));
    location.href = 'index.html';
  });

  // nav
  qsa('.sidebar-nav .nav-link').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      qsa('.sidebar-nav .nav-link').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.section;
      qsa('main .section').forEach(sec=>sec.classList.remove('active'));
      qi(`section-${key}`).classList.add('active');
      qi('section-title').textContent = btn.textContent.trim();
      if (key === 'specialists' || key === 'assessments') refreshSelectors();
      refreshStats();
    });
  });

  // ---------- Centers ----------
  const addPanel = qi('add-center-panel');
  const toggleBtn = qi('btn-toggle-add-center');
  const cancelBtn = qi('btn-cancel-center');
  const toggleLabel = toggleBtn.textContent.trim();
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.addEventListener('click', ()=>{
    const isOpen = addPanel.classList.toggle('active');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    toggleBtn.textContent = isOpen ? 'Close form' : toggleLabel;
    if (isOpen) {
      addPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  cancelBtn.addEventListener('click', ()=>{
    addPanel.classList.remove('active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.textContent = toggleLabel;
  });

  qi('btn-export-centers').addEventListener('click', ()=>{
    const out = db.centers.map(({id, ...rest})=>rest);
    const blob = new Blob([JSON.stringify(out,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='centers.json'; a.click();
    URL.revokeObjectURL(url);
  });

  centerForm.addEventListener('submit', e=>{
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
    db.centers.push({
      id: uid(), name, location, image, desc, tags,
      login: { username: loginUsername, password: loginPassword },
      posX: isFinite(posX)? posX : Math.round(20 + Math.random()*60),
      posY: isFinite(posY)? posY : Math.round(30 + Math.random()*40)
    });
    persistAndRender();
    e.target.reset();
    addPanel.classList.remove('active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.textContent = toggleLabel;
  });

  function renderCenters(){
    // map pins
    const map = qi('map-pins'); map.innerHTML = '';
    db.centers.forEach(c=>{
      const pin = el('div', { class:'map-pin', style:{ left:c.posX+'%', top:c.posY+'%' } },
        el('span', {}, c.name)
      );
      map.append(pin);
    });

    // cards
    const grid = qi('centers-grid'); grid.innerHTML = '';
    db.centers.forEach(c=>{
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
      const footer = el('footer', {class:'center-footer'},
        credentials,
        (()=>{ const b=el('button',{class:'primary ghost'},"Delete"); b.addEventListener('click',()=>{ db.centers = db.centers.filter(x=>x.id!==c.id); persistAndRender(); }); return b; })()
      );
      card.append(img, body, footer);
      grid.append(card);
    });
  }

  // ---------- Specialists ----------
  qi('form-specialist').addEventListener('submit', e=>{
    e.preventDefault();
    const name = qi('spec-name').value.trim();
    const skill = qi('spec-skill').value.trim();
    const centerId = qi('spec-center').value || null;
    const avatar = qi('spec-avatar').value.trim();
    if (!name) return;
    db.specialists.push({ id: uid(), name, skill, centerId, avatar });
    persistAndRender();
    e.target.reset();
  });

  function renderSpecialists(){
    const grid = qi('specialists-grid'); grid.innerHTML='';
    db.specialists.forEach(s=>{
      const centerName = db.centers.find(c=>c.id===s.centerId)?.name || '—';
      const card = el('div',{class:'specialist-card'},
        (()=>{const a=el('div',{class:'avatar'}); if (s.avatar){ a.style.backgroundImage=`url(${s.avatar})`; a.style.backgroundSize='cover'; a.style.backgroundPosition='center'; } return a; })(),
        el('strong',{}, s.name),
        el('p',{}, s.skill || '—'),
        el('span',{class:'badge badge-soft'}, centerName),
        (()=>{ const b=el('button',{class:'primary ghost'},"Delete"); b.addEventListener('click',()=>{ db.specialists = db.specialists.filter(x=>x.id!==s.id); db.assessments = db.assessments.filter(a=>a.specialistId!==s.id); persistAndRender(); }); return b; })()
      );
      grid.append(card);
    });
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
    const grid = qi('modules-grid'); grid.innerHTML='';
    db.modules.forEach(m=>{
      const card = el('div',{class:'module-card'},
        el('header',{}, el('strong',{}, m.title), el('span',{class:'tag'}, m.category || '—')),
        el('div',{class:'module-meta'},
          el('span',{}, '⏱ ', (m.durationMin? `${m.durationMin} min`:'—'))
        ),
        (()=>{ const b=el('button',{class:'primary ghost'},"Delete"); b.addEventListener('click',()=>{ db.modules = db.modules.filter(x=>x.id!==m.id); db.assessments = db.assessments.filter(a=>a.moduleId!==m.id); persistAndRender(); }); return b; })()
      );
      grid.append(card);
    });
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
    db.assessments.push({ id: uid(), trainee, moduleId, specialistId, score, date });
    persistAndRender();
    e.target.reset();
  });

  function renderAssessments(){
    const list = qi('assessments-list'); list.innerHTML='';
    db.assessments.forEach(a=>{
      const m = db.modules.find(x=>x.id===a.moduleId);
      const s = db.specialists.find(x=>x.id===a.specialistId);
      const row = el('div',{class:'recommendation'},
        el('div',{}, '👤'),
        el('div',{},
          el('strong',{}, a.trainee),
          el('div',{class:'hint'}, (m? m.title:'—') + ' • ' + (s? s.name:'—')),
          el('div',{}, el('span',{class:'pill'}, 'Score: '+(isNaN(a.score)?'—':a.score)), ' ', el('span',{class:'pill'}, a.date || '—'))
        ),
        (()=>{ const b=el('button',{class:'primary ghost'},"Delete"); b.addEventListener('click',()=>{ db.assessments = db.assessments.filter(x=>x.id!==a.id); persistAndRender(); }); return b; })()
      );
      list.append(row);
    });
  }

  // selectors + stats
  function refreshSelectors(){
    qi('spec-center').innerHTML = `<option value="">— No center —</option>` + db.centers.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
    qi('ass-module').innerHTML = db.modules.map(m=>`<option value="${m.id}">${esc(m.title)}</option>`).join('');
    qi('ass-specialist').innerHTML = db.specialists.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
  }
  function refreshStats(){
    qi('stat-centers').textContent = db.centers.length;
    qi('stat-specialists').textContent = db.specialists.length;
    qi('stat-modules').textContent = db.modules.length;
    qi('stat-assessments').textContent = db.assessments.length;
  }

  function renderAll(){
    renderCenters();
    renderSpecialists();
    renderModules();
    renderAssessments();
    refreshSelectors();
    refreshStats();
  }
  function persistAndRender(){ saveData(db); renderAll(); }

  renderAll();
}

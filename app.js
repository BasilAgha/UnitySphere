// Small router helpers
const isLoginPage = location.pathname.endsWith('index.html') || !location.pathname.includes('.html');
const isDashboardPage = location.pathname.endsWith('dashboard.html');

// === Auth page logic ===
if (isLoginPage) {
  const authForm = document.getElementById('auth-form');
  const switchModeBtn = document.getElementById('switch-mode');
  const switchText = document.getElementById('switch-text');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const authAction = document.getElementById('auth-action');
  const confirmGroup = document.getElementById('confirm-password-group');
  const demoLoginBtn = document.getElementById('demo-login');

  const DEMO = { name: 'Demo User', email: 'demo@unitysphere.test', password: 'Demo123!' };

  // Prefill (optional)
  (function prefillDemo(){
    try {
      const nameInput = document.getElementById('auth-name');
      const emailInput = document.getElementById('auth-email');
      const passInput = document.getElementById('auth-password');
      if (nameInput && !nameInput.value) nameInput.value = DEMO.name;
      if (emailInput && !emailInput.value) emailInput.value = DEMO.email;
      if (passInput && !passInput.value) passInput.value = DEMO.password;
    } catch (_) {}
  })();

  let isSignUp = false;
  switchModeBtn.addEventListener('click', () => {
    isSignUp = !isSignUp;
    authTitle.textContent = isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول';
    authSubtitle.textContent = isSignUp ? 'أنشئ حسابًا لبدء المتابعة.' : 'أدخل بيانات الدخول.';
    authAction.textContent = isSignUp ? 'تسجيل' : 'دخول';
    switchText.textContent = isSignUp ? 'تمتلك حسابًا؟' : 'لا تملك حسابًا؟';
    switchModeBtn.textContent = isSignUp ? 'تسجيل الدخول' : 'إنشاء حساب';
    confirmGroup.classList.toggle('hidden', !isSignUp);
  });

  function completeLogin(name, email){
    sessionStorage.setItem('us_name', name);
    sessionStorage.setItem('us_email', email);
    // real page change (no scrolling hack)
    window.location.href = 'dashboard.html';
  }

  demoLoginBtn?.addEventListener('click', () => {
    completeLogin(DEMO.name, DEMO.email);
  });

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = authForm.elements['name'].value.trim();
    const email = authForm.elements['email'].value.trim();
    if (!name || !email) return;
    // (Here you would normally verify credentials against a backend.)
    completeLogin(name, email);
  });
}

// === Dashboard page logic ===
if (isDashboardPage) {
  // Guard: if no session, go back to login
  const userName = sessionStorage.getItem('us_name');
  if (!userName) { window.location.href = 'index.html'; }

  // DOM
  const dashboardSection = document.getElementById('dashboard');
  const breadcrumb = document.getElementById('breadcrumb');
  const userDisplay = document.getElementById('user-display');
  const overallScore = document.getElementById('overall-score');

  // Sidebar & nav
  const clientList = document.getElementById('client-list');
  const addClientBtn = document.getElementById('add-client');

  // Page sections
  const pageClients = document.getElementById('page-clients');
  const pageNew = document.getElementById('page-new');
  const pageHistory = document.getElementById('page-history');
  const pageSettings = document.getElementById('page-settings');
  const pages = { '#clients': pageClients, '#new': pageNew, '#history': pageHistory, '#settings': pageSettings };

  // Elements inside pages
  const clientTitle = document.getElementById('client-title');
  const sessionForm = document.getElementById('session-form');
  const activeClientInput = document.getElementById('active-client');
  const resetFormBtn = document.getElementById('reset-form');
  const goNewSessionBtn = document.getElementById('go-new-session');
  const goHistoryBtn = document.getElementById('go-history');
  const progressCanvas = document.getElementById('progress-canvas');
  const sessionsHistory = document.getElementById('sessions-history');

  // Pager
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');

  // Show user
  userDisplay.textContent = userName || '—';

  // ===== Demo data (same as before) =====
  // ...(keep your same clients array here)...
  const DEMO_CLIENTS = window.__clients || [];
  let clients = DEMO_CLIENTS.length ? DEMO_CLIENTS : [
    // (paste your same seed data from the previous file here)
  ];

  // -- helpers and computations (same as before) --
  const scoreFields = [ 'cognitiveAttention','cognitiveProblem','cognitiveMemory','cognitivePlanning','languageComprehension','languageExpression','languageSocial','socialEmotion','socialCooperation','socialRegulation','motorGross','motorFine','motorSensory','academicNumber','academicLanguage','academicApplication','executiveFlexibility','executiveInhibition','executivePersistence' ];

  const domainGroups = {
    cognitive: ['cognitiveAttention','cognitiveProblem','cognitiveMemory','cognitivePlanning'],
    language: ['languageComprehension','languageExpression','languageSocial'],
    social: ['socialEmotion','socialCooperation','socialRegulation'],
    motor: ['motorGross','motorFine','motorSensory'],
    academic: ['academicNumber','academicLanguage','academicApplication'],
    executive: ['executiveFlexibility','executiveInhibition','executivePersistence']
  };

  function average(session, keys) {
    const values = keys.map((key) => Number(session[key] || 0));
    return values.reduce((acc, val) => acc + val, 0) / values.length;
  }
  function computeDomainAverages(session) {
    const out = {};
    for (const [key, fields] of Object.entries(domainGroups)) out[key] = average(session, fields);
    out.overall = average(session, Object.values(domainGroups).flat());
    return out;
  }
  function updateOverallScore() {
    const client = clients.find((c) => c.id === activeClientInput.value);
    if (!client || client.sessions.length === 0) { overallScore.textContent = '—'; return; }
    const lastSession = client.sessions[client.sessions.length - 1];
    const domainScores = [
      average(lastSession, domainGroups.cognitive),
      average(lastSession, domainGroups.language),
      average(lastSession, domainGroups.social),
      average(lastSession, domainGroups.motor),
      average(lastSession, domainGroups.academic),
      average(lastSession, domainGroups.executive)
    ];
    const overall = domainScores.reduce((acc, v) => acc + v, 0) / domainScores.length;
    overallScore.textContent = overall.toFixed(2);
    overallScore.style.color = overall >= 4.5 ? '#22c55e' : overall >= 3 ? '#2563eb' : overall >= 2 ? '#f97316' : '#ef4444';
  }

  // ===== Router (hash-based) – same behaviour as before =====
  const titles = { '#clients': 'نظرة عامة', '#new': 'جلسة جديدة', '#history': 'السجل والتقدم', '#settings': 'الإعدادات' };
  function setActivePage(hash) {
    if (!hash || !pages[hash]) hash = '#clients';
    Object.values(pages).forEach(p => p.classList.remove('active'));
    pages[hash].classList.add('active');
    breadcrumb.textContent = `الصفحة: ${titles[hash]}`;
    document.querySelectorAll('.menu-link').forEach(btn => btn.classList.toggle('active', btn?.dataset?.route === hash));
    if (hash === '#history') { renderSessionHistory(); drawProgressChart(); }
  }
  window.addEventListener('hashchange', () => setActivePage(location.hash));
  document.querySelectorAll('.menu-link').forEach(btn => btn.addEventListener('click', () => { location.hash = btn.dataset.route; }));

  // Quick actions
  document.getElementById('go-new-session')?.addEventListener('click', () => { location.hash = '#new'; });
  document.getElementById('go-history')?.addEventListener('click', () => { location.hash = '#history'; });

  // ===== Clients rendering =====
  function renderClients() {
    clientList.innerHTML = '';
    clients.forEach((client) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'client-btn';
      button.textContent = client.name;
      button.dataset.id = client.id;
      if (activeClientInput.value === client.id) button.classList.add('active');
      button.addEventListener('click', () => selectClient(client.id));
      clientList.appendChild(button);
    });
  }
  function selectClient(clientId) {
    activeClientInput.value = clientId;
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    clientTitle.textContent = client.name;
    renderClients();
    sessionForm?.reset();
    const notes = document.getElementById('session-notes'); if (notes) notes.value = '';
    updateOverallScore();
    const latestIdx = client.sessions.length - 1;
    if (latestIdx >= 0) showSessionDetails(latestIdx);
    location.hash = '#clients';
  }
  addClientBtn.addEventListener('click', () => {
    const name = prompt('اسم العميل الجديد'); if (!name) return;
    const id = `c${Date.now()}`; clients.push({ id, name, sessions: [] }); renderClients();
  });

  // ===== History (with pagination) =====
  const PAGE_SIZE = 5;
  let historyPage = 1;
  function getActiveClient(){ return clients.find(c => c.id === activeClientInput.value); }
  function totalPagesForClient(client){ return Math.max(1, Math.ceil((client?.sessions.length || 0) / PAGE_SIZE)); }

  function renderSessionHistory() {
    const client = getActiveClient();
    if (!client || client.sessions.length === 0) {
      sessionsHistory.innerHTML = '<div class="hint">لا توجد جلسات بعد.</div>';
      pageInfo.textContent = 'صفحة 1';
      return;
    }
    historyPage = Math.min(historyPage, totalPagesForClient(client));
    const start = (historyPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const slice = client.sessions.slice().reverse().slice(start, end);

    const rows = slice.map((s, idx) => {
      const originalIndex = client.sessions.length - 1 - (start + idx);
      const d = new Date(s.timestamp);
      const dom = computeDomainAverages(s);
      return `<div class="history-row">
        <div>
          <strong>${s.title || 'جلسة بدون اسم'}</strong>
          <div class="hint">${d.toLocaleDateString()} — عام: ${dom.overall.toFixed(2)}</div>
        </div>
        <button type="button" data-idx="${originalIndex}" class="link view-session">عرض</button>
        <button type="button" data-idx="${originalIndex}" class="link delete-session" style="color:#ef4444;">حذف</button>
      </div>`;
    }).join('');
    sessionsHistory.innerHTML = rows;
    pageInfo.textContent = `صفحة ${historyPage} من ${totalPagesForClient(client)}`;
  }
  sessionsHistory?.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const idx = Number(btn.getAttribute('data-idx'));
    const client = getActiveClient(); if (!client) return;
    if (btn.classList.contains('view-session')) showSessionDetails(idx);
    else if (btn.classList.contains('delete-session')) {
      client.sessions.splice(idx,1); renderSessionHistory(); drawProgressChart(); updateOverallScore();
    }
  });
  prevPageBtn?.addEventListener('click', () => {
    const client = getActiveClient(); if (!client) return;
    if (historyPage > 1) { historyPage--; renderSessionHistory(); }
  });
  nextPageBtn?.addEventListener('click', () => {
    const client = getActiveClient(); if (!client) return;
    if (historyPage < totalPagesForClient(client)) { historyPage++; renderSessionHistory(); }
  });

  function showSessionDetails(index) {
    const client = getActiveClient(); if (!client) return;
    const s = client.sessions[index]; if (!s) return;
    const d = new Date(s.timestamp); const dom = computeDomainAverages(s);
    const box = document.getElementById('session-details');
    if (!box) return;
    box.innerHTML = `<div style="display:grid; gap:6px;">
      <div><strong>${s.title || 'جلسة'}</strong> — <span class="hint">${d.toLocaleString()}</span></div>
      <div class="hint">التقييم العام: ${dom.overall.toFixed(2)}</div>
      <div>المعرفي: ${dom.cognitive.toFixed(2)} | اللغة: ${dom.language.toFixed(2)} | الاجتماعي: ${dom.social.toFixed(2)}</div>
      <div>الحركي: ${dom.motor.toFixed(2)} | الأكاديمي: ${dom.academic.toFixed(2)} | التنفيذي: ${dom.executive.toFixed(2)}</div>
      <div><strong>الملاحظات:</strong><br>${(s.notes||'—').replace(/</g,'&lt;')}</div>
    </div>`;
  }

  // ===== New Session save/reset =====
  sessionForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const clientId = activeClientInput.value; if (!clientId) { alert('اختر عميلًا أولاً.'); return; }
    const formData = new FormData(sessionForm);
    const sessionData = {};
    scoreFields.forEach((field) => { sessionData[field] = Number(formData.get(field)); });
    sessionData.notes = formData.get('notes');
    sessionData.title = formData.get('sessionTitle') || `جلسة ${new Date().toLocaleDateString()}`;
    sessionData.timestamp = new Date().toISOString();
    const client = clients.find((c) => c.id === clientId);
    client.sessions.push(sessionData);
    updateOverallScore();
    alert('تم حفظ الجلسة بنجاح!');
    sessionForm.reset();
    showSessionDetails(client.sessions.length - 1);
    location.hash = '#history';
  });
  resetFormBtn?.addEventListener('click', () => {
    sessionForm.reset();
    const notes = document.getElementById('session-notes'); if (notes) notes.value = '';
  });

  // ===== Chart =====
  function drawProgressChart() {
    if (!progressCanvas) return;
    const client = getActiveClient();
    const ctx = progressCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cssW = progressCanvas.clientWidth;
    const cssH = progressCanvas.clientHeight;
    progressCanvas.width = Math.max(600, cssW) * dpr;
    progressCanvas.height = Math.max(200, cssH) * dpr;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0,0,progressCanvas.width, progressCanvas.height);
    const width = progressCanvas.width / dpr;
    const height = progressCanvas.height / dpr;
    const pad = 40;
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, height - pad);
    ctx.lineTo(width - pad, height - pad);
    ctx.stroke();
    if (!client || client.sessions.length === 0) {
      ctx.fillStyle = '#6b7280';
      ctx.fillText('لا توجد بيانات لعرضها', pad + 10, height/2);
      return;
    }
    const points = client.sessions.map((s, i) => ({ x: i, y: computeDomainAverages(s).overall }));
    const xMax = Math.max(1, points.length - 1);
    const mapX = (x) => pad + (x / xMax) * (width - 2*pad);
    const mapY = (y) => (height - pad) - (y / 5) * (height - 2*pad);
    ctx.strokeStyle = '#f3f4f6';
    for (let y=1; y<=5; y++){ const yy = mapY(y); ctx.beginPath(); ctx.moveTo(pad, yy); ctx.lineTo(width-pad, yy); ctx.stroke(); }
    ctx.fillStyle = '#6b7280'; ctx.font = '12px Cairo, sans-serif';
    for (let y=0; y<=5; y++) ctx.fillText(String(y), 8, mapY(y)+4);
    ctx.strokeStyle = '#4f46e5'; ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i)=>{ const X = mapX(i), Y = mapY(p.y); if(i===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y); });
    ctx.stroke();
    ctx.fillStyle = '#22c55e';
    points.forEach((p, i) => { const X = mapX(i), Y = mapY(p.y); ctx.beginPath(); ctx.arc(X,Y,3,0,Math.PI*2); ctx.fill(); });
  }

  // ===== Init =====
  function init() {
    // seed sample clients if none
    if (!Array.isArray(clients) || !clients.length) {
      clients = [
        { id:'c1', name:'خالد العتيبي', sessions:[] },
        { id:'c2', name:'ندى السعيد', sessions:[] },
      ];
    }
    renderClients();
    setActivePage(location.hash || '#clients');
  }
  init();
}

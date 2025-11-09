// Basic router helpers
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

  const DEMO = { name: 'Demo Specialist', email: 'demo@unitysphere.test', password: 'Demo123!' };

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
    authTitle.textContent = isSignUp ? 'Create account' : 'Sign in';
    authSubtitle.textContent = isSignUp ? 'Register to start coordinating care.' : 'Use your credentials to continue.';
    authAction.textContent = isSignUp ? 'Register' : 'Sign in';
    switchText.textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
    switchModeBtn.textContent = isSignUp ? 'Sign in' : 'Create one';
    confirmGroup.classList.toggle('hidden', !isSignUp);
  });

  function completeLogin(name, email){
    sessionStorage.setItem('us_name', name);
    sessionStorage.setItem('us_email', email);
    window.location.href = 'dashboard.html';
  }

  demoLoginBtn?.addEventListener('click', () => completeLogin(DEMO.name, DEMO.email));

  authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = authForm.elements['name'].value.trim();
    const email = authForm.elements['email'].value.trim();
    if (!name || !email) return;
    completeLogin(name, email);
  });
}

// === Dashboard page logic ===
if (isDashboardPage) {
  const userName = sessionStorage.getItem('us_name');
  const userEmail = sessionStorage.getItem('us_email');
  if (!userName) {
    window.location.href = 'index.html';
  }

  // Elements
  const sectionTitle = document.getElementById('section-title');
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const sections = {
    overview: document.getElementById('section-overview'),
    centers: document.getElementById('section-centers'),
    specialists: document.getElementById('section-specialists'),
    modules: document.getElementById('section-modules'),
    assessment: document.getElementById('section-assessment'),
  };

  const sidebarName = document.getElementById('sidebar-name');
  const sidebarEmail = document.getElementById('sidebar-email');
  const userNameTarget = document.getElementById('user-name');
  const greeting = document.getElementById('greeting');
  const logoutBtn = document.getElementById('logout');
  const learningProgress = document.getElementById('learning-progress');
  const headerAvatar = document.getElementById('header-avatar');
  const sidebarAvatar = document.getElementById('sidebar-avatar');

  // Summary targets
  const summaryCenters = document.getElementById('summary-centers');
  const summarySpecialists = document.getElementById('summary-specialists');
  const summaryKids = document.getElementById('summary-kids');
  const summaryModules = document.getElementById('summary-modules');
  const vrChartContainer = document.getElementById('vr-minutes-chart');
  const vrMonthTotal = document.getElementById('vr-month-total');
  const vrMonthChange = document.getElementById('vr-month-change');
  const deviceDonut = document.getElementById('device-donut');
  const deviceLeading = document.getElementById('device-leading');
  const deviceLegend = document.getElementById('device-legend');
  const centerProgress = document.getElementById('center-progress');
  const recommendationList = document.getElementById('recommendation-list');
  const centersGrid = document.getElementById('centers-grid');
  const mapPins = document.getElementById('map-pins');
  const specialistsGrid = document.getElementById('specialists-grid');
  const modulesGrid = document.getElementById('modules-grid');
  const assessmentChildSelect = document.getElementById('assessment-child');
  const assessmentSummary = document.getElementById('assessment-summary');
  const assessmentModules = document.getElementById('assessment-modules');
  const assessmentStatus = document.getElementById('assessment-status');
  const saveAssessmentBtn = document.getElementById('save-assessment');

  // Data sources
  const centers = [
    {
      id: 'center-1',
      name: 'Cogniplay City Center',
      location: 'Riyadh, KSA',
      focus: 'Immersive neurodevelopmental therapy',
      programs: ['Cognitive Focus', 'Sensory Regulation'],
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=60',
      map: { x: 28, y: 46 },
    },
    {
      id: 'center-2',
      name: 'NeuroConnect Hub',
      location: 'Jeddah, KSA',
      focus: 'Executive function and language',
      programs: ['Executive Function', 'Language Labs'],
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=60',
      map: { x: 56, y: 58 },
    },
    {
      id: 'center-3',
      name: 'Innovata Wellness Center',
      location: 'Dubai, UAE',
      focus: 'Sensory integration & family coaching',
      programs: ['Sensory Symphony', 'Family Coaching'],
      image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&q=60',
      map: { x: 74, y: 42 },
    },
    {
      id: 'center-4',
      name: 'Cortex Meadow Clinic',
      location: 'Doha, Qatar',
      focus: 'Motor planning & regulation',
      programs: ['Motor Mastery', 'Calm Transitions'],
      image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=60',
      map: { x: 64, y: 32 },
    }
  ];

  const specialists = [
    {
      id: 'spec-1',
      name: 'Dr. Khalid Haddad',
      specialty: 'Pediatric Neurologist',
      focus: 'Leads attention calibration pathways and family onboarding.',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=60',
      tenure: '4 yrs in UnitySphere'
    },
    {
      id: 'spec-2',
      name: 'Dr. Layla Odeh',
      specialty: 'Clinical Psychologist',
      focus: 'Designs social cognition journeys with VR narratives.',
      avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=60',
      tenure: '6 yrs in UnitySphere'
    },
    {
      id: 'spec-3',
      name: 'Dr. Nourah Al-Masri',
      specialty: 'Speech & Language Pathologist',
      focus: 'Champions expressive language modules with live coaching.',
      avatar: 'https://images.unsplash.com/photo-1544723795-3fb3729955b8?auto=format&fit=crop&w=300&q=60',
      tenure: '3 yrs in UnitySphere'
    },
    {
      id: 'spec-4',
      name: 'Dr. Sara Nassar',
      specialty: 'Occupational Therapist',
      focus: 'Builds sensory-motor ladders for regulation and planning.',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=60',
      tenure: '5 yrs in UnitySphere'
    },
    {
      id: 'spec-5',
      name: 'Dr. Ali Khaled',
      specialty: 'Behavior Analyst',
      focus: 'Implements data-driven reinforcement schedules in VR.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=60',
      tenure: '2 yrs in UnitySphere'
    },
    {
      id: 'spec-6',
      name: 'Dr. Fatima Haddad',
      specialty: 'Developmental Pediatrician',
      focus: 'Integrates clinical milestones with immersive analytics.',
      avatar: 'https://images.unsplash.com/photo-1544723795-432537b16ec4?auto=format&fit=crop&w=300&q=60',
      tenure: '5 yrs in UnitySphere'
    },
    {
      id: 'spec-7',
      name: 'Dr. Amal Nasser',
      specialty: 'Educational Therapist',
      focus: 'Bridges VR modules with classroom follow-ups.',
      avatar: 'https://images.unsplash.com/photo-1544723795-3fb2727b1662?auto=format&fit=crop&w=300&q=60',
      tenure: '4 yrs in UnitySphere'
    }
  ];

  const kids = [
    { id: 'kid-1', name: 'Khalid Al Amran', age: 8, centerId: 'center-1', program: 'Sensory Symphony', streak: 6, progress: 0.84 },
    { id: 'kid-2', name: 'Hessa Al Ruwaili', age: 7, centerId: 'center-2', program: 'Executive Function Bridge', streak: 4, progress: 0.79 },
    { id: 'kid-3', name: 'Omar Al Jaber', age: 6, centerId: 'center-1', program: 'Cognitive Maze Runner', streak: 8, progress: 0.91 },
    { id: 'kid-4', name: 'Layla Al Harbi', age: 9, centerId: 'center-3', program: 'Social Story Weaver', streak: 5, progress: 0.88 },
    { id: 'kid-5', name: 'Yara Al Salem', age: 10, centerId: 'center-2', program: 'Motor Skills Mountain', streak: 3, progress: 0.72 },
    { id: 'kid-6', name: 'Rakan Al Thani', age: 7, centerId: 'center-4', program: 'Executive Function Bridge', streak: 7, progress: 0.86 },
    { id: 'kid-7', name: 'Mariam Al Ghamdi', age: 5, centerId: 'center-3', program: 'Sensory Symphony', streak: 9, progress: 0.93 },
    { id: 'kid-8', name: 'Noura Al Qahtani', age: 6, centerId: 'center-4', program: 'Social Story Weaver', streak: 2, progress: 0.68 }
  ];

  const vrModules = [
    { id: 'module-1', name: 'Sensory Symphony', category: 'Sensory', duration: '20 min', focus: 'Calm multisensory regulation pathways.', sessions: 32 },
    { id: 'module-2', name: 'Social Story Weaver', category: 'Cognitive', duration: '15 min', focus: 'Guided peer interactions inside VR narratives.', sessions: 28 },
    { id: 'module-3', name: 'Executive Function Bridge', category: 'Executive', duration: '18 min', focus: 'Plan, sequence, and evaluate challenges.', sessions: 30 },
    { id: 'module-4', name: 'Cognitive Maze Runner', category: 'Cognitive', duration: '22 min', focus: 'Adaptive problem-solving in spatial mazes.', sessions: 27 },
    { id: 'module-5', name: 'Motor Skills Mountain', category: 'Motor', duration: '25 min', focus: 'Gross and fine motor coordination tasks.', sessions: 24 },
    { id: 'module-6', name: 'Sensory Garden Explorers', category: 'Sensory', duration: '18 min', focus: 'Mindful exploration with haptic feedback.', sessions: 26 },
    { id: 'module-7', name: 'Calm Breathing Orbit', category: 'Regulation', duration: '12 min', focus: 'Biofeedback-led breathing control.', sessions: 33 },
    { id: 'module-8', name: 'Language Lights Lab', category: 'Language', duration: '16 min', focus: 'Expressive vocabulary through mixed reality prompts.', sessions: 29 }
  ];

  const recommendations = [
    { title: 'Introduce Calm Breathing Orbit', detail: 'Add to Khalid’s pre-session routine to improve regulation.', badge: 'Regulation' },
    { title: 'Schedule co-treatment block', detail: 'Pair Layla’s social story follow-up with executive coaching.', badge: 'Collaboration' },
    { title: 'Refresh Motor Skills Mountain cues', detail: 'Upload new tactile prompts for Yara’s next sequence.', badge: 'Motor' },
    { title: 'Share progress snapshots', detail: 'Send weekly highlights to the Innovata Wellness caregivers.', badge: 'Family' }
  ];

  const deviceUsage = [
    { label: 'Meta Quest 3', value: 38, color: '#6366f1' },
    { label: 'Pico 4 Enterprise', value: 26, color: '#ec4899' },
    { label: 'HTC Vive Focus', value: 22, color: '#22d3ee' },
    { label: 'Projection Suite', value: 14, color: '#38bdf8' }
  ];

  const vrTimeline = [
    { month: 'Apr', current: 820, previous: 760 },
    { month: 'May', current: 870, previous: 790 },
    { month: 'Jun', current: 910, previous: 845 },
    { month: 'Jul', current: 960, previous: 880 },
    { month: 'Aug', current: 1020, previous: 910 },
    { month: 'Sep', current: 1055, previous: 925 }
  ];

  // Helpers
  const formatNumber = (value) => value.toLocaleString('en-US');
  const average = (values) => values.reduce((total, value) => total + value, 0) / values.length;

  function setActiveSection(sectionKey) {
    Object.entries(sections).forEach(([key, element]) => {
      const isActive = key === sectionKey;
      element?.classList.toggle('active', isActive);
    });
    navLinks.forEach((link) => link.classList.toggle('active', link.dataset.section === sectionKey));
    const activeLink = navLinks.find((link) => link.dataset.section === sectionKey);
    sectionTitle.textContent = activeLink ? activeLink.textContent.trim() : 'Dashboard';
  }

  function renderLineChart(container, dataset) {
    if (!container) return;
    const width = 600;
    const height = 220;
    const margin = { top: 18, bottom: 32, left: 12, right: 12 };
    const values = dataset.flatMap(({ current, previous }) => [current, previous]);
    const max = Math.max(...values) * 1.05;
    const min = Math.min(...values) * 0.9;
    const range = max - min || 1;

    const buildPoints = (key) => dataset
      .map((entry, index) => {
        const x = margin.left + (index / (dataset.length - 1)) * (width - margin.left - margin.right);
        const y = height - margin.bottom - ((entry[key] - min) / range) * (height - margin.top - margin.bottom);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const currentPoints = buildPoints('current');
    const previousPoints = buildPoints('previous');

    const dotElements = dataset.map((entry, index) => {
      const [x, y] = currentPoints.split(' ')[index].split(',').map(Number);
      return `<circle cx="${x}" cy="${y}" r="4" fill="#6366f1" />`;
    }).join('');

    const labels = dataset.map((entry, index) => {
      const x = margin.left + (index / (dataset.length - 1)) * (width - margin.left - margin.right);
      const labelY = height - 12;
      return `<text x="${x}" y="${labelY}" text-anchor="middle" fill="rgba(148,163,184,0.85)" font-size="12">${entry.month}</text>`;
    }).join('');

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <polyline points="${previousPoints}" fill="none" stroke="rgba(129,140,248,0.6)" stroke-width="2.5" stroke-dasharray="6 6" stroke-linecap="round" />
        <polyline points="${currentPoints}" fill="none" stroke="#6366f1" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
        ${dotElements}
        ${labels}
      </svg>
    `;
  }

  function renderDonutChart(container, legendContainer, dataset) {
    if (!container || !legendContainer) return;
    const total = dataset.reduce((sum, entry) => sum + entry.value, 0);
    let offset = 0;
    const segments = dataset.map((entry) => {
      const start = offset;
      offset += (entry.value / total) * 100;
      return `${entry.color} ${start}% ${offset}%`;
    });
    container.style.setProperty('--donut-gradient', `conic-gradient(${segments.join(', ')})`);
    const topDevice = dataset.reduce((best, entry) => (entry.value > best.value ? entry : best), dataset[0]);
    deviceLeading.textContent = `${Math.round((topDevice.value / total) * 100)}%`;

    legendContainer.innerHTML = dataset.map((entry) => {
      const percentage = Math.round((entry.value / total) * 100);
      return `<li><span style="background:${entry.color}"></span>${entry.label}<strong style="margin-left:auto;">${percentage}%</strong></li>`;
    }).join('');
  }

  function renderLearningProgress(element, children) {
    if (!element) return;
    const overall = Math.round(average(children.map((child) => child.progress)) * 100);
    element.style.setProperty('--progress-value', overall);
    element.querySelector('.progress-value').textContent = `${overall}%`;
  }

  function renderCenterProgress(container, centersData, childrenData) {
    if (!container) return;
    const progressByCenter = centersData.map((center) => {
      const assigned = childrenData.filter((child) => child.centerId === center.id);
      const score = assigned.length ? Math.round(average(assigned.map((child) => child.progress)) * 100) : 0;
      return { name: center.name, score };
    }).sort((a, b) => b.score - a.score);

    container.innerHTML = progressByCenter.map(({ name, score }) => `
      <div class="progress-row">
        <strong>${name}</strong>
        <div class="progress-bar"><span style="width:${score}%"></span></div>
        <div class="progress-score">${score}%</div>
      </div>
    `).join('');
  }

  function renderRecommendations(container, items) {
    if (!container) return;
    container.innerHTML = items.map((item) => `
      <div class="recommendation">
        <div>
          <strong>${item.title}</strong>
          <p class="muted">${item.detail}</p>
        </div>
        <span class="badge badge-soft">${item.badge}</span>
      </div>
    `).join('');
  }

  function renderCenters(container, centersData) {
    if (!container) return;
    container.innerHTML = centersData.map((center) => `
      <article class="center-card">
        <img src="${center.image}" alt="${center.name}">
        <div class="card-body">
          <strong>${center.name}</strong>
          <span class="muted">${center.location}</span>
          <p class="muted">${center.focus}</p>
          <div class="tag">${center.programs.join(' • ')}</div>
        </div>
        <footer>
          <span class="muted">${center.programs.length} active programs</span>
        </footer>
      </article>
    `).join('');
  }

  function renderMapPins(container, centersData) {
    if (!container) return;
    container.innerHTML = centersData.map((center) => `
      <div class="map-pin" style="left:${center.map.x}%; top:${center.map.y}%">
        <span>${center.name}</span>
      </div>
    `).join('');
  }

  function renderSpecialists(container, specialistsData) {
    if (!container) return;
    container.innerHTML = specialistsData.map((specialist) => `
      <article class="specialist-card">
        <div class="avatar" style="background-image:url(${specialist.avatar}); background-size:cover; background-position:center;"></div>
        <strong>${specialist.name}</strong>
        <span class="muted">${specialist.specialty}</span>
        <p>${specialist.focus}</p>
        <span class="badge badge-soft">${specialist.tenure}</span>
      </article>
    `).join('');
  }

  function renderModules(container, modulesData) {
    if (!container) return;
    container.innerHTML = modulesData.map((module) => `
      <article class="module-card">
        <header>
          <strong>${module.name}</strong>
          <span class="tag">${module.category}</span>
        </header>
        <p class="muted">${module.focus}</p>
        <div class="module-meta">
          <span>⏱️ ${module.duration}</span>
          <span>🧭 ${module.sessions} sessions</span>
        </div>
        <button type="button" class="primary ghost">Assign module</button>
      </article>
    `).join('');
  }

  function renderAssessment(childId) {
    const child = kids.find((item) => item.id === childId) || kids[0];
    if (!child) return;
    const center = centers.find((item) => item.id === child.centerId);
    assessmentSummary.innerHTML = `
      <strong>${child.name}</strong>
      <div class="pill">Age ${child.age}</div>
      <div class="pill">${center ? center.name : '—'}</div>
      <p class="muted">Current focus: ${child.program}</p>
      <p class="muted">Streak: ${child.streak} active weeks • Progress ${Math.round(child.progress * 100)}%</p>
    `;

    assessmentModules.innerHTML = vrModules.slice(0, 4).map((module, index) => `
      <div class="module-form" data-module="${module.id}">
        <header>
          <strong>${module.name}</strong>
          <span class="muted">${module.duration}</span>
        </header>
        <p class="muted">${module.focus}</p>
        <label>Engagement score: <strong id="score-${module.id}">${70 + index * 5}</strong></label>
        <input type="range" min="40" max="100" value="${70 + index * 5}" data-target="score-${module.id}">
        <label>Session notes</label>
        <textarea placeholder="Observations, cues that worked, next steps..."></textarea>
      </div>
    `).join('');

    assessmentModules.querySelectorAll('input[type="range"]').forEach((input) => {
      input.addEventListener('input', () => {
        const targetId = input.dataset.target;
        const target = document.getElementById(targetId);
        if (target) target.textContent = input.value;
      });
    });
  }

  function populateAssessmentSelector(childrenData) {
    assessmentChildSelect.innerHTML = childrenData.map((child) => `
      <option value="${child.id}">${child.name}</option>
    `).join('');
    renderAssessment(childrenData[0]?.id);
  }

  function updateSummary() {
    summaryCenters.textContent = centers.length;
    summarySpecialists.textContent = specialists.length;
    summaryKids.textContent = kids.length;
    summaryModules.textContent = vrModules.length;

    renderLineChart(vrChartContainer, vrTimeline);
    const latest = vrTimeline[vrTimeline.length - 1];
    vrMonthTotal.textContent = `${formatNumber(latest.current)} min`;
    const delta = latest.previous ? ((latest.current - latest.previous) / latest.previous) * 100 : 0;
    vrMonthChange.textContent = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
    vrMonthChange.classList.toggle('positive', delta >= 0);

    renderDonutChart(deviceDonut, deviceLegend, deviceUsage);
    renderLearningProgress(learningProgress, kids);
    renderCenterProgress(centerProgress, centers, kids);
    renderRecommendations(recommendationList, recommendations);
  }

  // Setup user details
  sidebarName.textContent = userName || 'UnitySphere Specialist';
  sidebarEmail.textContent = userEmail || 'demo@unitysphere.test';
  userNameTarget.textContent = userName || 'UnitySphere Specialist';

  const avatarImage = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60';
  [headerAvatar, sidebarAvatar].forEach((element) => {
    if (element) {
      element.style.backgroundImage = `url(${avatarImage})`;
      element.style.backgroundSize = 'cover';
      element.style.backgroundPosition = 'center';
    }
  });

  const hour = new Date().getHours();
  greeting.textContent = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  navLinks.forEach((link) => {
    link.addEventListener('click', () => setActiveSection(link.dataset.section));
  });

  logoutBtn?.addEventListener('click', () => {
    sessionStorage.removeItem('us_name');
    sessionStorage.removeItem('us_email');
    window.location.href = 'index.html';
  });

  assessmentChildSelect.addEventListener('change', (event) => {
    renderAssessment(event.target.value);
  });

  saveAssessmentBtn.addEventListener('click', () => {
    assessmentStatus.textContent = 'Outcomes saved to timeline';
    assessmentStatus.style.color = 'var(--color-positive)';
    setTimeout(() => {
      assessmentStatus.textContent = 'Draft not saved';
      assessmentStatus.style.color = '';
    }, 3200);
  });

  // Initial render
  updateSummary();
  renderCenters(centersGrid, centers);
  renderMapPins(mapPins, centers);
  renderSpecialists(specialistsGrid, specialists);
  renderModules(modulesGrid, vrModules);
  populateAssessmentSelector(kids);
}

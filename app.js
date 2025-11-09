const isLoginPage = location.pathname.endsWith('index.html') || !location.pathname.includes('.html');
const isDashboardPage = location.pathname.endsWith('dashboard.html');

const STORAGE_KEY = 'unitysphere-data';
const storageAvailable = typeof localStorage !== 'undefined';

const DEFAULT_DATA = {
  centers: [
    {
      id: 'center-1',
      name: 'Cogniplay City Center',
      location: 'Riyadh, KSA',
      focus: 'Immersive neurodevelopmental therapy',
      programs: ['Cognitive Focus', 'Sensory Regulation'],
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=60',
      map: { x: 28, y: 46 }
    },
    {
      id: 'center-2',
      name: 'NeuroConnect Hub',
      location: 'Jeddah, KSA',
      focus: 'Executive function and language',
      programs: ['Executive Function Bridge', 'Language Labs'],
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=60',
      map: { x: 56, y: 58 }
    },
    {
      id: 'center-3',
      name: 'Innovata Wellness Center',
      location: 'Dubai, UAE',
      focus: 'Sensory integration & family coaching',
      programs: ['Sensory Symphony', 'Family Coaching'],
      image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&q=60',
      map: { x: 74, y: 42 }
    },
    {
      id: 'center-4',
      name: 'Cortex Meadow Clinic',
      location: 'Doha, Qatar',
      focus: 'Motor planning & regulation',
      programs: ['Motor Mastery', 'Calm Transitions'],
      image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=60',
      map: { x: 64, y: 32 }
    }
  ],
  users: [
    { username: 'unity-admin', password: 'Admin123!', name: 'UnitySphere Admin', role: 'main-admin', email: 'admin@unitysphere.test' },
    { username: 'center-riyadh', password: 'Center123!', name: 'Amina Rahman', role: 'center-admin', centerId: 'center-1', email: 'riyadh.admin@unitysphere.test' },
    { username: 'center-jeddah', password: 'Center123!', name: 'Hassan Al Amiri', role: 'center-admin', centerId: 'center-2', email: 'jeddah.admin@unitysphere.test' },
    { username: 'center-dubai', password: 'Center123!', name: 'Noor Al Farsi', role: 'center-admin', centerId: 'center-3', email: 'dubai.admin@unitysphere.test' },
    { username: 'center-doha', password: 'Center123!', name: 'Lina Al Thani', role: 'center-admin', centerId: 'center-4', email: 'doha.admin@unitysphere.test' },
    { username: 'spec-khalid', password: 'Spec123!', name: 'Dr. Khalid Haddad', role: 'specialist', centerId: 'center-1', specialty: 'Pediatric Neurologist', focus: 'Leads attention calibration pathways and family onboarding.', tenure: '4 yrs in UnitySphere', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=60' },
    { username: 'spec-layla', password: 'Spec123!', name: 'Dr. Layla Odeh', role: 'specialist', centerId: 'center-2', specialty: 'Clinical Psychologist', focus: 'Designs social cognition journeys with VR narratives.', tenure: '6 yrs in UnitySphere', avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=60' },
    { username: 'spec-nourah', password: 'Spec123!', name: 'Dr. Nourah Al-Masri', role: 'specialist', centerId: 'center-1', specialty: 'Speech & Language Pathologist', focus: 'Champions expressive language modules with live coaching.', tenure: '3 yrs in UnitySphere', avatar: 'https://images.unsplash.com/photo-1544723795-3fb3729955b8?auto=format&fit=crop&w=300&q=60' },
    { username: 'spec-sara', password: 'Spec123!', name: 'Dr. Sara Nassar', role: 'specialist', centerId: 'center-3', specialty: 'Occupational Therapist', focus: 'Builds sensory-motor ladders for regulation and planning.', tenure: '5 yrs in UnitySphere', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=60' },
    { username: 'spec-ali', password: 'Spec123!', name: 'Dr. Ali Khaled', role: 'specialist', centerId: 'center-2', specialty: 'Behavior Analyst', focus: 'Implements data-driven reinforcement schedules in VR.', tenure: '2 yrs in UnitySphere', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=60' },
    { username: 'spec-fatima', password: 'Spec123!', name: 'Dr. Fatima Haddad', role: 'specialist', centerId: 'center-4', specialty: 'Developmental Pediatrician', focus: 'Integrates clinical milestones with immersive analytics.', tenure: '5 yrs in UnitySphere', avatar: 'https://images.unsplash.com/photo-1544723795-432537b16ec4?auto=format&fit=crop&w=300&q=60' },
    { username: 'spec-amal', password: 'Spec123!', name: 'Dr. Amal Nasser', role: 'specialist', centerId: 'center-3', specialty: 'Educational Therapist', focus: 'Bridges VR modules with classroom follow-ups.', tenure: '4 yrs in UnitySphere', avatar: 'https://images.unsplash.com/photo-1544723795-3fb2727b1662?auto=format&fit=crop&w=300&q=60' }
  ],
  kids: [
    { id: 'kid-1', name: 'Khalid Al Amran', age: 8, centerId: 'center-1', program: 'Sensory Symphony', streak: 6, progress: 0.84, specialistUsername: 'spec-khalid', moduleIds: ['module-1', 'module-7'] },
    { id: 'kid-2', name: 'Hessa Al Ruwaili', age: 7, centerId: 'center-2', program: 'Executive Function Bridge', streak: 4, progress: 0.79, specialistUsername: 'spec-layla', moduleIds: ['module-2', 'module-3'] },
    { id: 'kid-3', name: 'Omar Al Jaber', age: 6, centerId: 'center-1', program: 'Cognitive Maze Runner', streak: 8, progress: 0.91, specialistUsername: 'spec-nourah', moduleIds: ['module-3', 'module-4'] },
    { id: 'kid-4', name: 'Layla Al Harbi', age: 9, centerId: 'center-3', program: 'Social Story Weaver', streak: 5, progress: 0.88, specialistUsername: 'spec-sara', moduleIds: ['module-2', 'module-6'] },
    { id: 'kid-5', name: 'Yara Al Salem', age: 10, centerId: 'center-2', program: 'Motor Skills Mountain', streak: 3, progress: 0.72, specialistUsername: 'spec-ali', moduleIds: ['module-5'] },
    { id: 'kid-6', name: 'Rakan Al Thani', age: 7, centerId: 'center-4', program: 'Executive Function Bridge', streak: 7, progress: 0.86, specialistUsername: 'spec-fatima', moduleIds: ['module-3', 'module-7'] },
    { id: 'kid-7', name: 'Mariam Al Ghamdi', age: 5, centerId: 'center-3', program: 'Sensory Symphony', streak: 9, progress: 0.93, specialistUsername: 'spec-amal', moduleIds: ['module-1', 'module-6'] },
    { id: 'kid-8', name: 'Noura Al Qahtani', age: 6, centerId: 'center-4', program: 'Social Story Weaver', streak: 2, progress: 0.68, specialistUsername: 'spec-fatima', moduleIds: ['module-2'] }
  ],
  modules: [
    { id: 'module-1', name: 'Sensory Symphony', category: 'Sensory', duration: '20 min', focus: 'Calm multisensory regulation pathways.', sessions: 32 },
    { id: 'module-2', name: 'Social Story Weaver', category: 'Cognitive', duration: '15 min', focus: 'Guided peer interactions inside VR narratives.', sessions: 28 },
    { id: 'module-3', name: 'Executive Function Bridge', category: 'Executive', duration: '18 min', focus: 'Plan, sequence, and evaluate challenges.', sessions: 30 },
    { id: 'module-4', name: 'Cognitive Maze Runner', category: 'Cognitive', duration: '22 min', focus: 'Adaptive problem-solving in spatial mazes.', sessions: 27 },
    { id: 'module-5', name: 'Motor Skills Mountain', category: 'Motor', duration: '25 min', focus: 'Gross and fine motor coordination tasks.', sessions: 24 },
    { id: 'module-6', name: 'Sensory Garden Explorers', category: 'Sensory', duration: '18 min', focus: 'Mindful exploration with haptic feedback.', sessions: 26 },
    { id: 'module-7', name: 'Calm Breathing Orbit', category: 'Regulation', duration: '12 min', focus: 'Biofeedback-led breathing control.', sessions: 33 },
    { id: 'module-8', name: 'Language Lights Lab', category: 'Language', duration: '16 min', focus: 'Expressive vocabulary through mixed reality prompts.', sessions: 29 }
  ],
  assessments: []
};

const DEVICE_USAGE = [
  { label: 'Meta Quest 3', value: 38, color: '#6366f1' },
  { label: 'Pico 4 Enterprise', value: 26, color: '#ec4899' },
  { label: 'HTC Vive Focus', value: 22, color: '#22d3ee' },
  { label: 'Projection Suite', value: 14, color: '#38bdf8' }
];

const VR_TIMELINE = [
  { month: 'Apr', current: 820, previous: 760 },
  { month: 'May', current: 870, previous: 790 },
  { month: 'Jun', current: 910, previous: 845 },
  { month: 'Jul', current: 960, previous: 880 },
  { month: 'Aug', current: 1020, previous: 910 },
  { month: 'Sep', current: 1055, previous: 925 }
];

const RECOMMENDATIONS = [
  { title: 'Introduce Calm Breathing Orbit', detail: 'Add to Khalid’s pre-session routine to improve regulation.', badge: 'Regulation' },
  { title: 'Schedule co-treatment block', detail: 'Pair Layla’s social story follow-up with executive coaching.', badge: 'Collaboration' },
  { title: 'Refresh Motor Skills Mountain cues', detail: 'Upload new tactile prompts for Yara’s next sequence.', badge: 'Motor' },
  { title: 'Share progress snapshots', detail: 'Send weekly highlights to the Innovata Wellness caregivers.', badge: 'Family' }
];

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function loadData() {
  if (!storageAvailable) return cloneData(DEFAULT_DATA);
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return cloneData(DEFAULT_DATA);
    }
    const parsed = JSON.parse(stored);
    return {
      centers: parsed.centers ? parsed.centers : cloneData(DEFAULT_DATA.centers),
      users: parsed.users ? parsed.users : cloneData(DEFAULT_DATA.users),
      kids: parsed.kids ? parsed.kids : cloneData(DEFAULT_DATA.kids),
      modules: parsed.modules ? parsed.modules : cloneData(DEFAULT_DATA.modules),
      assessments: parsed.assessments ? parsed.assessments : []
    };
  } catch (error) {
    console.warn('Failed to load saved data, using defaults.', error);
    return cloneData(DEFAULT_DATA);
  }
}

function saveData(data) {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to persist data', error);
  }
}

function formatRole(role) {
  switch (role) {
    case 'main-admin': return 'Main admin';
    case 'center-admin': return 'Center admin';
    case 'specialist': return 'Specialist';
    default: return 'Team member';
  }
}

function findUser(users, username) {
  if (!username) return null;
  const normalized = username.trim().toLowerCase();
  return users.find((user) => user.username.toLowerCase() === normalized) || null;
}

function generateMapPoint() {
  return { x: Math.round(20 + Math.random() * 60), y: Math.round(25 + Math.random() * 45) };
}

function ensureAvatar(user) {
  if (user && !user.avatar) {
    user.avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(user.username)}`;
  }
  return user;
}

// ---- Auth page ----
if (isLoginPage) {
  const data = loadData();
  const authForm = document.getElementById('auth-form');
  const feedback = document.getElementById('auth-feedback');
  const usernameInput = document.getElementById('auth-username');
  const passwordInput = document.getElementById('auth-password');

  function setFeedback(message, isError = false) {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.style.color = isError ? '#ef4444' : '#64748b';
  }

  authForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = usernameInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!username || !password) {
      setFeedback('Enter both username and password to continue.', true);
      return;
    }

    const user = findUser(data.users, username);
    if (!user || user.password !== password) {
      setFeedback('Invalid username or password. Please try again.', true);
      return;
    }

    if (user.role !== 'main-admin') {
      setFeedback('Only the main UnitySphere administrator can access this dashboard. Sign in with the main admin account.', true);
      return;
    }

    sessionStorage.setItem('us_username', user.username);
    sessionStorage.setItem('us_name', user.name);
    sessionStorage.setItem('us_role', user.role);
    if (user.centerId) {
      sessionStorage.setItem('us_center', user.centerId);
    } else {
      sessionStorage.removeItem('us_center');
    }

    setFeedback('Signing you in...');
    window.location.href = 'dashboard.html';
  });
}

// ---- Dashboard page ----
if (isDashboardPage) {
  const data = loadData();
  const username = sessionStorage.getItem('us_username');
  const user = ensureAvatar(findUser(data.users, username));

  if (!user) {
    window.location.href = 'index.html';
  }

  if (user && user.role !== 'main-admin') {
    sessionStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  const config = { sections: ['overview', 'centers', 'accounts', 'specialists', 'modules', 'assessment'], canCreateCenter: true, canCreateSpecialist: true, showAccounts: true };

  const sectionTitle = document.getElementById('section-title');
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const sections = {
    overview: document.getElementById('section-overview'),
    centers: document.getElementById('section-centers'),
    accounts: document.getElementById('section-accounts'),
    specialists: document.getElementById('section-specialists'),
    modules: document.getElementById('section-modules'),
    assessment: document.getElementById('section-assessment')
  };

  const sidebarName = document.getElementById('sidebar-name');
  const sidebarEmail = document.getElementById('sidebar-email');
  const userNameTarget = document.getElementById('user-name');
  const userRoleTarget = document.getElementById('user-role');
  const greeting = document.getElementById('greeting');
  const logoutBtn = document.getElementById('logout');
  const learningProgress = document.getElementById('learning-progress');
  const headerAvatar = document.getElementById('header-avatar');
  const sidebarAvatar = document.getElementById('sidebar-avatar');

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
  const specialistRoster = document.getElementById('specialist-roster');
  const modulesGrid = document.getElementById('modules-grid');
  const assessmentCenterSelect = document.getElementById('assessment-center');
  const assessmentChildSelect = document.getElementById('assessment-child');
  const assessmentSummary = document.getElementById('assessment-summary');
  const assessmentModules = document.getElementById('assessment-modules');
  const assessmentStatus = document.getElementById('assessment-status');
  const assessmentHistory = document.getElementById('assessment-history');
  const assessmentCenterSummary = document.getElementById('assessment-center-summary');
  const saveAssessmentBtn = document.getElementById('save-assessment');
  const accountList = document.getElementById('account-list');
  const accountsSubtitle = document.getElementById('accounts-subtitle');
  const centerAdminCard = document.getElementById('create-center-admin-card');
  const centerAdminForm = document.getElementById('center-admin-form');
  const centerAdminFeedback = document.getElementById('center-admin-feedback');
  const specialistCard = document.getElementById('create-specialist-card');
  const specialistForm = document.getElementById('specialist-form');
  const specialistFeedback = document.getElementById('specialist-feedback');
  const specialistCenterField = document.getElementById('specialist-center-field');
  const addCenterBtn = document.getElementById('add-center');
  const inviteSpecialistBtn = document.getElementById('invite-specialist');
  const moduleFormCard = document.getElementById('module-form-card');
  const moduleForm = document.getElementById('module-form');
  const moduleFeedback = document.getElementById('module-feedback');
  const toggleModuleFormBtn = document.getElementById('toggle-module-form');

  function cloneForRender(value) {
    return JSON.parse(JSON.stringify(value));
  }

  const assessmentState = { centerId: null, childId: null };

  function formatNumber(value) {
    return value.toLocaleString('en-US');
  }

  function average(values) {
    if (!values.length) return 0;
    return values.reduce((total, item) => total + item, 0) / values.length;
  }

  function setActiveSection(sectionKey) {
    if (!config.sections.includes(sectionKey)) {
      sectionKey = config.sections[0];
    }
    Object.entries(sections).forEach(([key, element]) => {
      element?.classList.toggle('active', key === sectionKey);
    });
    navLinks.forEach((link) => {
      const matches = link.dataset.section === sectionKey;
      const shouldShow = config.sections.includes(link.dataset.section);
      link.classList.toggle('active', matches);
      link.classList.toggle('hidden', !shouldShow);
    });
    const activeLink = navLinks.find((link) => link.dataset.section === sectionKey && !link.classList.contains('hidden'));
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

    const dots = currentPoints.split(' ').map((point) => {
      const [x, y] = point.split(',').map(Number);
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
        ${dots}
        ${labels}
      </svg>
    `;
  }

  function renderDonutChart(container, legendContainer, dataset) {
    if (!container || !legendContainer || !dataset.length) return;
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
    element.style.setProperty('--progress-value', overall || 0);
    element.querySelector('.progress-value').textContent = `${overall || 0}%`;
  }

  function renderCenterProgress(container, centersData, childrenData) {
    if (!container) return;
    if (!centersData.length) {
      container.innerHTML = '<div class="empty-state">No center data available for this account yet.</div>';
      return;
    }
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
    if (!centersData.length) {
      container.innerHTML = '<div class="empty-state">No centers are assigned to this account yet.</div>';
      return;
    }
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
    if (!centersData.length) {
      container.innerHTML = '<div class="empty-state">No mapped centers to display.</div>';
      return;
    }
    container.innerHTML = centersData.map((center) => {
      if (!center.map) return '';
      return `<div class="map-pin" style="left:${center.map.x}%; top:${center.map.y}%"><span>${center.name}</span></div>`;
    }).join('');
  }

  function renderSpecialists(container, specialistsData) {
    if (!container) return;
    if (!specialistsData.length) {
      container.innerHTML = '<div class="empty-state">No specialists available. Create one from the accounts section.</div>';
      return;
    }
    container.innerHTML = specialistsData.map((specialist) => `
      <article class="specialist-card">
        <div class="avatar" style="background-image:url(${specialist.avatar}); background-size:cover; background-position:center;"></div>
        <strong>${specialist.name}</strong>
        <span class="muted">${specialist.specialty || 'Specialist'}</span>
        <p>${specialist.focus || 'Specialist profile coming soon.'}</p>
        <span class="badge badge-soft">${specialist.tenure || 'New specialist'}</span>
      </article>
    `).join('');
  }

  function renderSpecialistRoster(container, centersData, specialistsData, kidsData) {
    if (!container) return;
    if (!centersData.length) {
      container.innerHTML = '<div class="empty-state">No centers are linked to this roster yet.</div>';
      return;
    }
    container.innerHTML = centersData.map((center) => {
      const centerSpecialists = specialistsData.filter((spec) => spec.centerId === center.id);
      const centerKids = kidsData.filter((kid) => kid.centerId === center.id);
      return `
        <div class="roster-group">
          <header>
            <strong>${center.name}</strong>
            <span class="badge badge-role">${centerSpecialists.length} specialists</span>
          </header>
          <ul>
            ${centerSpecialists.length ? centerSpecialists.map((spec) => {
              const assignedKids = centerKids.filter((kid) => kid.specialistUsername === spec.username).length;
              return `<li><span>${spec.name}</span><span>${assignedKids} children</span></li>`;
            }).join('') : '<li>No specialists yet</li>'}
          </ul>
        </div>
      `;
    }).join('');
  }

  function renderModules(container, modulesData) {
    if (!container) return;
    if (!modulesData.length) {
      container.innerHTML = '<div class="empty-state">No VR modules assigned yet.</div>';
      return;
    }
    container.innerHTML = modulesData.map((module) => `
      <article class="module-card">
        <header>
          <strong>${module.name}</strong>
          <span class="tag">${module.category}</span>
        </header>
        <p class="muted">${module.focus}</p>
        <div class="module-meta">
          <span>⏱️ ${module.duration}</span>
          <span>🧭 ${module.sessions || 0} sessions</span>
        </div>
      </article>
    `).join('');
  }

  function renderAssessmentCenterSummary(centerId, centersData, specialistsData, kidsData, modulesData) {
    if (!assessmentCenterSummary) return;
    if (!centerId) {
      assessmentCenterSummary.innerHTML = '<div class="empty-state">Select a center to review assessment details.</div>';
      return;
    }
    const center = centersData.find((item) => item.id === centerId);
    if (!center) {
      assessmentCenterSummary.innerHTML = '<div class="empty-state">Selected center is no longer available.</div>';
      return;
    }

    const centerKids = kidsData.filter((kid) => kid.centerId === centerId);
    const centerSpecialists = specialistsData.filter((spec) => spec.centerId === centerId);
    const progressAverage = centerKids.length ? Math.round(average(centerKids.map((kid) => kid.progress)) * 100) : 0;
    const moduleFrequency = new Map();
    const uniqueModules = new Set();

    centerKids.forEach((kid) => {
      (kid.moduleIds || []).forEach((id) => {
        uniqueModules.add(id);
        moduleFrequency.set(id, (moduleFrequency.get(id) || 0) + 1);
      });
    });

    const moduleChips = moduleFrequency.size
      ? Array.from(moduleFrequency.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([moduleId, count]) => {
            const module = modulesData.find((item) => item.id === moduleId);
            const name = module ? module.name : moduleId;
            return `<span class="module-chip">${name} • ${count}</span>`;
          })
          .join('')
      : '<span class="muted">No module assignments yet.</span>';

    const childList = centerKids.length
      ? `<ul>${centerKids.map((child) => {
          const activeClass = assessmentState.childId === child.id ? 'active' : '';
          return `
            <li class="center-child-row ${activeClass}" data-child="${child.id}">
              <div>
                <strong>${child.name}</strong>
                <span class="muted">Age ${child.age} • ${Math.round(child.progress * 100)}% progress</span>
              </div>
              <span class="tag">Streak ${child.streak}</span>
            </li>
          `;
        }).join('')}</ul>`
      : '<div class="empty-state small">No children assigned to this center yet.</div>';

    assessmentCenterSummary.innerHTML = `
      <header class="center-summary-header">
        <div>
          <strong>${center.name}</strong>
          <p class="muted">${center.location}</p>
        </div>
        <span class="badge badge-soft">${centerKids.length} children</span>
      </header>
      <ul class="center-summary-metrics">
        <li><strong>${centerSpecialists.length}</strong><span>Specialists</span></li>
        <li><strong>${uniqueModules.size}</strong><span>Active modules</span></li>
        <li><strong>${progressAverage}%</strong><span>Avg. progress</span></li>
      </ul>
      <div class="center-summary-modules">
        <span class="muted">Top modules</span>
        <div class="module-chips">${moduleChips}</div>
      </div>
      <div class="center-children-list">
        <span class="muted">Children in this center</span>
        ${childList}
      </div>
    `;

    assessmentCenterSummary.querySelectorAll('.center-child-row').forEach((row) => {
      row.addEventListener('click', () => {
        assessmentState.childId = row.dataset.child;
        if (assessmentChildSelect) {
          assessmentChildSelect.value = assessmentState.childId;
        }
        const kidsForCenter = kidsData.filter((kid) => kid.centerId === centerId);
        renderAssessment(assessmentState.childId, kidsForCenter, modulesData);
        renderAssessmentCenterSummary(centerId, centersData, specialistsData, kidsData, modulesData);
      });
    });
  }

  function renderAssessment(childId, kidsData, modulesData) {
    const child = kidsData.find((item) => item.id === childId) || kidsData[0];
    if (!child) {
      assessmentState.childId = null;
      assessmentSummary.innerHTML = '<div class="empty-state">No children available for this center.</div>';
      assessmentModules.innerHTML = '';
      saveAssessmentBtn.disabled = true;
      if (assessmentStatus) {
        assessmentStatus.textContent = 'Add children to this center to capture assessments.';
        assessmentStatus.style.color = '';
      }
      return;
    }

    assessmentState.childId = child.id;
    const center = data.centers.find((item) => item.id === child.centerId);
    const moduleList = child.moduleIds?.map((id) => modulesData.find((module) => module.id === id)).filter(Boolean);
    const modulesToRender = moduleList && moduleList.length ? moduleList : modulesData.slice(0, 3);

    if (!modulesToRender.length) {
      assessmentModules.innerHTML = '<div class="empty-state">No VR modules assigned to this child yet.</div>';
      saveAssessmentBtn.disabled = true;
      if (assessmentStatus) {
        assessmentStatus.textContent = 'Assign VR modules before recording outcomes.';
        assessmentStatus.style.color = '';
      }
      return;
    }

    if (assessmentStatus) {
      assessmentStatus.textContent = 'Draft not saved';
      assessmentStatus.style.color = '';
    }

    saveAssessmentBtn.disabled = false;
    assessmentSummary.innerHTML = `
      <strong>${child.name}</strong>
      <div class="pill">Age ${child.age}</div>
      <div class="pill">${center ? center.name : '—'}</div>
      <p class="muted">Current focus: ${child.program}</p>
      <p class="muted">Streak: ${child.streak} active weeks • Progress ${Math.round(child.progress * 100)}%</p>
    `;

    assessmentModules.innerHTML = modulesToRender.map((module, index) => `
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

  function populateAssessmentCenters(centersData, kidsData) {
    if (!assessmentCenterSelect) return;
    if (!centersData.length) {
      assessmentCenterSelect.innerHTML = '';
      assessmentCenterSelect.disabled = true;
      assessmentState.centerId = null;
      if (assessmentCenterSummary) {
        assessmentCenterSummary.innerHTML = '<div class="empty-state">Add a center to begin tracking assessments.</div>';
      }
      populateAssessmentSelector(null, [], []);
      return;
    }

    if (!assessmentState.centerId || !centersData.some((center) => center.id === assessmentState.centerId)) {
      assessmentState.centerId = centersData[0].id;
    }

    assessmentCenterSelect.disabled = false;
    assessmentCenterSelect.innerHTML = centersData.map((center) => {
      const kidCount = kidsData.filter((kid) => kid.centerId === center.id).length;
      return `<option value="${center.id}">${center.name} (${kidCount})</option>`;
    }).join('');
    assessmentCenterSelect.value = assessmentState.centerId;
  }

  function populateAssessmentSelector(centerId, childrenData, modulesData) {
    if (!assessmentChildSelect) return;

    if (!childrenData.length) {
      assessmentChildSelect.innerHTML = '';
      assessmentChildSelect.disabled = true;
      assessmentState.childId = null;
      assessmentSummary.innerHTML = '<div class="empty-state">No children assigned yet.</div>';
      assessmentModules.innerHTML = '';
      saveAssessmentBtn.disabled = true;
      if (assessmentStatus) {
        assessmentStatus.textContent = centerId ? 'Add children to this center to capture assessments.' : 'Select a center to begin.';
        assessmentStatus.style.color = '';
      }
      return;
    }

    if (!assessmentState.childId || !childrenData.some((child) => child.id === assessmentState.childId)) {
      assessmentState.childId = childrenData[0].id;
    }

    assessmentChildSelect.disabled = false;
    assessmentChildSelect.innerHTML = childrenData.map((child) => `
      <option value="${child.id}">${child.name}</option>
    `).join('');
    assessmentChildSelect.value = assessmentState.childId;
    renderAssessment(assessmentState.childId, childrenData, modulesData);
  }

  function renderAssessmentHistory(entries, kidsData, modulesData) {
    if (!assessmentHistory) return;
    if (!entries.length) {
      assessmentHistory.innerHTML = '<div class="empty-state">No assessments recorded for this center yet.</div>';
      return;
    }
    const sorted = [...entries].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
    assessmentHistory.innerHTML = sorted.map((entry) => {
      const specialist = findUser(data.users, entry.specialistUsername);
      const child = kidsData.find((kid) => kid.id === entry.childId);
      const module = modulesData.find((mod) => mod.id === entry.moduleId);
      const center = data.centers.find((item) => item.id === entry.centerId);
      const date = new Date(entry.recordedAt);
      return `
        <div class="assessment-entry">
          <header>
            <strong>${child ? child.name : entry.childId}</strong>
            <span class="badge badge-role">${module ? module.name : entry.moduleId}</span>
          </header>
          <p class="muted">${entry.notes || 'No notes recorded for this session.'}</p>
          <footer>
            <span>Score: ${entry.score}</span>
            <span>${center ? center.name : '—'} · ${specialist ? specialist.name : entry.specialistUsername} · ${date.toLocaleString()}</span>
          </footer>
        </div>
      `;
    }).join('');
  }

  function renderAccountDirectory(container, centersData, usersData, kidsData) {
    if (!container) return;
    if (!centersData.length) {
      container.innerHTML = '<div class="empty-state">No centers available to show yet.</div>';
      return;
    }
    container.innerHTML = centersData.map((center) => {
      const admin = usersData.find((member) => member.role === 'center-admin' && member.centerId === center.id);
      const specialists = usersData.filter((member) => member.role === 'specialist' && member.centerId === center.id);
      const assignedKids = kidsData.filter((kid) => kid.centerId === center.id);
      return `
        <div class="account-card">
          <strong>${center.name}</strong>
          <div class="account-meta">
            <span>${center.location}</span>
            <span>${specialists.length} specialists</span>
            <span>${assignedKids.length} children</span>
          </div>
          <p class="muted">Admin: ${admin ? `${admin.name} (${admin.username})` : 'Pending assignment'}</p>
          <p class="muted">Specialists: ${specialists.length ? specialists.map((spec) => spec.name).join(', ') : '—'}</p>
        </div>
      `;
    }).join('');
  }

  function collectVisibleData() {
    const allSpecialists = data.users.filter((member) => member.role === 'specialist').map((spec) => ensureAvatar(spec));
    const centersForUser = cloneForRender(data.centers);
    const specialistsForUser = cloneForRender(allSpecialists);
    const kidsForUser = cloneForRender(data.kids);
    const modulesForUser = cloneForRender(data.modules);
    const assessmentsForUser = cloneForRender(data.assessments);

    return { centersForUser, specialistsForUser, kidsForUser, modulesForUser, assessmentsForUser };
  }

  function updateSpecialistCenterOptions() {
    if (!specialistCenterField) return;
    const select = specialistCenterField.querySelector('select');
    if (!select) return;
    select.innerHTML = data.centers.map((center) => `<option value="${center.id}">${center.name}</option>`).join('');
  }

  function showCredentialFeedback(target, message, username, password) {
    if (!target) return;
    target.classList.add('success');
    target.classList.remove('error');
    target.textContent = '';
    const prefix = document.createElement('span');
    prefix.textContent = `${message} `;
    const usernameCode = document.createElement('code');
    usernameCode.textContent = username;
    const passwordCode = document.createElement('code');
    passwordCode.textContent = password;
    target.append(prefix, usernameCode, ' / ', passwordCode);
  }

  function updateSummary(viewData) {
    summaryCenters.textContent = viewData.centersForUser.length;
    summarySpecialists.textContent = viewData.specialistsForUser.length;
    summaryKids.textContent = viewData.kidsForUser.length;
    summaryModules.textContent = viewData.modulesForUser.length;

    renderLineChart(vrChartContainer, VR_TIMELINE);
    const latest = VR_TIMELINE[VR_TIMELINE.length - 1];
    vrMonthTotal.textContent = `${formatNumber(latest.current)} min`;
    const delta = latest.previous ? ((latest.current - latest.previous) / latest.previous) * 100 : 0;
    vrMonthChange.textContent = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
    vrMonthChange.classList.toggle('positive', delta >= 0);

    renderDonutChart(deviceDonut, deviceLegend, DEVICE_USAGE);
    renderLearningProgress(learningProgress, viewData.kidsForUser);
    renderCenterProgress(centerProgress, viewData.centersForUser, viewData.kidsForUser);
    renderRecommendations(recommendationList, RECOMMENDATIONS);
  }

  function refreshDashboard() {
    const viewData = collectVisibleData();
    updateSpecialistCenterOptions();
    updateSummary(viewData);
    renderCenters(centersGrid, viewData.centersForUser);
    renderMapPins(mapPins, viewData.centersForUser);
    renderSpecialists(specialistsGrid, viewData.specialistsForUser);
    renderSpecialistRoster(specialistRoster, viewData.centersForUser, viewData.specialistsForUser, viewData.kidsForUser);
    renderModules(modulesGrid, viewData.modulesForUser);
    populateAssessmentCenters(viewData.centersForUser, viewData.kidsForUser);
    const kidsForSelectedCenter = assessmentState.centerId
      ? viewData.kidsForUser.filter((kid) => kid.centerId === assessmentState.centerId)
      : [];
    populateAssessmentSelector(assessmentState.centerId, kidsForSelectedCenter, viewData.modulesForUser);
    renderAssessmentCenterSummary(assessmentState.centerId, viewData.centersForUser, viewData.specialistsForUser, viewData.kidsForUser, viewData.modulesForUser);
    const assessmentEntries = assessmentState.centerId
      ? viewData.assessmentsForUser.filter((entry) => entry.centerId === assessmentState.centerId)
      : viewData.assessmentsForUser;
    renderAssessmentHistory(assessmentEntries, viewData.kidsForUser, viewData.modulesForUser);
    if (config.showAccounts) {
      renderAccountDirectory(accountList, viewData.centersForUser, data.users, viewData.kidsForUser);
    }
  }

  sidebarName.textContent = user.name || 'UnitySphere User';
  sidebarEmail.textContent = user.email || `${user.username}@unitysphere.test`;
  userNameTarget.textContent = user.name || 'UnitySphere User';
  userRoleTarget.textContent = formatRole(user.role);

  const avatarImage = user.avatar || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60';
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

  setActiveSection(config.sections[0]);

  logoutBtn?.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  assessmentCenterSelect?.addEventListener('change', (event) => {
    assessmentState.centerId = event.target.value;
    assessmentState.childId = null;
    refreshDashboard();
    setActiveSection('assessment');
  });

  assessmentChildSelect?.addEventListener('change', (event) => {
    assessmentState.childId = event.target.value;
    const viewData = collectVisibleData();
    const kidsForCenter = assessmentState.centerId
      ? viewData.kidsForUser.filter((kid) => kid.centerId === assessmentState.centerId)
      : viewData.kidsForUser;
    renderAssessment(assessmentState.childId, kidsForCenter, viewData.modulesForUser);
    renderAssessmentCenterSummary(assessmentState.centerId, viewData.centersForUser, viewData.specialistsForUser, viewData.kidsForUser, viewData.modulesForUser);
  });

  saveAssessmentBtn?.addEventListener('click', () => {
    const viewData = collectVisibleData();
    const childId = assessmentChildSelect?.value;
    const child = viewData.kidsForUser.find((item) => item.id === childId);
    if (!child) {
      assessmentStatus.textContent = 'Select a child before recording outcomes.';
      assessmentStatus.style.color = 'var(--color-warning)';
      return;
    }
    const entries = Array.from(assessmentModules.querySelectorAll('.module-form')).map((moduleForm) => {
      const moduleId = moduleForm.dataset.module;
      const scoreDisplay = moduleForm.querySelector('strong[id^="score-"]');
      const score = scoreDisplay ? Number(scoreDisplay.textContent) : 0;
      const notes = moduleForm.querySelector('textarea')?.value.trim();
      return {
        id: `assess-${Date.now()}-${moduleId}`,
        childId,
        centerId: child.centerId,
        moduleId,
        score,
        notes,
        specialistUsername: user.username,
        recordedAt: new Date().toISOString()
      };
    });
    data.assessments.push(...entries);
    saveData(data);
    assessmentStatus.textContent = 'Outcomes saved to timeline';
    assessmentStatus.style.color = 'var(--color-positive)';
    refreshDashboard();
    setTimeout(() => {
      assessmentStatus.textContent = 'Draft not saved';
      assessmentStatus.style.color = '';
    }, 3200);
  });

  if (!config.showAccounts) {
    sections.accounts?.classList.add('hidden');
    navLinks.filter((link) => link.dataset.section === 'accounts').forEach((link) => link.classList.add('hidden'));
  } else if (accountsSubtitle) {
    accountsSubtitle.textContent = 'Create credentials for every center and specialist.';
  }

  if (!config.canCreateCenter && centerAdminCard) {
    centerAdminCard.classList.add('hidden');
  }

  if (!config.canCreateSpecialist && specialistCard) {
    specialistCard.classList.add('hidden');
  }

  if (specialistCenterField) {
    specialistCenterField.classList.remove('hidden');
    updateSpecialistCenterOptions();
  }

  centerAdminForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!config.canCreateCenter) return;
    if (!centerAdminFeedback) return;
    const formData = new FormData(centerAdminForm);
    const centerName = formData.get('centerName').toString().trim();
    const centerLocation = formData.get('centerLocation').toString().trim();
    const centerFocus = formData.get('centerFocus').toString().trim();
    const adminName = formData.get('adminName').toString().trim();
    const usernameInput = formData.get('username').toString().trim();
    const password = formData.get('password').toString().trim();

    if (!centerName || !centerLocation || !centerFocus || !adminName || !usernameInput || !password) {
      centerAdminFeedback.textContent = 'Please fill out all fields.';
      centerAdminFeedback.classList.remove('success');
      centerAdminFeedback.classList.add('error');
      return;
    }

    if (findUser(data.users, usernameInput)) {
      centerAdminFeedback.textContent = 'Username already exists. Choose another one.';
      centerAdminFeedback.classList.remove('success');
      centerAdminFeedback.classList.add('error');
      return;
    }

    const centerId = `center-${Date.now()}`;
    data.centers.push({
      id: centerId,
      name: centerName,
      location: centerLocation,
      focus: centerFocus,
      programs: [centerFocus],
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=60',
      map: generateMapPoint()
    });

    data.users.push({
      username: usernameInput,
      password,
      name: adminName,
      role: 'center-admin',
      centerId,
      email: `${usernameInput}@unitysphere.test`
    });

    saveData(data);
    assessmentState.centerId = centerId;
    assessmentState.childId = null;
    showCredentialFeedback(centerAdminFeedback, 'Center admin created successfully. Credentials:', usernameInput, password);
    centerAdminForm.reset();
    refreshDashboard();
  });

  specialistForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!config.canCreateSpecialist) return;
    if (!specialistFeedback) return;
    const formData = new FormData(specialistForm);
    const name = formData.get('name').toString().trim();
    const specialty = formData.get('specialty').toString().trim();
    const focus = formData.get('focus').toString().trim();
    const usernameInput = formData.get('username').toString().trim();
    const password = formData.get('password').toString().trim();
    const centerId = formData.get('centerId') ? formData.get('centerId').toString() : '';

    if (!name || !specialty || !focus || !usernameInput || !password || !centerId) {
      specialistFeedback.textContent = 'Please complete the specialist details.';
      specialistFeedback.classList.remove('success');
      specialistFeedback.classList.add('error');
      return;
    }

    if (findUser(data.users, usernameInput)) {
      specialistFeedback.textContent = 'Username already exists. Choose another one.';
      specialistFeedback.classList.remove('success');
      specialistFeedback.classList.add('error');
      return;
    }

    data.users.push({
      username: usernameInput,
      password,
      name,
      role: 'specialist',
      centerId,
      specialty,
      focus,
      tenure: 'New specialist',
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(usernameInput)}`
    });

    saveData(data);
    showCredentialFeedback(specialistFeedback, 'Specialist created. Credentials:', usernameInput, password);
    specialistForm.reset();
    refreshDashboard();
  });

  addCenterBtn?.addEventListener('click', () => {
    setActiveSection('accounts');
    centerAdminForm?.scrollIntoView({ behavior: 'smooth' });
  });

  inviteSpecialistBtn?.addEventListener('click', () => {
    setActiveSection('accounts');
    specialistForm?.scrollIntoView({ behavior: 'smooth' });
  });

  toggleModuleFormBtn?.addEventListener('click', () => {
    if (!moduleFormCard) return;
    moduleFormCard.classList.toggle('open');
    const isOpen = moduleFormCard.classList.contains('open');
    toggleModuleFormBtn.textContent = isOpen ? 'Close module form' : 'Add VR module';
    if (isOpen) {
      moduleFormCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (moduleFeedback) {
      moduleFeedback.textContent = '';
      moduleFeedback.classList.remove('success', 'error');
    }
  });

  moduleForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!moduleFeedback) return;
    const formData = new FormData(moduleForm);
    const name = formData.get('moduleName').toString().trim();
    const category = formData.get('moduleCategory').toString().trim();
    const duration = formData.get('moduleDuration').toString().trim();
    const focus = formData.get('moduleFocus').toString().trim();
    const sessionsRaw = formData.get('moduleSessions').toString().trim();
    const parsedSessions = sessionsRaw ? Number(sessionsRaw) : 0;

    if (!name || !category || !duration || !focus) {
      moduleFeedback.textContent = 'Fill in all module details before saving.';
      moduleFeedback.classList.remove('success');
      moduleFeedback.classList.add('error');
      return;
    }

    if (Number.isNaN(parsedSessions) || parsedSessions < 0) {
      moduleFeedback.textContent = 'Enter a valid non-negative session count.';
      moduleFeedback.classList.remove('success');
      moduleFeedback.classList.add('error');
      return;
    }

    const moduleId = `module-${Date.now()}`;
    const sessions = sessionsRaw ? Math.max(0, Math.round(parsedSessions)) : 0;
    data.modules.push({
      id: moduleId,
      name,
      category,
      duration,
      focus,
      sessions
    });

    saveData(data);
    moduleFeedback.textContent = `VR module ${name} added. Reference ID: ${moduleId}`;
    moduleFeedback.classList.add('success');
    moduleFeedback.classList.remove('error');
    moduleForm.reset();
    refreshDashboard();
  });

  refreshDashboard();
}


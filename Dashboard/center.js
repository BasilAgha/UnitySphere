let center = {};
let centerId = null;
let childrenCache = [];
let specialistsCache = [];
let allModulesCache = [];
let assignModulesSelection = null;
let assignModulesAssignmentMap = new Map();
let shellSidebar = null;
let assessmentCharts = {};
let assessmentChildrenCache = [];

document.addEventListener("DOMContentLoaded", () => {
  authGuard("center");
  center = getCurrentUser();
  centerId = center.center_id;

  wrapModalClose();
  initModalClose();
  initShell();

  bindNavigation();
  bindCenterButtons();
  setUserAvatar();
  setWelcomeName();

  document.addEventListener("unitysphere:search", (event) => {
    applyGlobalSearch(event.detail.query);
  });

  bindAssessmentFilters();
  loadSection("dashboard");
  setActiveSidebarForSection("dashboard");
  updateHeaderTitle("dashboard");
});

function initShell() {
  const sidebarHost = document.getElementById("appSidebar");
  const headerHost = document.getElementById("appHeader");
  if (!sidebarHost || !headerHost || !window.UnitySphereShell) return;
  const sidebar = window.UnitySphereShell.buildSidebar({ role: "center", active: "dashboard" });
  const header = window.UnitySphereShell.buildHeader({ title: "Dashboard" });
  sidebarHost.replaceWith(sidebar);
  headerHost.replaceWith(header);
  shellSidebar = sidebar;
  window.UnitySphereShell.wireEscManager();

  sidebar.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-nav]");
    if (!nav || nav.classList.contains("disabled")) return;
    const section = mapNavToSection(nav.dataset.nav);
    if (!section) return;
    switchSection(section);
    updateHeaderTitle(section);
    loadSection(section);
    window.UnitySphereShell.setActiveNavItem(sidebar, nav.dataset.nav);
  });
}

function bindNavigation() {
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;
      switchSection(section);
      updateHeaderTitle(section);
      loadSection(section);
      setActiveSidebarForSection(section);
    });
  });
}

function bindCenterButtons() {
  document.getElementById("btnAddSpecialist")?.addEventListener("click", openAddSpecialistModal);
  document.getElementById("btnAddChild")?.addEventListener("click", openAddChildModal);
  document.getElementById("btnAssignModules")?.addEventListener("click", e => openAssignModulesModal(e.currentTarget));
  document.getElementById("specialistsEmptyAdd")?.addEventListener("click", openAddSpecialistModal);
  document.getElementById("childrenEmptyAdd")?.addEventListener("click", openAddChildModal);
  document.getElementById("modulesEmptyAssign")?.addEventListener("click", e => openAssignModulesModal(e.currentTarget));
  document.getElementById("childSaveBtn")?.addEventListener("click", saveChild);
  document.getElementById("specSaveBtn")?.addEventListener("click", saveSpecialist);
  document.getElementById("assignModulesSaveBtn")?.addEventListener("click", saveAssignedModules);
  document.getElementById("assignModulesSelectAll")?.addEventListener("click", () => {
    toggleAssignModulesSelection(true);
  });
  document.getElementById("assignModulesClearAll")?.addEventListener("click", () => {
    toggleAssignModulesSelection(false);
  });
  document.getElementById("refreshAllBtn")?.addEventListener("click", () => {
    const btn = document.getElementById("refreshAllBtn");
    setButtonLoading(btn, true, "Refreshing...");
    const active = document.querySelector(".section.active")?.id.replace("section-", "") || "dashboard";
    updateHeaderTitle(active);
    loadSection(active);
    setTimeout(() => setButtonLoading(btn, false), 400);
  });
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
}

function loadSection(section) {
  switch (section) {
    case "dashboard":
      loadOverview();
      break;
    case "specialists":
      loadSpecialists();
      break;
    case "children":
      loadChildren();
      break;
    case "vr-modules":
      loadModules();
      break;
    case "assessment":
      loadAssessmentSection();
      break;
  }
}

function handleApiFailure(res) {
  if (!res?.success) {
    showToast(res?.error || "Operation failed", "error");
    return true;
  }
  return false;
}

function setModalError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.style.display = "block";
  } else {
    el.textContent = "";
    el.style.display = "none";
  }
}

function wrapModalClose() {
  const baseClose = window.closeModal;
  if (typeof baseClose !== "function") return;
  window.closeModal = id => {
    baseClose(id);
    if (id === "childModal") resetChildModal();
    if (id === "specialistModal") resetSpecialistModal();
    if (id === "assignModulesModal") resetAssignModulesModal();
  };
}

function resetChildModal() {
  const modal = document.getElementById("childModal");
  if (!modal) return;
  document.getElementById("childModalTitle").textContent = "Add Child";
  document.getElementById("childIdInput").value = "";
  document.getElementById("childNameInput").value = "";
  document.getElementById("childAgeInput").value = "";
  document.getElementById("childParentMobileInput").value = "";
  document.getElementById("childNotesInput").value = "";
  const status = document.getElementById("childStatusInput");
  if (status) status.value = "active";
  setModalError("childModalError", "");
  setButtonLoading(document.getElementById("childSaveBtn"), false);
}

function resetSpecialistModal() {
  const modal = document.getElementById("specialistModal");
  if (!modal) return;
  document.getElementById("specialistModalTitle").textContent = "Add Specialist";
  document.getElementById("specIdInput").value = "";
  document.getElementById("specNameInput").value = "";
  document.getElementById("specUsernameInput").value = "";
  document.getElementById("specPasswordInput").value = "";
  document.getElementById("specDescriptionInput").value = "";
  setModalError("specModalError", "");
  setButtonLoading(document.getElementById("specSaveBtn"), false);
}

function resetAssignModulesModal() {
  const modal = document.getElementById("assignModulesModal");
  if (!modal) return;
  const assignedList = document.getElementById("assignModulesAssigned");
  const unassignedList = document.getElementById("assignModulesUnassigned");
  if (assignedList) assignedList.innerHTML = "";
  if (unassignedList) unassignedList.innerHTML = "";
  updateAssignModulesCounts(0, 0);
  setButtonLoading(document.getElementById("assignModulesSaveBtn"), false);
}

function getInitials(name = "") {
  const cleaned = name.trim();
  if (!cleaned) return "NA";
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function setUserAvatar() {
  const name = center.name || center.username || "Center";
  const photo = center.photo || center.photo_url || "";
  if (typeof applyAvatarFallbackToSelector === "function") {
    applyAvatarFallbackToSelector(".sidebar .avatar, .shell-header .avatar", name, photo);
    return;
  }
  document.querySelectorAll(".sidebar .avatar, .shell-header .avatar").forEach(avatar => {
    if (photo) {
      avatar.style.backgroundImage = `url('${photo}')`;
      avatar.classList.add("has-photo");
      avatar.removeAttribute("data-initials");
    } else {
      avatar.style.backgroundImage = "";
      avatar.classList.remove("has-photo");
      avatar.setAttribute("data-initials", getInitials(name));
    }
  });
}

function updateHeaderTitle(section) {
  const title = document.querySelector(".shell-header .title");
  if (!title) return;
  const map = {
    dashboard: "Dashboard",
    specialists: "Specialists",
    children: "Children",
    "vr-modules": "VR Modules",
    assessment: "Assessment"
  };
  title.textContent = map[section] || "Dashboard";
}

function mapNavToSection(navId) {
  const map = {
    dashboard: "dashboard",
    specialists: "specialists",
    children: "children",
    "vr-modules": "vr-modules",
    assessment: "assessment"
  };
  return map[navId] || null;
}

function setActiveSidebarForSection(section) {
  if (!shellSidebar || !window.UnitySphereShell?.setActiveNavItem) return;
  const map = {
    dashboard: "dashboard",
    specialists: "specialists",
    children: "children",
    "vr-modules": "vr-modules",
    assessment: "assessment"
  };
  const navId = map[section];
  if (navId) {
    window.UnitySphereShell.setActiveNavItem(shellSidebar, navId);
  }
}

function setWelcomeName() {
  const welcome = document.getElementById("welcomeName");
  if (!welcome) return;
  welcome.textContent = center.name || center.username || "Center";
}

function bindAssessmentFilters() {
  const childSearch = document.getElementById("assessmentChildSearch");
  const childList = document.getElementById("assessmentChildList");
  const childSelect = document.getElementById("assessmentChildSelect");

  childSearch?.addEventListener("input", () => {
    const term = childSearch.value.trim().toLowerCase();
    if (childSelect) childSelect.value = "";
    const filtered = assessmentChildrenCache.filter(child =>
      String(child.name || "").toLowerCase().includes(term)
    );
    renderAssessmentChildrenList(filtered);
  });

  childList?.addEventListener("click", (event) => {
    const option = event.target.closest("[data-child-id]");
    if (!option) return;
    if (childSearch) childSearch.value = option.textContent;
    if (childSelect) childSelect.value = option.dataset.childId;
    handleAssessmentChildSelect(option.dataset.childId);
  });

  childSelect?.addEventListener("change", () => {
    const selectedId = childSelect.value;
    if (!selectedId) return;
    const child = assessmentChildrenCache.find(item => String(item.child_id) === String(selectedId));
    if (childSearch) childSearch.value = child?.name || "";
    handleAssessmentChildSelect(selectedId);
  });
}

async function loadAssessmentSection() {
  await loadAssessmentChildren();
  clearAssessmentDetails();
}

async function loadAssessmentChildren() {
  const res = await apiRequest("listChildren", { center_id: centerId });
  if (handleApiFailure(res)) return;
  const children = res.children || [];
  assessmentChildrenCache = [...children].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" })
  );
  renderAssessmentChildrenList(assessmentChildrenCache);
  renderAssessmentChildSelect(assessmentChildrenCache);
}

function renderAssessmentChildrenList(children) {
  const list = document.getElementById("assessmentChildList");
  if (!list) return;
  list.innerHTML = "";
  const wrapper = list.closest(".child-dropdown");
  if (wrapper) {
    wrapper.classList.toggle("has-items", children.length > 0);
  }
  children.forEach(child => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "child-option";
    btn.setAttribute("role", "option");
    btn.dataset.childId = child.child_id;
    btn.textContent = child.name || `Child ${child.child_id}`;
    list.appendChild(btn);
  });
}

function renderAssessmentChildSelect(children) {
  const select = document.getElementById("assessmentChildSelect");
  if (!select) return;
  select.innerHTML = '<option value="">Select child</option>';
  children.forEach(child => {
    const option = document.createElement("option");
    option.value = child.child_id;
    option.textContent = child.name || `Child ${child.child_id}`;
    select.appendChild(option);
  });
}

function clearAssessmentDetails() {
  const details = document.getElementById("assessmentDetails");
  const emptyCard = document.getElementById("assessmentEmptyCard");
  if (details) details.style.display = "none";
  if (emptyCard) emptyCard.style.display = "grid";
  clearAssessmentCharts();
}

function clearAssessmentCharts() {
  Object.values(assessmentCharts).forEach(chart => {
    if (chart && typeof chart.destroy === "function") chart.destroy();
  });
  assessmentCharts = {};
}

async function handleAssessmentChildSelect(childId) {
  const child = assessmentChildrenCache.find(item => String(item.child_id) === String(childId));
  if (!child) return;

  const avatar = document.getElementById("assessmentChildAvatar");
  if (avatar) {
    const photo = child.photo || child.photo_url || child.photo_base64 || "";
    avatar.classList.toggle("has-photo", Boolean(photo));
    avatar.style.backgroundImage = photo ? `url('${photo}')` : "";
    avatar.setAttribute("data-initials", getInitials(child.name || "Child"));
  }

  const centerLabel = child.center_name || center.name || child.center_id || centerId || "--";
  setText("assessmentChildName", child.name || "Child");
  setText("assessmentChildAge", `Age: ${child.age || "--"}`);
  setText("assessmentChildCenter", `Center: ${centerLabel}`);

  const details = document.getElementById("assessmentDetails");
  const emptyCard = document.getElementById("assessmentEmptyCard");
  if (details) details.style.display = "grid";
  if (emptyCard) emptyCard.style.display = "none";

  const assessmentData = await fetchAssessmentData(child.child_id);
  renderAssessmentCharts(assessmentData);
}

async function fetchAssessmentData(childId) {
  const domains = [
    "Cognitive",
    "Language & Communication",
    "Social & Emotional",
    "Motor & Sensory",
    "Early Academic Skills",
    "Executive Function"
  ];

  let radarScores = null;
  let progressScores = null;

  const res = await apiRequest("listAssessmentResponses", { child_id: childId });
  if (res?.success && Array.isArray(res.responses) && res.responses.length) {
    const responses = res.responses;
    const grouped = domains.reduce((acc, domain) => {
      acc[domain] = [];
      return acc;
    }, {});

    responses.forEach(r => {
      const domain = r.category || r.domain || "";
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

  const radarCtx = document.getElementById("assessmentRadarChart")?.getContext("2d");
  if (radarCtx) {
    assessmentCharts.radar = new Chart(radarCtx, {
      type: "radar",
      data: {
        labels: domains,
        datasets: [
          {
            label: "Score",
            data: radarScores,
            backgroundColor: "rgba(168, 85, 247, 0.25)",
            borderColor: "#a855f7",
            pointBackgroundColor: "#a855f7",
            borderWidth: 2
          }
        ]
      },
      options: {
        scales: {
          r: {
            angleLines: { color: "rgba(255,255,255,0.08)" },
            grid: { color: "rgba(255,255,255,0.08)" },
            pointLabels: { color: "#cfd2e5", font: { size: 11 } },
            ticks: { color: "#9aa0b4", backdropColor: "transparent" },
            suggestedMin: 0,
            suggestedMax: 100
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  const lineCtx = document.getElementById("assessmentProgressChart")?.getContext("2d");
  if (lineCtx) {
    assessmentCharts.progress = new Chart(lineCtx, {
      type: "line",
      data: {
        labels: ["S1", "S2", "S3", "S4", "S5"],
        datasets: [
          {
            label: "Progress",
            data: progressScores,
            borderColor: "#a855f7",
            backgroundColor: "rgba(168, 85, 247, 0.15)",
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        scales: {
          x: { ticks: { color: "#9aa0b4" }, grid: { color: "rgba(255,255,255,0.05)" } },
          y: {
            min: 0,
            max: 100,
            ticks: { color: "#9aa0b4" },
            grid: { color: "rgba(255,255,255,0.05)" }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }
}

function applyGlobalSearch(query) {
  const term = String(query || "").trim().toLowerCase();
  const section = document.querySelector(".section.active");
  if (!section) return;
  section.querySelectorAll(".card, .stat-card, .specialist-card, .module-card").forEach(card => {
    const match = !term || card.textContent.toLowerCase().includes(term);
    card.classList.toggle("search-hidden", !match);
  });
}

function updateCenterSummary({ specialistsCount, childrenCount, assignedCount, totalModules }) {
  const avgEl = document.getElementById("summaryAvgChildren");
  const assignedEl = document.getElementById("summaryModulesAssigned");
  const coverageEl = document.getElementById("summaryModulesCoverage");
  const coverageBar = document.getElementById("summaryModulesCoverageBar");

  if (avgEl) {
    const avg = specialistsCount ? (childrenCount / specialistsCount).toFixed(1) : "0";
    avgEl.textContent = avg;
  }
  if (assignedEl) assignedEl.textContent = `${assignedCount}`;
  const coverage = totalModules ? Math.round((assignedCount / totalModules) * 100) : 0;
  if (coverageEl) coverageEl.textContent = `${coverage}%`;
  if (coverageBar) coverageBar.style.width = `${coverage}%`;
}

async function loadOverview() {
  setText("statSpecialists", 0);
  setText("statChildren", 0);
  setText("statModules", 0);
  setText("statSessions", 0);
  updateCenterSummary({
    specialistsCount: 0,
    childrenCount: 0,
    assignedCount: 0,
    totalModules: 0
  });

  const [stats, specialistsRes, modulesRes, allModulesRes] = await Promise.all([
    apiRequest("getCenterStats", { center_id: centerId }),
    apiRequest("listSpecialists", { center_id: centerId }),
    apiRequest("listCenterModules", { center_id: centerId }),
    apiRequest("listModules")
  ]);

  if (!handleApiFailure(stats)) {
    const totals = stats.totals || {};
    setText("statSpecialists", totals.specialists ?? 0);
    setText("statChildren", totals.children ?? 0);
    setText("statModules", totals.modules_assigned ?? 0);
    setText("statSessions", totals.sessions ?? 0);
  }

  if (handleApiFailure(specialistsRes) || handleApiFailure(modulesRes) || handleApiFailure(allModulesRes)) {
    return;
  }

  const totals = stats?.totals || {};
  const specialists = specialistsRes.specialists || [];
  const assignedModules = modulesRes.modules || [];
  const allModules = allModulesRes.modules || [];
  updateCenterSummary({
    specialistsCount: totals.specialists ?? specialists.length ?? 0,
    childrenCount: totals.children ?? 0,
    assignedCount: assignedModules.length,
    totalModules: allModules.length
  });
}

async function loadSpecialists() {
  const res = await apiRequest("listSpecialists", { center_id: centerId });

  const grid = document.getElementById("specialistsGrid");
  const empty = document.getElementById("specialistsEmpty");
  if (grid) grid.innerHTML = "";
  if (empty) empty.style.display = "none";

  if (handleApiFailure(res)) return;

  const list = res.specialists || [];
  specialistsCache = list;
  if (!list.length) {
    if (empty) empty.style.display = "block";
    return;
  }

  list.forEach(s => {
    const card = document.createElement("div");
    const avatar = s.photo || s.photo_url || "";
    const initials = getInitials(s.name || s.username || "");
    const experience = s.experience || s.years_experience || s.years || "";
    const experienceText = experience ? `${experience} Years of Experience` : "Experience not listed";
    const bio = s.bio || s.description || "Passionate specialist with extensive experience in technology-assisted child development.";
    card.className = "specialist-card flip-card hover-lift";
    card.innerHTML = `
      <div class="flip-card-inner">
        <div class="flip-card-face front">
          <div class="specialist-front">
            <div class="avatar avatar-static${avatar ? " has-photo" : ""}" ${avatar ? `style="background-image:url('${avatar}')"` : `data-initials="${initials}"`}></div>
            <strong>${s.name || s.username || "Specialist"}</strong>
            <div class="specialist-role">${s.specialty || s.type || "Psychology"}</div>
            <div class="language-pills">
              <span class="pill small">EN</span>
            </div>
          </div>
        </div>
        <div class="flip-card-face back">
          <div class="specialist-back">
            <div class="specialist-bio">${bio}</div>
            <div class="specialist-experience">${experienceText}</div>
            <div class="card-actions">
              <button class="icon-action" data-edit-specialist="${s.specialist_id}" aria-label="Edit specialist">✏️</button>
              <button class="icon-action danger" data-delete-specialist="${s.specialist_id}" aria-label="Delete specialist">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll("[data-edit-specialist]").forEach(btn => {
    btn.addEventListener("click", () => openEditSpecialistModal(btn.dataset.editSpecialist));
  });
  grid.querySelectorAll("[data-delete-specialist]").forEach(btn => {
    btn.addEventListener("click", () => deleteSpecialist(btn.dataset.deleteSpecialist, btn));
  });
}

async function loadChildren() {
  const res = await apiRequest("listChildren", { center_id: centerId });

  const grid = document.getElementById("childrenGrid");
  const empty = document.getElementById("childrenEmpty");
  if (grid) grid.innerHTML = "";
  if (empty) empty.style.display = "none";

  if (handleApiFailure(res)) return;

  const list = res.children || [];
  childrenCache = list;
  if (!list.length) {
    if (empty) empty.style.display = "block";
    return;
  }

  list.forEach(ch => {
    const card = document.createElement("article");
    card.className = "module-card";
    card.innerHTML = `
      <header>
        <strong>${ch.name || "Child"}</strong>
        <span class="chip subtle">${ch.age || "N/A"} yrs</span>
      </header>
      <div class="module-meta">
        <span>Spec: ${ch.specialist_id || "-"}</span>
        <span>Sessions: ${ch.num_sessions ?? 0}</span>
      </div>
      <div class="card-actions">
        <button class="ghost small" data-edit-child="${ch.child_id}">Edit</button>
        <button class="ghost small danger" data-delete-child="${ch.child_id}">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll("[data-edit-child]").forEach(btn => {
    btn.addEventListener("click", () => openEditChildModal(btn.dataset.editChild));
  });
  grid.querySelectorAll("[data-delete-child]").forEach(btn => {
    btn.addEventListener("click", () => deleteChild(btn.dataset.deleteChild, btn));
  });
}

async function loadModules() {
  const res = await apiRequest("listCenterModules", { center_id: centerId });

  const grid = document.getElementById("modulesGrid");
  const empty = document.getElementById("modulesEmpty");
  if (grid) grid.innerHTML = "";
  if (empty) empty.style.display = "none";

  if (handleApiFailure(res)) return;

  const list = res.modules || [];
  allModulesCache = allModulesCache.length ? allModulesCache : [];
  if (!list.length) {
    if (empty) empty.style.display = "block";
    return;
  }

  list.forEach(m => {
    const card = document.createElement("article");
    card.className = "module-card";
    card.innerHTML = `
      <header>
        <strong>${m.name || "VR Module"}</strong>
        <span class="chip subtle">${m.minutes_to_play ?? 0} min</span>
      </header>
      <div class="hint">${m.description || "No description"}</div>
    `;
    grid.appendChild(card);
  });
}

function updateAssignModulesCounts(assignedCount, unassignedCount) {
  const assignedEl = document.getElementById("assignModulesAssignedCount");
  const unassignedEl = document.getElementById("assignModulesUnassignedCount");
  if (assignedEl) assignedEl.textContent = `${assignedCount}`;
  if (unassignedEl) unassignedEl.textContent = `${unassignedCount}`;
}

function renderAssignModulesLists() {
  const assignedList = document.getElementById("assignModulesAssigned");
  const unassignedList = document.getElementById("assignModulesUnassigned");
  if (!assignedList || !unassignedList) return;
  assignedList.innerHTML = "";
  unassignedList.innerHTML = "";

  let assignedCount = 0;
  let unassignedCount = 0;

  allModulesCache.forEach(m => {
    const id = String(m.module_id || "");
    const checked = assignModulesSelection?.has(id);
    const assignmentId = assignModulesAssignmentMap.get(id) || "";
    const item = document.createElement("div");
    item.className = "panel";
    item.innerHTML = `
      <label style="display:flex; gap:0.6rem; align-items:flex-start;">
        <input type="checkbox" class="assign-module-checkbox" value="${id}" data-assignment-id="${assignmentId}" ${checked ? "checked" : ""}>
        <div>
          <strong>${m.name || "Module"}</strong>
          <div class="hint">${m.description || "No description"}</div>
        </div>
      </label>
    `;
    if (checked) {
      assignedCount += 1;
      assignedList.appendChild(item);
    } else {
      unassignedCount += 1;
      unassignedList.appendChild(item);
    }
  });

  updateAssignModulesCounts(assignedCount, unassignedCount);
}

function syncAssignModulesSelectionFromUI() {
  const list = document.getElementById("assignModulesList");
  if (!list) return;
  const checkboxes = Array.from(list.querySelectorAll(".assign-module-checkbox"));
  assignModulesSelection = new Set(
    checkboxes.filter(cb => cb.checked).map(cb => String(cb.value))
  );
}

function toggleAssignModulesSelection(selectAll) {
  const list = document.getElementById("assignModulesList");
  if (!list) return;
  const checkboxes = Array.from(list.querySelectorAll(".assign-module-checkbox"));
  checkboxes.forEach(cb => {
    cb.checked = selectAll;
  });
  assignModulesSelection = new Set(
    selectAll ? checkboxes.map(cb => String(cb.value)) : []
  );
  renderAssignModulesLists();
}

async function openAssignModulesModal(btn) {
  const modal = document.getElementById("assignModulesModal");
  const list = document.getElementById("assignModulesList");
  const assignedList = document.getElementById("assignModulesAssigned");
  const unassignedList = document.getElementById("assignModulesUnassigned");
  if (!modal || !list || !assignedList || !unassignedList) {
    showToast("Assign modules modal not available", "error");
    return;
  }

  setButtonLoading(btn, true, "Loading...");
  assignedList.innerHTML = "";
  unassignedList.innerHTML = "";

  const [modulesRes, assignedRes] = await Promise.all([
    apiRequest("listModules"),
    apiRequest("listCenterModules", { center_id: centerId })
  ]);

  setButtonLoading(btn, false);

  if (handleApiFailure(modulesRes)) return;
  if (handleApiFailure(assignedRes)) return;

  const rawModules = modulesRes.modules || [];
  const moduleById = new Map();
  rawModules.forEach(m => {
    const id = String(m.module_id || "");
    if (!id || moduleById.has(id)) return;
    moduleById.set(id, m);
  });
  allModulesCache = Array.from(moduleById.values());
  const assignedModules = assignedRes.modules || [];
  const assignedIds = new Set(assignedModules.map(m => String(m.module_id)));
  assignModulesAssignmentMap = new Map(
    assignedModules.map(m => [String(m.module_id), String(m.assignment_id || "")])
  );

  if (!allModulesCache.length) {
    assignedList.innerHTML = `<div class="empty-state"><div class="empty-title">No modules available</div><div>Ask an admin to add VR modules before assigning them.</div></div>`;
    unassignedList.innerHTML = "";
    updateAssignModulesCounts(0, 0);
    openModal("assignModulesModal");
    return;
  }

  if (!assignModulesSelection) {
    assignModulesSelection = new Set(assignedIds);
  }

  renderAssignModulesLists();

  if (!list.dataset.listener) {
    list.addEventListener("change", e => {
      const target = e.target;
      if (!target.classList.contains("assign-module-checkbox")) return;
      const id = String(target.value);
      if (target.checked) {
        assignModulesSelection.add(id);
      } else {
        assignModulesSelection.delete(id);
      }
      renderAssignModulesLists();
    });
    list.dataset.listener = "true";
  }

  openModal("assignModulesModal");
}

async function saveAssignedModules() {
  const saveBtn = document.getElementById("assignModulesSaveBtn");
  setButtonLoading(saveBtn, true, "Saving...");
  const list = document.getElementById("assignModulesList");
  if (!list) {
    setButtonLoading(saveBtn, false);
    return;
  }
  const checkboxes = Array.from(list.querySelectorAll(".assign-module-checkbox"));
  const selectedIds = new Set(
    checkboxes.filter(cb => cb.checked).map(cb => String(cb.value))
  );
  assignModulesSelection = new Set(selectedIds);
  const assignedPairs = checkboxes
    .map(cb => ({
      moduleId: String(cb.value),
      assignmentId: String(cb.dataset.assignmentId || "")
    }))
    .filter(item => item.assignmentId);

  try {
    const toAssign = Array.from(selectedIds).filter(
      id => !assignedPairs.some(p => p.moduleId === id)
    );
    const toRemove = assignedPairs.filter(p => !selectedIds.has(p.moduleId));

    const assignResults = await Promise.all(
      toAssign.map(moduleId =>
        apiRequest("assignModuleToCenter", {
          module_id: moduleId,
          center_id: centerId,
          actor_username: center.username || getCurrentUsername(),
          actor_role: "center"
        })
      )
    );
    const removeResults = await Promise.all(
      toRemove.map(item =>
        apiRequest("removeModuleFromCenter", {
          assignment_id: item.assignmentId,
          actor_username: center.username || getCurrentUsername(),
          actor_role: "center"
        })
      )
    );
    const allResults = [...assignResults, ...removeResults];
    const failed = allResults.find(res => !res?.success);
    if (failed) {
      handleApiFailure(failed);
      return;
    }

    closeModal("assignModulesModal");
    showToast("Modules updated");
      loadSection("vr-modules");
      loadOverview();
    } finally {
      setButtonLoading(saveBtn, false);
    }
  }

function openAddSpecialistModal() {
  removeSpecialistCenterInput();
  resetSpecialistModal();
  const modal = document.getElementById("specialistModal");
  if (!modal) {
    showToast("Specialist modal not available", "error");
    return;
  }
  openModal("specialistModal");
}

function openEditSpecialistModal(specId) {
  removeSpecialistCenterInput();
  const modal = document.getElementById("specialistModal");
  if (!modal) {
    showToast("Specialist modal not available", "error");
    return;
  }
  const specialist = specialistsCache.find(s => s.specialist_id == specId);
  if (!specialist) {
    showToast("Specialist not found", "error");
    return;
  }
  document.getElementById("specialistModalTitle").textContent = "Edit Specialist";
  document.getElementById("specIdInput").value = specialist.specialist_id;
  document.getElementById("specNameInput").value = specialist.name || "";
  document.getElementById("specUsernameInput").value = specialist.username || "";
  document.getElementById("specPasswordInput").value = specialist.password || "";
  document.getElementById("specDescriptionInput").value = specialist.description || "";
  openModal("specialistModal");
}

async function saveSpecialist() {
  const modal = document.getElementById("specialistModal");
  if (!modal) {
    showToast("Specialist modal not available", "error");
    return;
  }

  const saveBtn = document.getElementById("specSaveBtn");
  setButtonLoading(saveBtn, true, "Saving...");
  setModalError("specModalError", "");

  const specialistId = document.getElementById("specIdInput").value;
  const name = document.getElementById("specNameInput").value.trim();
  const username = document.getElementById("specUsernameInput").value.trim();
  const password = document.getElementById("specPasswordInput").value.trim();
  const description = document.getElementById("specDescriptionInput").value || "";

  if (!name || !username || !password) {
    const message = "Name, username, and password are required.";
    setModalError("specModalError", message);
    showToast(message, "error");
    setButtonLoading(saveBtn, false);
    return;
  }

  const payload = {
    name,
    username,
    password,
    description,
    center_id: centerId,
    actor_username: center.username || getCurrentUsername(),
    actor_role: "center"
  };

  try {
    const res = specialistId
      ? await apiRequest("updateSpecialist", { specialist_id: specialistId, ...payload })
      : await apiRequest("createSpecialist", payload);
    if (!res?.success) {
      const message = res?.error || "Unable to save specialist. Try again.";
      setModalError("specModalError", message);
      showToast(message, "error");
      return;
    }
    closeModal("specialistModal");
    showToast(specialistId ? "Specialist updated" : "Specialist saved");
    loadSection("specialists");
    loadOverview();
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

async function deleteSpecialist(specId, btn) {
  if (!confirm("Delete this specialist?")) return;
  setButtonLoading(btn, true, "Deleting...");
  const res = await apiRequest("deleteSpecialist", {
    specialist_id: specId,
    center_id: centerId,
    actor_username: center.username || getCurrentUsername(),
    actor_role: "center"
  });
  if (handleApiFailure(res)) {
    setButtonLoading(btn, false);
    return;
  }
  showToast("Specialist deleted");
  loadSection("specialists");
  loadOverview();
  setButtonLoading(btn, false);
}

function openAddChildModal() {
  removeChildCenterInput();
  resetChildModal();
  const modal = document.getElementById("childModal");
  if (!modal) {
    showToast("Child modal not available", "error");
    return;
  }
  openModal("childModal");
}

function openEditChildModal(childId) {
  removeChildCenterInput();
  const modal = document.getElementById("childModal");
  if (!modal) {
    showToast("Child modal not available", "error");
    return;
  }
  const child = childrenCache.find(ch => ch.child_id == childId);
  if (!child) {
    showToast("Child not found", "error");
    return;
  }
  document.getElementById("childModalTitle").textContent = "Edit Child";
  document.getElementById("childIdInput").value = child.child_id;
  document.getElementById("childNameInput").value = child.name || "";
  document.getElementById("childAgeInput").value = child.age || "";
  document.getElementById("childParentMobileInput").value = child.parent_mobile || "";
  document.getElementById("childNotesInput").value = child.notes || "";
  const statusInput = document.getElementById("childStatusInput");
  if (statusInput) statusInput.value = child.status || "active";
  openModal("childModal");
}

async function saveChild() {
  const modal = document.getElementById("childModal");
  if (!modal) {
    showToast("Child modal not available", "error");
    return;
  }

  const saveBtn = document.getElementById("childSaveBtn");
  setButtonLoading(saveBtn, true, "Saving...");
  setModalError("childModalError", "");

  const childId = document.getElementById("childIdInput").value;
  const name = document.getElementById("childNameInput").value.trim();
  if (!name) {
    const message = "Child name is required.";
    setModalError("childModalError", message);
    showToast(message, "error");
    setButtonLoading(saveBtn, false);
    return;
  }

  const payload = {
    name,
    age: document.getElementById("childAgeInput").value,
    parent_mobile: document.getElementById("childParentMobileInput").value,
    notes: document.getElementById("childNotesInput").value,
    status: document.getElementById("childStatusInput")?.value || "active",
    center_id: centerId,
    actor_username: center.username || getCurrentUsername(),
    actor_role: "center"
  };

  try {
    const res = childId
      ? await apiRequest("updateChild", { child_id: childId, ...payload })
      : await apiRequest("createChild", payload);
    if (!res?.success) {
      const message = res?.error || "Unable to save child. Try again.";
      setModalError("childModalError", message);
      showToast(message, "error");
      return;
    }
    closeModal("childModal");
    showToast(childId ? "Child updated" : "Child saved");
    loadSection("children");
    loadOverview();
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

async function deleteChild(childId, btn) {
  if (!confirm("Delete this child?")) return;
  setButtonLoading(btn, true, "Deleting...");
  const res = await apiRequest("deleteChild", {
    child_id: childId,
    center_id: centerId,
    actor_username: center.username || getCurrentUsername(),
    actor_role: "center"
  });
  if (handleApiFailure(res)) {
    setButtonLoading(btn, false);
    return;
  }
  showToast("Child deleted");
  loadSection("children");
  loadOverview();
  setButtonLoading(btn, false);
}

function removeChildCenterInput() {
  const modal = document.getElementById("childModal");
  if (!modal) return;
  const centerInputs = modal.querySelectorAll(
    "#childCenterIdInput, #centerIdInput, [name='center_id']"
  );
  centerInputs.forEach(input => {
    input.disabled = true;
    input.value = "";
    const group = input.closest(".input-group");
    if (group) {
      group.remove();
    } else {
      input.remove();
    }
  });
}

function removeSpecialistCenterInput() {
  const modal = document.getElementById("specialistModal");
  if (!modal) return;
  const centerInputs = modal.querySelectorAll(
    "#specCenterIdInput, #specialistCenterIdInput, [name='center_id']"
  );
  centerInputs.forEach(input => {
    input.disabled = true;
    input.value = "";
    const group = input.closest(".input-group");
    if (group) {
      group.remove();
    } else {
      input.remove();
    }
  });
}

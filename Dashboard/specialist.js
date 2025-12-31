// Guard: only specialists
authGuard("specialist");

const specialistUser = getCurrentUser();
const specialistId = specialistUser.specialist_id;
const centerId = specialistUser.center_id;
let centerModulesCache = null;
let childrenCache = [];
let assessmentQuestionsCache = [];
let currentChildProfile = null;
let shellSidebar = null;
let allowedSections = null;

// ------------- INIT -------------
document.addEventListener("DOMContentLoaded", () => {
  initModalClose();
  initShell();

  // user chip
  const nameEl = document.getElementById("currentUserName");
  if (nameEl) nameEl.textContent = specialistUser.name || specialistUser.username || "Specialist";
  setSpecialistAvatar();

  document.addEventListener("unitysphere:search", (event) => {
    applyGlobalSearch(event.detail.query);
  });

  // nav
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;
      if (allowedSections && !allowedSections.has(section)) return;
      switchSection(section);
      updateSectionContext(section);
      updateHeaderTitle(section);
      loadSection(section);
      setActiveSidebarForSection(section);
    });
  });

  // logout
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document.getElementById("settingsLogoutBtn")?.addEventListener("click", logout);

  // refresh button
  document.getElementById("refreshAllBtn")?.addEventListener("click", () => {
    const btn = document.getElementById("refreshAllBtn");
    setButtonLoading(btn, true, "Refreshing...");
    const active = document.querySelector(".section.active")?.id.replace("section-", "") || "overview";
    updateSectionContext(active);
    updateHeaderTitle(active);
    loadSection(active);
    setTimeout(() => setButtonLoading(btn, false), 400);
  });
  document.getElementById("settingsRefreshBtn")?.addEventListener("click", () => {
    const btn = document.getElementById("settingsRefreshBtn");
    setButtonLoading(btn, true, "Refreshing...");
    const active = document.querySelector(".section.active")?.id.replace("section-", "") || "overview";
    updateSectionContext(active);
    updateHeaderTitle(active);
    loadSection(active);
    setTimeout(() => setButtonLoading(btn, false), 400);
  });

  document.getElementById("specEmptyAddChild")?.addEventListener("click", openChildModalForCreate);

  // children filters
  document.getElementById("filterChildName")?.addEventListener("input", renderChildrenGrid);
  document.getElementById("filterChildStatus")?.addEventListener("change", renderChildrenGrid);

  // child modal save
  document.getElementById("childSaveBtn")?.addEventListener("click", saveChild);

  // add child button
  document.getElementById("btnAddChild")?.addEventListener("click", openChildModalForCreate);

  // session save
  document.getElementById("sessionSaveBtn")?.addEventListener("click", saveSession);

  // assessment save
  document.getElementById("assessmentSaveBtn")?.addEventListener("click", saveAssessment);

  // assessments page
  document.getElementById("startAssessmentBtn")?.addEventListener("click", handleStartAssessment);
  document.getElementById("exportAssessmentsBtn")?.addEventListener("click", exportAssessmentsCsv);
  setExportButtonState([]);

  // child profile buttons (delegated when modal opens)
  document.getElementById("btnAddSession")?.addEventListener("click", () => {
    const childId = document.getElementById("childProfileModal")?.dataset.childId;
    if (childId) openSessionModalForCreate(childId);
  });
  document.getElementById("btnAddAssessment")?.addEventListener("click", () => {
    const childId = document.getElementById("childProfileModal")?.dataset.childId;
    if (childId) openAssessmentModalForCreate(childId);
  });
  initChildProfileTabs();

  // initial section
  updateSectionContext("overview");
  updateHeaderTitle("overview");
  updateSettingsProfile();
  loadSection("overview");
});

function initShell() {
  const sidebarHost = document.getElementById("appSidebar");
  const headerHost = document.getElementById("appHeader");
  if (!sidebarHost || !headerHost || !window.UnitySphereShell) return;
  const role = "specialist";
  const sidebar = window.UnitySphereShell.buildSidebar({ role, active: "overview" });
  const header = window.UnitySphereShell.buildHeader({ title: "Specialist Dashboard" });
  sidebarHost.replaceWith(sidebar);
  headerHost.replaceWith(header);
  shellSidebar = sidebar;
  window.UnitySphereShell.wireEscManager();
  if (window.UnitySphereShell.applyRoleVisibility) {
    window.UnitySphereShell.applyRoleVisibility({ role });
  }
  if (window.UnitySphereShell.getAllowedSectionIds) {
    allowedSections = window.UnitySphereShell.getAllowedSectionIds(role);
  }

  sidebar.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-nav]");
    if (!nav) return;
    if (allowedSections && !allowedSections.has(nav.dataset.nav)) return;
    const section = mapNavToSection(nav.dataset.nav);
    if (!section) return;
    switchSection(section);
    updateSectionContext(section);
    updateHeaderTitle(section);
    loadSection(section);
    window.UnitySphereShell.setActiveNavItem(sidebar, nav.dataset.nav);
  });
}

function initChildProfileTabs() {
  const modal = document.getElementById("childProfileModal");
  if (!modal) return;
  modal.querySelectorAll(".tab-button").forEach(btn => {
    btn.addEventListener("click", () => {
      setChildProfileTab(btn.dataset.tab);
    });
  });
}

function setChildProfileTab(tab) {
  const modal = document.getElementById("childProfileModal");
  if (!modal) return;
  const next = tab || "overview";
  modal.dataset.activeTab = next;
  modal.querySelectorAll(".tab-button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === next);
  });
  modal.querySelectorAll("[data-tab-panel]").forEach(panel => {
    panel.classList.toggle("active", panel.dataset.tabPanel === next);
  });
}

function setSpecialistAvatar() {
  const name = specialistUser.name || specialistUser.username || "Specialist";
  const photo = specialistUser.photo || specialistUser.photo_url || "";
  if (typeof applyAvatarFallbackToSelector === "function") {
    applyAvatarFallbackToSelector("#specialistUserAvatar", name, photo);
    return;
  }
  const avatar = document.getElementById("specialistUserAvatar");
  if (!avatar) return;
  if (photo) {
    avatar.style.backgroundImage = `url('${photo}')`;
    avatar.classList.add("has-photo");
    avatar.removeAttribute("data-initials");
  } else {
    avatar.style.backgroundImage = "";
    avatar.classList.remove("has-photo");
    avatar.setAttribute("data-initials", getInitials(name));
  }
}

function updateSettingsProfile() {
  const name = specialistUser.name || specialistUser.username || "Specialist";
  const centerLabel = specialistUser.center_name || specialistUser.center_id || centerId || "--";
  setText("settingsProfileName", name);
  setText("settingsProfileRole", "Role: Specialist");
  setText("settingsProfileCenter", `Center: ${centerLabel}`);
  const avatar = document.getElementById("settingsAvatar");
  const photo = specialistUser.photo || specialistUser.photo_url || "";
  if (typeof applyAvatarFallback === "function") {
    applyAvatarFallback(avatar, name, photo);
  } else if (avatar) {
    avatar.setAttribute("data-initials", getInitials(name));
    avatar.style.backgroundImage = photo ? `url('${photo}')` : "";
    avatar.classList.toggle("has-photo", Boolean(photo));
  }
}

function updateHeaderTitle(section) {
  const title = document.querySelector(".shell-header .title");
  if (!title) return;
  const map = {
    overview: "Specialist Dashboard",
    children: "My Children",
    assessments: "Assessments",
    settings: "Settings"
  };
  title.textContent = map[section] || "Specialist Dashboard";
}

function applyGlobalSearch(query) {
  const term = String(query || "").trim().toLowerCase();
  const section = document.querySelector(".section.active");
  if (!section) return;
  section.querySelectorAll(".card, .stat-card, .module-card, .specialist-card").forEach(card => {
    const match = !term || card.textContent.toLowerCase().includes(term);
    card.classList.toggle("search-hidden", !match);
  });
}

function updateSectionContext(section) {
  const label = document.getElementById("currentSectionLabel");
  if (!label) return;
  const map = {
    overview: "Overview",
    children: "Children",
    assessments: "Assessments",
    settings: "Settings"
  };
  label.textContent = map[section] || "Overview";
}

async function confirmDangerAction(message) {
  if (typeof ConfirmDangerAction === "function") {
    return ConfirmDangerAction(message);
  }
  if (typeof window.confirm === "function") {
    return window.confirm(message);
  }
  return false;
}

function mapNavToSection(navId) {
  const map = {
    overview: "overview",
    children: "children",
    assessments: "assessments",
    settings: "settings"
  };
  return map[navId] || null;
}

function setActiveSidebarForSection(section) {
  if (!shellSidebar || !window.UnitySphereShell?.setActiveNavItem) return;
  const map = {
    overview: "overview",
    children: "children",
    assessments: "assessments",
    settings: "settings"
  };
  const navId = map[section];
  if (navId) {
    window.UnitySphereShell.setActiveNavItem(shellSidebar, navId);
  }
}

// ------------- SECTION LOADER -------------
function loadSection(section) {
  if (section === "overview") loadOverview();
  if (section === "children") loadChildren();
  if (section === "assessments") loadAssessments();
  if (section === "settings") updateSettingsProfile();
}

// ------------- OVERVIEW -------------
async function loadOverview() {
  // stats
  const statsRes = await apiRequest("getSpecialistStats", { specialist_id: specialistId });
  if (statsRes?.success) {
    const t = statsRes.totals || {};
    setText("statChildren", t.children ?? 0);
    setText("statSessions", t.sessions ?? 0);
    setText("statAssessments", t.assessments ?? 0);
  }

  // assessment average (quick & simple)
  const assessRes = await apiRequest("listAssessmentResponses", { specialist_id: specialistId });
  if (assessRes?.success) {
    const responses = assessRes.responses || [];
    if (responses.length) {
      const sum = responses.reduce((acc, r) => acc + Number(r.score || 0), 0);
      const avg = sum / responses.length;
      setText("statAvgScore", avg.toFixed(1));
    } else {
      setText("statAvgScore", "–");
    }
  }

  // children for recent lists
  const childrenRes = await apiRequest("listChildren", { specialist_id: specialistId });
  if (!childrenRes?.success) return;
  const children = (childrenRes.children || []).sort(
    (a, b) => (b.num_sessions || 0) - (a.num_sessions || 0)
  );

  // recently active children
  const recentChildrenList = document.getElementById("recentChildrenList");
  recentChildrenList.innerHTML = "";
  children.slice(0, 5).forEach(ch => {
    const item = document.createElement("div");
    item.className = "recommendation";
    item.innerHTML = `
      <div class="recommendation-icon">👦</div>
      <div class="recommendation-body">
        <strong>${ch.name}</strong>
        <span class="hint">
          Sessions: ${ch.num_sessions || 0} · Age: ${ch.age || "N/A"}
        </span>
      </div>
    `;
    recentChildrenList.appendChild(item);
  });

  // latest sessions (very simple: fake from children for now)
  const recentSessionsList = document.getElementById("recentSessionsList");
  recentSessionsList.innerHTML = "";
  children.slice(0, 5).forEach(ch => {
    const item = document.createElement("div");
    item.className = "recommendation";
    item.innerHTML = `
      <div class="recommendation-icon">🎧</div>
      <div class="recommendation-body">
        <strong>${ch.name}</strong>
        <span class="hint">
          Sessions: ${ch.num_sessions || 0} · Latest assessment:
          ${
            ch.latest_assessment_date
              ? new Date(ch.latest_assessment_date).toLocaleDateString()
              : "No assessments yet"
          }
        </span>
      </div>
    `;
    recentSessionsList.appendChild(item);
  });
}

// ------------- CHILDREN LIST -------------
async function loadChildren() {
  const res = await apiRequest("listChildren", { specialist_id: specialistId });
  if (!res?.success) return;

  childrenCache = res.children || [];
  renderChildrenGrid();
}

// ------------- ASSESSMENTS PAGE -------------
async function loadAssessments() {
  await Promise.all([loadAssessmentsChildren(), loadAssessmentsQuestions()]);
}

async function loadAssessmentsChildren() {
  const select = document.getElementById("assessmentsChildSelect");
  if (!select) return;
  select.innerHTML = "<option value=\"\">Select a child</option>";

  const res = await apiRequest("listChildren", { specialist_id: specialistId });
  if (!res?.success) return;
  const list = res.children || [];
  list.forEach(ch => {
    const option = document.createElement("option");
    option.value = ch.child_id;
    option.textContent = ch.name || `Child ${ch.child_id}`;
    select.appendChild(option);
  });
}

async function loadAssessmentsQuestions() {
  const list = document.getElementById("assessmentsQuestionsList");
  if (!list) return;
  list.innerHTML = "";

  const questions = await ensureAssessmentQuestionsCache();
  if (!questions) return;

  if (!questions.length) {
    if (typeof EmptyState === "function") {
      list.innerHTML = EmptyState(
        "assessment questions yet",
        "Assessment questions have not been published. Ask an admin to add questions, then refresh."
      );
      const actions = list.querySelector(".empty-actions");
      if (actions) {
        const refreshBtn = document.createElement("button");
        refreshBtn.className = "ghost small";
        refreshBtn.type = "button";
        refreshBtn.id = "assessmentsEmptyRefresh";
        refreshBtn.textContent = "Refresh";
        actions.appendChild(refreshBtn);
      }
    } else {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">No assessment questions yet</div>
          <div>Assessment questions have not been published. Ask an admin to add questions, then refresh.</div>
          <div class="empty-actions">
            <button class="ghost small" type="button" id="assessmentsEmptyRefresh">Refresh</button>
          </div>
        </div>
      `;
    }
    document.getElementById("assessmentsEmptyRefresh")?.addEventListener("click", loadAssessmentsQuestions);
    return;
  }

  questions.forEach(q => {
    const item = document.createElement("div");
    item.className = "recommendation";
    item.innerHTML = `
      <div class="recommendation-body">
        <strong>${q.question_text}</strong>
        <span class="hint">
          Category: ${q.category || "General"} | Difficulty: ${q.difficulty || "N/A"}
        </span>
      </div>
    `;
    list.appendChild(item);
  });
}

async function handleStartAssessment() {
  const select = document.getElementById("assessmentsChildSelect");
  const childId = select ? select.value : "";
  if (!childId) {
    showToast("Please select a child before starting an assessment.", "error", "Missing child");
    return;
  }
  const btn = document.getElementById("startAssessmentBtn");
  setButtonLoading(btn, true, "Loading...");
  await openAssessmentModalForCreate(childId);
  setButtonLoading(btn, false);
}

function renderChildrenGrid() {
  const grid = document.getElementById("childrenGrid");
  const empty = document.getElementById("childrenEmpty");
  grid.innerHTML = "";

  const nameFilter = (document.getElementById("filterChildName")?.value || "").toLowerCase();
  const statusFilter = document.getElementById("filterChildStatus")?.value || "";

  let items = childrenCache.slice();
  items = items.filter(ch => {
    if (nameFilter && !String(ch.name || "").toLowerCase().includes(nameFilter)) return false;
    if (statusFilter && ch.status !== statusFilter) return false;
    return true;
  });

  if (!items.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  items.forEach(ch => {
    const card = document.createElement("article");
    card.className = "module-card";
    card.innerHTML = `
      <header>
        <div>
          <strong>${ch.name}</strong>
          <div class="hint">ID: ${ch.child_id}</div>
        </div>
        <div>
          <span class="chip subtle">${ch.age ? ch.age + " yrs" : "Age N/A"}</span>
          ${StatusBadge(ch.status)}
        </div>
      </header>
      <div class="module-meta">
        <span>Center: ${ch.center_id || "—"}</span>
        <span>Sessions: ${ch.num_sessions || 0}</span>
        <span>Status: ${ch.status || "active"}</span>
      </div>
      <div class="hint">Parent: ${ch.parent_mobile || "N/A"}</div>
      <div style="margin-top:0.4rem;display:flex;gap:0.4rem;flex-wrap:wrap;">
        <button class="ghost small" data-edit-child="${ch.child_id}">Edit</button>
        <button class="ghost small" data-view-child="${ch.child_id}">View Profile</button>
        <button class="ghost small" data-add-session="${ch.child_id}">Add Session</button>
        <button class="ghost small" data-add-assessment="${ch.child_id}">Add Assessment</button>
        <button class="ghost small danger" data-delete-child="${ch.child_id}">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // attach handlers (one-off for current render)
  grid.querySelectorAll("[data-edit-child]").forEach(btn =>
    btn.addEventListener("click", () => openChildModalForEdit(btn.dataset.editChild))
  );
  grid.querySelectorAll("[data-view-child]").forEach(btn =>
    btn.addEventListener("click", () => openChildProfile(btn.dataset.viewChild, btn))
  );
  grid.querySelectorAll("[data-add-session]").forEach(btn =>
    btn.addEventListener("click", () => openSessionModalForCreate(btn.dataset.addSession))
  );
  grid.querySelectorAll("[data-add-assessment]").forEach(btn =>
    btn.addEventListener("click", () => openAssessmentModalForCreate(btn.dataset.addAssessment))
  );
  grid.querySelectorAll("[data-delete-child]").forEach(btn =>
    btn.addEventListener("click", () => deleteChild(btn.dataset.deleteChild, btn))
  );
}

// ------------- CHILD MODAL -------------
function openChildModalForCreate() {
  document.getElementById("childModalTitle").textContent = "Add Child";
  document.getElementById("childIdInput").value = "";
  document.getElementById("childNameInput").value = "";
  document.getElementById("childAgeInput").value = "";
  document.getElementById("childParentMobileInput").value = "";
  document.getElementById("childNotesInput").value = "";
  document.getElementById("childStatusInput").value = "active";
  openModal("childModal");
}

function openChildModalForEdit(childId) {
  const ch = childrenCache.find(c => c.child_id == childId);
  if (!ch) return;

  document.getElementById("childModalTitle").textContent = "Edit Child";
  document.getElementById("childIdInput").value = ch.child_id;
  document.getElementById("childNameInput").value = ch.name || "";
  document.getElementById("childAgeInput").value = ch.age || "";
  document.getElementById("childParentMobileInput").value = ch.parent_mobile || "";
  document.getElementById("childNotesInput").value = ch.notes || "";
  document.getElementById("childStatusInput").value = ch.status || "active";
  openModal("childModal");
}

async function saveChild() {
  const saveBtn = document.getElementById("childSaveBtn");
  setButtonLoading(saveBtn, true, "Saving...");
  const id = document.getElementById("childIdInput").value;
  const payload = {
    name: document.getElementById("childNameInput").value,
    age: document.getElementById("childAgeInput").value,
    parent_mobile: document.getElementById("childParentMobileInput").value,
    notes: document.getElementById("childNotesInput").value,
    specialist_id: specialistId,
    center_id: centerId,
    actor_username: specialistUser.username,
    actor_role: "specialist"
  };

  try {
    let res;
    if (id) {
      res = await apiRequest("updateChild", {
        child_id: id,
        status: document.getElementById("childStatusInput").value,
        ...payload
      });
    } else {
      res = await apiRequest("createChild", payload);
    }

    if (!res?.success) {
      showToast(res.error || "Error saving child", "error", "Save failed");
      return;
    }
    closeModal("childModal");
    showToast("Child saved");
    await loadChildren();
    await loadOverview();
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

async function deleteChild(childId, btn) {
  if (!(await confirmDangerAction("Delete this child?"))) return;
  setButtonLoading(btn, true, "Deleting...");

  const res = await apiRequest("deleteChild", {
    child_id: childId,
    actor_username: specialistUser.username,
    actor_role: "specialist"
  });

  if (!res?.success) {
    showToast(res.error || "Error deleting child", "error", "Delete failed");
    setButtonLoading(btn, false);
    return;
  }
  showToast("Child deleted");
  await loadChildren();
  await loadOverview();
  setButtonLoading(btn, false);
}

// ------------- CHILD PROFILE MODAL -------------
async function openChildProfile(childId, btn) {
  setButtonLoading(btn, true, "Loading...");
  const res = await apiRequest("getChildProfile", { child_id: childId });
  if (!res?.success) {
    showToast(res?.error || "Unable to load child profile", "error");
    setButtonLoading(btn, false);
    return;
  }

  const child = res.child;
  const sessions = res.sessions || [];
  const assessments = res.assessments || [];
  currentChildProfile = { child, assessments };
  setExportButtonState(assessments);

  const modal = document.getElementById("childProfileModal");
  modal.dataset.childId = child.child_id;

  document.getElementById("childProfileTitle").textContent = child.name || "Child";
  document.getElementById("childProfileSubtitle").textContent =
    `ID: ${child.child_id} · Age: ${child.age || "N/A"} · Parent: ${child.parent_mobile || "N/A"}`;

  // totals
  const totalMinutes = sessions.reduce((sum, s) => sum + Number(s.duration_minutes || 0), 0);
  document.getElementById("childProfileTotalMinutes").textContent = `${totalMinutes} min`;
  document.getElementById("childProfileSessionCount").textContent = sessions.length;
  document.getElementById("childProfileAssessmentCount").textContent = assessments.length;

  // sessions list
  const sessionsList = document.getElementById("childSessionsList");
  sessionsList.innerHTML = "";
  if (!sessions.length) {
    if (typeof EmptyState === "function") {
      sessionsList.innerHTML = EmptyState(
        "sessions yet",
        "Log the first VR session to start tracking progress."
      );
      const actions = sessionsList.querySelector(".empty-actions");
      if (actions) {
        const addBtn = document.createElement("button");
        addBtn.className = "ghost small";
        addBtn.type = "button";
        addBtn.dataset.addSession = childId;
        addBtn.textContent = "Add Session";
        actions.appendChild(addBtn);
      }
    } else {
      sessionsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">No sessions yet</div>
          <div>Log the first VR session to start tracking progress.</div>
          <div class="empty-actions">
            <button class="ghost small" type="button" data-add-session="${childId}">Add Session</button>
          </div>
        </div>
      `;
    }
  } else {
  sessions.forEach(s => {
    const item = document.createElement("div");
    item.className = "recommendation";
    item.innerHTML = `
      <div class="recommendation-icon">🎮</div>
      <div class="recommendation-body">
        <strong>${new Date(s.date).toLocaleDateString()}</strong>
        <span class="hint">
          Module: ${s.module_id || "N/A"} · Duration: ${s.duration_minutes || 0} min
        </span>
        <div class="hint">${s.notes || ""}</div>
        <div style="margin-top:0.3rem;">
          <button class="ghost small" data-edit-session="${s.session_id}">Edit</button>
        </div>
      </div>
    `;
    sessionsList.appendChild(item);
  });
  }
  sessionsList.querySelectorAll("[data-edit-session]").forEach(btn =>
    btn.addEventListener("click", () => openSessionModalForEdit(btn.dataset.editSession, childId, btn))
  );
  sessionsList.querySelectorAll("[data-add-session]").forEach(btn =>
    btn.addEventListener("click", () => openSessionModalForCreate(btn.dataset.addSession))
  );

  // assessments list (group by date)
  const assessmentsList = document.getElementById("childAssessmentsList");
  assessmentsList.innerHTML = "";

  const byDate = {};
  assessments.forEach(a => {
    const key = String(a.date);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(a);
  });

  Object.keys(byDate)
    .sort((a, b) => new Date(b) - new Date(a))
    .forEach(dateStr => {
      const group = byDate[dateStr];
      const avg =
        group.reduce((sum, g) => sum + Number(g.score || 0), 0) / (group.length || 1);
      const item = document.createElement("div");
      item.className = "recommendation";
      item.innerHTML = `
        <div class="recommendation-icon">📊</div>
        <div class="recommendation-body">
          <strong>${new Date(dateStr).toLocaleDateString()}</strong>
          <span class="hint">
            Questions: ${group.length} · Avg score: ${avg.toFixed(1)}
          </span>
        </div>
      `;
      assessmentsList.appendChild(item);
    });
  if (!assessments.length) {
    if (typeof EmptyState === "function") {
      assessmentsList.innerHTML = EmptyState(
        "assessments yet",
        "Add an assessment to capture scores for this child."
      );
      const actions = assessmentsList.querySelector(".empty-actions");
      if (actions) {
        const addBtn = document.createElement("button");
        addBtn.className = "ghost small";
        addBtn.type = "button";
        addBtn.dataset.addAssessment = childId;
        addBtn.textContent = "Add Assessment";
        actions.appendChild(addBtn);
      }
    } else {
      assessmentsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-title">No assessments yet</div>
          <div>Add an assessment to capture scores for this child.</div>
          <div class="empty-actions">
            <button class="ghost small" type="button" data-add-assessment="${childId}">Add Assessment</button>
          </div>
        </div>
      `;
    }
  }
  assessmentsList.querySelectorAll("[data-add-assessment]").forEach(btn =>
    btn.addEventListener("click", () => openAssessmentModalForCreate(btn.dataset.addAssessment))
  );

  setChildProfileTab(modal.dataset.activeTab || "overview");
  openModal("childProfileModal");
  setButtonLoading(btn, false);
}

// ------------- MODULES (CENTER-SCOPED) -------------
async function loadCenterModules() {
  if (centerModulesCache) return centerModulesCache;
  const res = await apiRequest("listCenterModules", { center_id: centerId });
  if (!res?.success) return [];
  centerModulesCache = res.modules || [];
  return centerModulesCache;
}

async function populateSessionModulesSelect(singleModuleId) {
  const select = document.getElementById("sessionModulesInput");
  select.innerHTML = "";

  const modules = await loadCenterModules();
  modules.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.module_id;
    opt.textContent = `${m.name} (${m.minutes_to_play || 0} min)`;
    if (singleModuleId && singleModuleId == m.module_id) opt.selected = true;
    select.appendChild(opt);
  });
}

// ------------- SESSION MODAL -------------
function openSessionModalForCreate(childId) {
  document.getElementById("sessionModalTitle").textContent = "Add Session";
  document.getElementById("sessionIdInput").value = "";
  document.getElementById("sessionChildIdInput").value = childId;
  document.getElementById("sessionDateInput").value = new Date().toISOString().slice(0, 10);
  document.getElementById("sessionDurationInput").value = "";
  document.getElementById("sessionNotesInput").value = "";
  populateSessionModulesSelect();
  openModal("sessionModal");
}

async function openSessionModalForEdit(sessionId, childId, btn) {
  setButtonLoading(btn, true, "Loading...");
  // get child profile and find that session row
  const res = await apiRequest("getChildProfile", { child_id: childId });
  if (!res?.success) {
    showToast("Unable to load session details", "error");
    setButtonLoading(btn, false);
    return;
  }
  const s = (res.sessions || []).find(x => x.session_id == sessionId);
  if (!s) {
    showToast("Session not found", "error");
    setButtonLoading(btn, false);
    return;
  }

  document.getElementById("sessionModalTitle").textContent = "Edit Session";
  document.getElementById("sessionIdInput").value = s.session_id;
  document.getElementById("sessionChildIdInput").value = s.child_id;
  document.getElementById("sessionDateInput").value = String(s.date).slice(0, 10);
  document.getElementById("sessionDurationInput").value = s.duration_minutes || "";
  document.getElementById("sessionNotesInput").value = s.notes || "";

  await populateSessionModulesSelect(s.module_id);
  openModal("sessionModal");
  setButtonLoading(btn, false);
}

async function saveSession() {
  const saveBtn = document.getElementById("sessionSaveBtn");
  setButtonLoading(saveBtn, true, "Saving...");
  const id = document.getElementById("sessionIdInput").value;
  const childId = document.getElementById("sessionChildIdInput").value;
  const date = document.getElementById("sessionDateInput").value;
  const duration = document.getElementById("sessionDurationInput").value;
  const notes = document.getElementById("sessionNotesInput").value;
  const modulesSelect = document.getElementById("sessionModulesInput");

  const selectedModules = Array.from(modulesSelect.selectedOptions).map(o => o.value);

  if (!date || !selectedModules.length) {
    showToast("Please pick at least one module and a date.", "error", "Missing info");
    setButtonLoading(saveBtn, false);
    return;
  }

  try {
    let res;
    if (id) {
      res = await apiRequest("updateSession", {
        session_id: id,
        date,
        module_id: selectedModules[0],
        duration_minutes: duration,
        notes,
        actor_username: specialistUser.username,
        actor_role: "specialist"
      });
    } else {
      res = await apiRequest("createSession", {
        child_id: childId,
        specialist_id: specialistId,
        center_id: centerId,
        date,
        module_ids_json: JSON.stringify(selectedModules),
        duration_minutes: duration,
        notes,
        actor_username: specialistUser.username,
        actor_role: "specialist"
      });
    }

    if (!res?.success) {
      showToast(res.error || "Error saving session", "error", "Save failed");
      return;
    }

    closeModal("sessionModal");
    showToast("Session saved");
    await openChildProfile(childId);
    await loadOverview();
    await loadChildren();
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

// ------------- ASSESSMENTS -------------
async function openAssessmentModalForCreate(childId) {
  document.getElementById("assessmentModalTitle").textContent = "Add Assessment";
  document.getElementById("assessmentChildIdInput").value = childId;
  document.getElementById("assessmentDateInput").value = new Date().toISOString().slice(0, 10);
  document.getElementById("assessmentNotesInput").value = "";
  await loadAssessmentQuestionsIntoForm();
  openModal("assessmentModal");
}

async function loadAssessmentQuestionsIntoForm() {
  const container = document.getElementById("assessmentQuestionsContainer");
  container.innerHTML = "";

  const qs = await ensureAssessmentQuestionsCache();
  if (!qs) {
    container.textContent = "Error loading questions.";
    const saveBtn = document.getElementById("assessmentSaveBtn");
    if (saveBtn) saveBtn.disabled = true;
    return;
  }
  if (!qs.length) {
    container.textContent = "No questions configured yet.";
    const saveBtn = document.getElementById("assessmentSaveBtn");
    if (saveBtn) saveBtn.disabled = true;
    return;
  }

  qs.forEach(q => {
    const row = document.createElement("div");
    row.className = "recommendation";
    row.innerHTML = `
      <div class="recommendation-icon">❓</div>
      <div class="recommendation-body">
        <strong>${q.question_text}</strong>
        <span class="hint">
          Category: ${q.category || "—"} · Difficulty: ${q.difficulty || "—"}
        </span>
        <div class="input-group" style="margin-top:0.4rem;">
          <label>Score</label>
          <input type="number" min="0" max="10" data-q-score="${q.question_id}" placeholder="0–10" />
        </div>
      </div>
    `;
    container.appendChild(row);
  });
  container.querySelectorAll("[data-q-score]").forEach(input => {
    input.addEventListener("input", updateAssessmentProgress);
  });
  updateAssessmentProgress();
}

function updateAssessmentProgress() {
  const inputs = Array.from(document.querySelectorAll("[data-q-score]"));
  const total = inputs.length;
  const filled = inputs.filter(input => input.value !== "").length;
  const text = document.getElementById("assessmentProgressText");
  const bar = document.getElementById("assessmentProgressBar");
  if (text) text.textContent = `Question ${filled} of ${total}`;
  if (bar) bar.style.width = total ? `${Math.round((filled / total) * 100)}%` : "0%";
  const saveBtn = document.getElementById("assessmentSaveBtn");
  if (saveBtn) saveBtn.disabled = total === 0 || filled < total;
}

async function ensureAssessmentQuestionsCache() {
  if (assessmentQuestionsCache.length) return assessmentQuestionsCache;
  const res = await apiRequest("listQuestions");
  if (!res?.success) {
    showToast(res.error || "Error loading questions", "error");
    return null;
  }
  assessmentQuestionsCache = res.questions || [];
  return assessmentQuestionsCache;
}

function setExportButtonState(assessments) {
  const btn = document.getElementById("exportAssessmentsBtn");
  if (!btn) return;
  const hasAssessments = Boolean(assessments && assessments.length);
  btn.disabled = !hasAssessments;
  if (!btn.dataset.baseTitle) {
    btn.dataset.baseTitle = btn.title || "Exports question text, category, difficulty, scores, and dates.";
  }
  btn.title = hasAssessments
    ? btn.dataset.baseTitle
    : `${btn.dataset.baseTitle} (No assessments to export)`;
}

function escapeCsv(value) {
  const str = value == null ? "" : String(value);
  const escaped = str.replace(/"/g, "\"\"");
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function formatCsvDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

async function exportAssessmentsCsv() {
  const btn = document.getElementById("exportAssessmentsBtn");
  setButtonLoading(btn, true, "Exporting...");
  if (!currentChildProfile || !currentChildProfile.assessments?.length) {
    showToast("No assessments to export", "error");
    setButtonLoading(btn, false);
    return;
  }
  const questions = await ensureAssessmentQuestionsCache();
  if (!questions) {
    setButtonLoading(btn, false);
    return;
  }

  const questionMap = new Map(
    questions.map(q => [String(q.question_id), q])
  );
  const child = currentChildProfile.child;
  const specialistName = specialistUser.name || specialistUser.username || "Specialist";
  const rows = [
    [
      "Child Name",
      "Child ID",
      "Assessment Date",
      "Question Text",
      "Question Category",
      "Question Difficulty",
      "Score",
      "Specialist Name",
      "Center ID"
    ]
  ];

  currentChildProfile.assessments.forEach(a => {
    const q = questionMap.get(String(a.question_id)) || {};
    rows.push([
      child.name || "",
      child.child_id || "",
      formatCsvDate(a.date),
      q.question_text || "",
      q.category || "",
      q.difficulty || "",
      a.score ?? "",
      specialistName,
      a.center_id || centerId || ""
    ]);
  });

  const csv = rows.map(row => row.map(escapeCsv).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = (child.name || "child").replace(/[^a-z0-9-_]+/gi, "_");
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `assessment_history_${safeName}_${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast("Assessment CSV exported");
  setButtonLoading(btn, false);
}

async function saveAssessment() {
  const saveBtn = document.getElementById("assessmentSaveBtn");
  setButtonLoading(saveBtn, true, "Saving...");
  const childId = document.getElementById("assessmentChildIdInput").value;
  const date = document.getElementById("assessmentDateInput").value;
  if (!childId || !date) {
    showToast("Child and date are required.", "error", "Missing info");
    setButtonLoading(saveBtn, false);
    return;
  }

  const scoreInputs = document.querySelectorAll("[data-q-score]");
  const totalQuestions = scoreInputs.length;
  const filledQuestions = Array.from(scoreInputs).filter(input => input.value !== "").length;
  if (totalQuestions && filledQuestions < totalQuestions) {
    showToast("Please complete all scores before saving.", "error", "Missing info");
    setButtonLoading(saveBtn, false);
    return;
  }
  const answers = [];
  scoreInputs.forEach(input => {
    const qId = input.getAttribute("data-q-score");
    const scoreVal = input.value;
    if (scoreVal !== "") {
      answers.push({ question_id: qId, score: Number(scoreVal) });
    }
  });

  if (!answers.length) {
    showToast("Please enter at least one score.", "error", "Missing info");
    setButtonLoading(saveBtn, false);
    return;
  }

  try {
    const res = await apiRequest("createAssessment", {
      child_id: childId,
      specialist_id: specialistId,
      center_id: centerId,
      date,
      answers_json: JSON.stringify(answers),
      actor_username: specialistUser.username,
      actor_role: "specialist"
    });

    if (!res?.success) {
      showToast(res.error || "Error saving assessment", "error", "Save failed");
      return;
    }

    closeModal("assessmentModal");
    showToast("Assessment saved");
    await openChildProfile(childId);
    await loadOverview();
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

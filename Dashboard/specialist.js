// Guard: only specialists
authGuard("specialist");

const specialistUser = getCurrentUser();
const specialistId = specialistUser.specialist_id;
const centerId = specialistUser.center_id;
let centerModulesCache = null;
let childrenCache = [];

// ------------- INIT -------------
document.addEventListener("DOMContentLoaded", () => {
  initModalClose();

  // user chip
  const nameEl = document.getElementById("currentUserName");
  if (nameEl) nameEl.textContent = specialistUser.name || specialistUser.username || "Specialist";

  // nav
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;
      switchSection(section);
      loadSection(section);
    });
  });

  // logout
  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  // refresh button
  document.getElementById("refreshAllBtn")?.addEventListener("click", () => {
    const active = document.querySelector(".section.active")?.id.replace("section-", "") || "overview";
    loadSection(active);
  });

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

  // child profile buttons (delegated when modal opens)
  document.getElementById("btnAddSession")?.addEventListener("click", () => {
    const childId = document.getElementById("childProfileModal")?.dataset.childId;
    if (childId) openSessionModalForCreate(childId);
  });
  document.getElementById("btnAddAssessment")?.addEventListener("click", () => {
    const childId = document.getElementById("childProfileModal")?.dataset.childId;
    if (childId) openAssessmentModalForCreate(childId);
  });

  // initial section
  loadSection("overview");
});

// ------------- SECTION LOADER -------------
function loadSection(section) {
  if (section === "overview") loadOverview();
  if (section === "children") loadChildren();
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
        <span class="chip subtle">${ch.age ? ch.age + " yrs" : "Age N/A"}</span>
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
        <button class="ghost small" data-delete-child="${ch.child_id}">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // attach handlers (one-off for current render)
  grid.querySelectorAll("[data-edit-child]").forEach(btn =>
    btn.addEventListener("click", () => openChildModalForEdit(btn.dataset.editChild))
  );
  grid.querySelectorAll("[data-view-child]").forEach(btn =>
    btn.addEventListener("click", () => openChildProfile(btn.dataset.viewChild))
  );
  grid.querySelectorAll("[data-delete-child]").forEach(btn =>
    btn.addEventListener("click", () => deleteChild(btn.dataset.deleteChild))
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
    alert(res.error || "Error saving child");
    return;
  }
  closeModal("childModal");
  await loadChildren();
  await loadOverview();
}

async function deleteChild(childId) {
  if (!confirm("Soft delete this child?")) return;

  const res = await apiRequest("deleteChild", {
    child_id: childId,
    actor_username: specialistUser.username,
    actor_role: "specialist"
  });

  if (!res?.success) {
    alert(res.error || "Error deleting child");
    return;
  }
  await loadChildren();
  await loadOverview();
}

// ------------- CHILD PROFILE MODAL -------------
async function openChildProfile(childId) {
  const res = await apiRequest("getChildProfile", { child_id: childId });
  if (!res?.success) return;

  const child = res.child;
  const sessions = res.sessions || [];
  const assessments = res.assessments || [];

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
  sessionsList.querySelectorAll("[data-edit-session]").forEach(btn =>
    btn.addEventListener("click", () => openSessionModalForEdit(btn.dataset.editSession, childId))
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

  openModal("childProfileModal");
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

async function openSessionModalForEdit(sessionId, childId) {
  // get child profile and find that session row
  const res = await apiRequest("getChildProfile", { child_id: childId });
  if (!res?.success) return;
  const s = (res.sessions || []).find(x => x.session_id == sessionId);
  if (!s) return;

  document.getElementById("sessionModalTitle").textContent = "Edit Session";
  document.getElementById("sessionIdInput").value = s.session_id;
  document.getElementById("sessionChildIdInput").value = s.child_id;
  document.getElementById("sessionDateInput").value = String(s.date).slice(0, 10);
  document.getElementById("sessionDurationInput").value = s.duration_minutes || "";
  document.getElementById("sessionNotesInput").value = s.notes || "";

  await populateSessionModulesSelect(s.module_id);
  openModal("sessionModal");
}

async function saveSession() {
  const id = document.getElementById("sessionIdInput").value;
  const childId = document.getElementById("sessionChildIdInput").value;
  const date = document.getElementById("sessionDateInput").value;
  const duration = document.getElementById("sessionDurationInput").value;
  const notes = document.getElementById("sessionNotesInput").value;
  const modulesSelect = document.getElementById("sessionModulesInput");

  const selectedModules = Array.from(modulesSelect.selectedOptions).map(o => o.value);

  if (!date || !selectedModules.length) {
    alert("Please pick at least one module and a date.");
    return;
  }

  let res;
  if (id) {
    // update only this single row (one module)
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
    // create: can be multiple modules (one row per module in backend)
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
    alert(res.error || "Error saving session");
    return;
  }

  closeModal("sessionModal");
  // refresh child profile + sections
  await openChildProfile(childId);
  await loadOverview();
  await loadChildren();
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

  const res = await apiRequest("listQuestions");
  if (!res?.success) {
    container.textContent = "Error loading questions.";
    return;
  }

  const qs = res.questions || [];
  if (!qs.length) {
    container.textContent = "No questions configured yet.";
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
}

async function saveAssessment() {
  const childId = document.getElementById("assessmentChildIdInput").value;
  const date = document.getElementById("assessmentDateInput").value;
  if (!childId || !date) {
    alert("Child and date are required.");
    return;
  }

  const scoreInputs = document.querySelectorAll("[data-q-score]");
  const answers = [];
  scoreInputs.forEach(input => {
    const qId = input.getAttribute("data-q-score");
    const scoreVal = input.value;
    if (scoreVal !== "") {
      answers.push({ question_id: qId, score: Number(scoreVal) });
    }
  });

  if (!answers.length) {
    alert("Please enter at least one score.");
    return;
  }

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
    alert(res.error || "Error saving assessment");
    return;
  }

  closeModal("assessmentModal");
  await openChildProfile(childId);
  await loadOverview();
}

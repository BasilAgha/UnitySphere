let center = {};
let centerId = null;
let childrenCache = [];
let specialistsCache = [];

document.addEventListener("DOMContentLoaded", () => {
  authGuard("center");
  center = getCurrentUser();
  centerId = center.center_id;

  wrapModalClose();
  initModalClose();

  bindNavigation();
  bindCenterButtons();
  setUserAvatar();

  loadSection("overview");
});

function bindNavigation() {
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.section;
      switchSection(section);
      loadSection(section);
    });
  });
}

function bindCenterButtons() {
  document.getElementById("btnAddSpecialist")?.addEventListener("click", openAddSpecialistModal);
  document.getElementById("btnAddChild")?.addEventListener("click", openAddChildModal);
  document.getElementById("childSaveBtn")?.addEventListener("click", saveChild);
  document.getElementById("specSaveBtn")?.addEventListener("click", saveSpecialist);
  document.getElementById("refreshAllBtn")?.addEventListener("click", () => {
    const btn = document.getElementById("refreshAllBtn");
    setButtonLoading(btn, true, "Refreshing...");
    const active = document.querySelector(".section.active")?.id.replace("section-", "") || "overview";
    loadSection(active);
    setTimeout(() => setButtonLoading(btn, false), 400);
  });
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
}

function loadSection(section) {
  switch (section) {
    case "overview":
      loadOverview();
      break;
    case "specialists":
      loadSpecialists();
      break;
    case "children":
      loadChildren();
      break;
    case "modules":
      loadModules();
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

function wrapModalClose() {
  const baseClose = window.closeModal;
  if (typeof baseClose !== "function") return;
  window.closeModal = id => {
    baseClose(id);
    if (id === "childModal") resetChildModal();
    if (id === "specialistModal") resetSpecialistModal();
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
  setButtonLoading(document.getElementById("specSaveBtn"), false);
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
  document.querySelectorAll(".sidebar .avatar").forEach(avatar => {
    const photo = center.photo || center.photo_url || "";
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

function renderChildrenPerSpecialist(list) {
  const chart = document.getElementById("chartChildrenPerSpecialist");
  if (!chart) return;
  chart.innerHTML = "";
  if (!list.length) {
    chart.innerHTML = `<div class="hint">No specialists yet</div>`;
    return;
  }
  const maxCount = Math.max(...list.map(s => Number(s.num_children || 0)), 1);
  const container = document.createElement("div");
  container.className = "stacked-list";
  list.forEach(s => {
    const count = Number(s.num_children || 0);
    const item = document.createElement("div");
    item.className = "panel";
    item.innerHTML = `
      <div class="panel-header">
        <strong>${s.name || s.username || "Specialist"}</strong>
        <span class="meta-muted">${count} children</span>
      </div>
      <div class="progress-bar">
        <span style="width:${Math.round((count / maxCount) * 100)}%"></span>
      </div>
    `;
    container.appendChild(item);
  });
  chart.appendChild(container);
}

function renderModuleUsage(list) {
  const chart = document.getElementById("chartModuleUsage");
  if (!chart) return;
  chart.innerHTML = "";
  if (!list.length) {
    chart.innerHTML = `<div class="hint">No modules assigned</div>`;
    return;
  }
  const container = document.createElement("div");
  container.className = "stacked-list";
  list.forEach(m => {
    const count = Number(m.total_sessions || m.num_sessions || m.sessions || 0);
    const item = document.createElement("div");
    item.className = "panel";
    item.innerHTML = `
      <div class="panel-header">
        <strong>${m.name || "Module"}</strong>
        <span class="meta-muted">${count} sessions</span>
      </div>
    `;
    container.appendChild(item);
  });
  chart.appendChild(container);
}

async function loadOverview() {
  setText("statSpecialists", 0);
  setText("statChildren", 0);
  setText("statModules", 0);
  setText("statSessions", 0);
  const chartChildren = document.getElementById("chartChildrenPerSpecialist");
  const chartModules = document.getElementById("chartModuleUsage");
  if (chartChildren) chartChildren.innerHTML = "";
  if (chartModules) chartModules.innerHTML = "";

  const stats = await apiRequest("getCenterStats", { center_id: centerId });
  if (!handleApiFailure(stats)) {
    const totals = stats.totals || {};
    setText("statSpecialists", totals.specialists ?? 0);
    setText("statChildren", totals.children ?? 0);
    setText("statModules", totals.modules_assigned ?? 0);
    setText("statSessions", totals.sessions ?? 0);
  }

  const specialistsRes = await apiRequest("listSpecialists", { center_id: centerId });
  if (handleApiFailure(specialistsRes)) {
    if (chartChildren) chartChildren.innerHTML = `<div class="hint">Unable to load specialists</div>`;
  } else {
    renderChildrenPerSpecialist(specialistsRes.specialists || []);
  }

  const modulesRes = await apiRequest("listCenterModules", { center_id: centerId });
  if (handleApiFailure(modulesRes)) {
    if (chartModules) chartModules.innerHTML = `<div class="hint">Unable to load modules</div>`;
  } else {
    renderModuleUsage(modulesRes.modules || []);
  }
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
    card.className = "specialist-card";
    card.innerHTML = `
      <div class="avatar avatar-static${avatar ? " has-photo" : ""}" ${avatar ? `style="background-image:url('${avatar}')"` : `data-initials="${initials}"`}></div>
      <strong>${s.name || s.username || "Specialist"}</strong>
      <p>${s.description || "No description"}</p>
      <div class="specialist-credentials">
        <span class="chip subtle">User: ${s.username || "-"}</span>
        <span class="chip subtle">Children: ${s.num_children ?? 0}</span>
      </div>
      <div class="card-actions">
        <button class="ghost small" data-edit-specialist="${s.specialist_id}">Edit</button>
        <button class="ghost small danger" data-delete-specialist="${s.specialist_id}">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll("[data-edit-specialist]").forEach(btn => {
    btn.addEventListener("click", () => openEditSpecialistModal(btn.dataset.editSpecialist));
  });
  grid.querySelectorAll("[data-delete-specialist]").forEach(btn => {
    btn.addEventListener("click", () => deleteSpecialist(btn.dataset.deleteSpecialist));
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
    btn.addEventListener("click", () => deleteChild(btn.dataset.deleteChild));
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

  const specialistId = document.getElementById("specIdInput").value;
  const name = document.getElementById("specNameInput").value.trim();
  const username = document.getElementById("specUsernameInput").value.trim();
  const password = document.getElementById("specPasswordInput").value.trim();
  const description = document.getElementById("specDescriptionInput").value || "";

  if (!name || !username || !password) {
    showToast("Name, username, and password are required", "error");
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
    if (handleApiFailure(res)) return;
    closeModal("specialistModal");
    showToast(specialistId ? "Specialist updated" : "Specialist saved");
    loadSection("specialists");
    loadOverview();
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

async function deleteSpecialist(specId) {
  if (!confirm("Delete this specialist?")) return;
  const res = await apiRequest("deleteSpecialist", {
    specialist_id: specId,
    center_id: centerId,
    actor_username: center.username || getCurrentUsername(),
    actor_role: "center"
  });
  if (handleApiFailure(res)) return;
  showToast("Specialist deleted");
  loadSection("specialists");
  loadOverview();
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

  const childId = document.getElementById("childIdInput").value;
  const name = document.getElementById("childNameInput").value.trim();
  if (!name) {
    showToast("Child name is required", "error");
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
    if (handleApiFailure(res)) return;
    closeModal("childModal");
    showToast(childId ? "Child updated" : "Child saved");
    loadSection("children");
    loadOverview();
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

async function deleteChild(childId) {
  if (!confirm("Delete this child?")) return;
  const res = await apiRequest("deleteChild", {
    child_id: childId,
    center_id: centerId,
    actor_username: center.username || getCurrentUsername(),
    actor_role: "center"
  });
  if (handleApiFailure(res)) return;
  showToast("Child deleted");
  loadSection("children");
  loadOverview();
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

/* ===========================================
   CENTER DASHBOARD JS
   Uses apiGet/apiPost + helpers from dashboard-core.js
=========================================== */

// Route protection
if (sessionStorage.getItem("us_role") !== "center") {
  sessionStorage.clear();
  location.href = "login.html";
}

// Use helpers from dashboard-core.js:
//   qi(id), qs(sel), qsa(sel)

// Center identity from login
const centerName = sessionStorage.getItem("center_name")     || "Center";
const centerDesc = sessionStorage.getItem("center_desc")     || "";
const centerLoc  = sessionStorage.getItem("center_location") || "—";
const centerUser = sessionStorage.getItem("center_username") || "—";

// Local cache
let specialists = [];

/* ===============================
   LOAD SPECIALISTS FOR THIS CENTER
   =============================== */

async function loadSpecialists() {
  const listEl = qi("center-spec-list");
  const gridEl = qi("center-spec-grid");

  if (listEl) {
    listEl.innerHTML = '<div class="empty-state">Loading specialists…</div>';
  }
  if (gridEl) {
    gridEl.innerHTML = "";
  }

  let data;
  try {
    data = await apiGet({ action: "getspecialists" });
  } catch (err) {
    console.error("Error loading specialists:", err);
    if (listEl) {
      listEl.innerHTML =
        '<div class="empty-state">Error loading specialists. Please check Apps Script.</div>';
    }
    return;
  }

  if (!Array.isArray(data)) data = [];

  const centerNorm = centerName.trim().toLowerCase();

  // Only specialists of type "center" assigned to this center
  specialists = data
    .filter((s) => {
      const typeNorm   = String(s.type   || "").trim().toLowerCase();
      const cNorm      = String(s.center || "").trim().toLowerCase();
      return typeNorm === "center" && cNorm === centerNorm;
    })
    .map((s) => ({
      row:      Number(s.row),
      name:     s.name     || "",
      focus:    s.focus    || "",
      username: s.username || "",
      password: s.password || ""
    }));

  renderSpecialists();
  renderOverviewPreview();
  updateStats();
}

/* ===============================
   RENDER HELPERS
   =============================== */

function makeCard(spec) {
  const card = document.createElement("article");
  card.className = "specialist-card";

  const initial = (spec.name || spec.username || "?")
    .trim()
    .charAt(0)
    .toUpperCase() || "?";

  card.innerHTML = `
    <div class="avatar avatar-static">${initial}</div>
    <strong>${spec.name || "(No name)"}</strong>
    <p>${spec.focus || "Focus not set"}</p>
    <span class="badge badge-soft">Center specialist</span>

    <div class="specialist-credentials">
      <span class="badge badge-soft">Login: ${spec.username || "Not set"}</span>
      <span class="pill small">${spec.password || "••••••"}</span>
    </div>

    <div style="display:flex;gap:0.4rem;justify-content:center;">
      <button class="ghost small" onclick="openEdit(${spec.row})">Edit</button>
      <button class="primary ghost small" onclick="deleteSpec(${spec.row})">Delete</button>
    </div>
  `;

  return card;
}

function renderSpecialists() {
  const listEl = qi("center-spec-list");
  if (!listEl) return;

  listEl.innerHTML = "";

  if (!specialists.length) {
    listEl.innerHTML =
      '<div class="empty-state">No specialists yet. Use “Save specialist” to add your first.</div>';
    return;
  }

  specialists.forEach((s) => listEl.appendChild(makeCard(s)));
}

function renderOverviewPreview() {
  const gridEl = qi("center-spec-grid");
  if (!gridEl) return;

  gridEl.innerHTML = "";

  if (!specialists.length) {
    gridEl.innerHTML =
      '<div class="empty-state">No specialists assigned to this center yet.</div>';
    return;
  }

  specialists.slice(0, 4).forEach((s) => gridEl.appendChild(makeCard(s)));
}

function updateStats() {
  const total = specialists.length;

  const overviewCountEl = qi("center-spec-count");
  const mainCountEl     = qi("spec-count-main");

  if (overviewCountEl) overviewCountEl.textContent = String(total);
  if (mainCountEl)     mainCountEl.textContent     = String(total);
}

/* ===============================
   ADD SPECIALIST (CENTER-OWNED)
   =============================== */

async function handleAddSpecialist(e) {
  e.preventDefault();

  const name     = (qi("c-add-name")     ?.value || "").trim();
  const focus    = (qi("c-add-focus")    ?.value || "").trim();
  const username = (qi("c-add-username") ?.value || "").trim();
  const password = (qi("c-add-password") ?.value || "").trim();

  if (!name || !username || !password) {
    alert("Name, username, and password are required.");
    return;
  }

  let res;
  try {
    res = await apiPost({
      action:    "addspecialist",
      specName:  name,
      specFocus: focus,
      specUser:  username,
      specPass:  password,
      specType:  "center",
      specCenter: centerName     // <- center name, same as Admin uses
    });
  } catch (err) {
    console.error("Error adding specialist:", err);
    alert("Error adding specialist. Please check Apps Script.");
    return;
  }

  if (res !== "ADDED") {
    alert("Error adding specialist. Please check sheet / Apps Script.");
    return;
  }

  const form = qi("center-add-spec-form");
  if (form) form.reset();

  await loadSpecialists();
  alert("Specialist added successfully.");
}

/* ===============================
   DELETE SPECIALIST
   =============================== */

async function deleteSpecInternal(row) {
  if (!row || row <= 1) {
    alert("Invalid record.");
    return;
  }

  const spec = specialists.find((s) => s.row === row);
  const label = spec?.name || spec?.username || "this specialist";

  if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

  let res;
  try {
    res = await apiPost({
      action: "deletespecialist",
      row: String(row)
    });
  } catch (err) {
    console.error("Error deleting specialist:", err);
    alert("Error deleting specialist. Please check Apps Script.");
    return;
  }

  if (res !== "DELETED") {
    alert("Error deleting specialist. Please check sheet / Apps Script.");
    return;
  }

  specialists = specialists.filter((s) => s.row !== row);
  renderSpecialists();
  renderOverviewPreview();
  updateStats();
}

// expose for onclick=""
window.deleteSpec = deleteSpecInternal;

/* ===============================
   EDIT SPECIALIST
   =============================== */

function openEditInternal(row) {
  const modal = qi("edit-modal");
  if (!modal) return;

  const spec = specialists.find((s) => s.row === row);
  if (!spec) return;

  qi("edit-row").value      = String(spec.row);
  qi("edit-name").value     = spec.name;
  qi("edit-focus").value    = spec.focus;
  qi("edit-username").value = spec.username;
  qi("edit-password").value = spec.password;

  modal.classList.add("active");
}

window.openEdit = openEditInternal;

async function handleEditSubmit(e) {
  e.preventDefault();

  const row      = Number((qi("edit-row")     ?.value || "0"));
  const name     = (qi("edit-name")          ?.value || "").trim();
  const focus    = (qi("edit-focus")         ?.value || "").trim();
  const username = (qi("edit-username")      ?.value || "").trim();
  const password = (qi("edit-password")      ?.value || "").trim();

  if (!row || row <= 1) {
    alert("Invalid record.");
    return;
  }

  if (!name || !username || !password) {
    alert("Name, username, and password are required.");
    return;
  }

  let res;
  try {
    res = await apiPost({
      action:    "updatespecialist",
      row:       String(row),
      specName:  name,
      specFocus: focus,
      specUser:  username,
      specPass:  password,
      specType:  "center",
      specCenter: centerName
    });
  } catch (err) {
    console.error("Error updating specialist:", err);
    alert("Error updating specialist. Please check Apps Script.");
    return;
  }

  if (res !== "UPDATED") {
    alert("Error updating specialist. Please check sheet / Apps Script.");
    return;
  }

  const modal = qi("edit-modal");
  if (modal) modal.classList.remove("active");

  await loadSpecialists();
}

/* ===============================
   NAV / HEADER / LOGOUT / INIT
   =============================== */

window.addEventListener("DOMContentLoaded", () => {
  // Fill header + sidebar info
  qi("sidebar-name").textContent   = centerName;
  qi("center-name").textContent    = centerName;
  qi("center-desc").textContent    = centerDesc;
  qi("center-location").textContent = centerLoc;
  qi("center-username").textContent = centerUser;
  qi("center-greeting").textContent = `Welcome, ${centerName}`;

  const av = qi("center-sidebar-avatar");
  if (av && centerName) {
    av.textContent = centerName.trim().charAt(0).toUpperCase();
  }

  // Sidebar navigation
  const navBtns  = qsa(".nav-link");
  const sections = qsa(".section");

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-section");

      navBtns.forEach((b) => b.classList.remove("active"));
      sections.forEach((sec) => sec.classList.remove("active"));

      btn.classList.add("active");
      const target = qi(`section-${key}`);
      if (target) target.classList.add("active");
    });
  });

  // Logout
  const logoutBtn = qi("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.clear();
      location.href = "login.html";
    });
  }

  // Add specialist form
  const addForm = qi("center-add-spec-form");
  if (addForm) {
    addForm.addEventListener("submit", handleAddSpecialist);
  }

  // Edit modal close
  const editClose = qi("edit-close");
  if (editClose) {
    editClose.addEventListener("click", () => {
      const modal = qi("edit-modal");
      if (modal) modal.classList.remove("active");
    });
  }

  const editForm = qi("edit-form");
  if (editForm) {
    editForm.addEventListener("submit", handleEditSubmit);
  }

  // First load
  loadSpecialists();
});

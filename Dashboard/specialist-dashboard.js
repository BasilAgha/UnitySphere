/* ===========================================
   SPECIALIST DASHBOARD JS
   Uses apiGet/apiPost + helpers from dashboard-core.js
=========================================== */

// Route protection
if (sessionStorage.getItem("us_role") !== "specialist") {
  sessionStorage.clear();
  location.href = "login.html";
}

// Helpers from dashboard-core.js: qi, qs, qsa

// Specialist identity from login (to be set in dashboard-auth.js)
const specUsername = sessionStorage.getItem("spec_username") || "";
const specName     = sessionStorage.getItem("spec_name")     || specUsername || "Specialist";
const specFocus    = sessionStorage.getItem("spec_focus")    || "—";
const specCenter   = sessionStorage.getItem("spec_center")   || "";
const specType     = sessionStorage.getItem("spec_type")     || (specCenter ? "center" : "freelance");

// If somehow no username, force logout
if (!specUsername) {
  sessionStorage.clear();
  location.href = "login.html";
}

// DOM references
const sidebarNameEl     = qi("sidebar-name");
const sidebarAvatarEl   = qi("spec-sidebar-avatar");
const greetingEl        = qi("spec-greeting");
const titleEl           = qi("spec-title");
const specNameDisplay   = qi("spec-name-display");
const specFocusDisplay  = qi("spec-focus-display");
const specCenterBadge   = qi("spec-center-badge");

const childrenCountEl   = qi("spec-children-count");
const assessCountEl     = qi("spec-assess-count");
const assessAvgEl       = qi("spec-assess-avg");

const childrenPreviewEl = qi("spec-children-preview");
const childrenListEl    = qi("spec-children-list");

const assessForm        = qi("spec-assess-form");
const assessChildSelect = qi("assess-child-select");
const assessVRInput     = qi("assess-vr-module");
const assessQ1          = qi("assess-q1");
const assessQ2          = qi("assess-q2");
const assessQ3          = qi("assess-q3");
const assessQ4          = qi("assess-q4");
const assessQ5          = qi("assess-q5");
const assessNotes       = qi("assess-notes");
const assessHistoryEl   = qi("spec-assess-history");

// Local caches
let specChildren    = [];
let specAssessments = [];

/* =========================
   HEADER / IDENTITY SETUP
   ========================= */

function setupHeader() {
  if (sidebarNameEl) sidebarNameEl.textContent = specName;
  if (titleEl)       titleEl.textContent       = "Hi, " + specName;
  if (specNameDisplay)  specNameDisplay.textContent  = specName;
  if (specFocusDisplay) specFocusDisplay.textContent = specFocus || "—";

  // Center badge
  if (specCenterBadge) {
    if (specCenter) {
      specCenterBadge.textContent = specCenter;
    } else {
      specCenterBadge.textContent = "Freelance";
    }
  }

  // Greeting
  if (greetingEl) {
    const hour = new Date().getHours();
    const prefix =
      hour < 12 ? "Good morning" :
      hour < 18 ? "Good afternoon" :
                  "Good evening";
    greetingEl.textContent = prefix + ", " + specName + "!";
  }

  // Avatar initial
  if (sidebarAvatarEl) {
    const ch = (specName || specUsername || "S").trim()[0].toUpperCase();
    sidebarAvatarEl.textContent = ch;
  }
}

/* =========================
   NAVIGATION
   ========================= */

const navBtns   = qsa(".nav-link");
const sections  = qsa(".section");

function activateSection(key) {
  navBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === key);
  });

  sections.forEach((sec) => {
    const idKey = sec.id.replace("section-", "");
    sec.classList.toggle("active", idKey === key);
  });
}

navBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    activateSection(btn.dataset.section);
  });
});

// Default section
activateSection("overview");

/* =========================
   LOGOUT
   ========================= */

const logoutBtn = qi("logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.clear();
    location.href = "login.html";
  });
}

/* =========================
   CHILDREN LOADING
   ========================= */

async function loadSpecChildren() {
  if (childrenListEl) {
    childrenListEl.innerHTML =
      '<div class="empty-state">Loading children…</div>';
  }
  if (childrenPreviewEl) {
    childrenPreviewEl.innerHTML = "";
  }

  let data;
  try {
    data = await apiGet({ action: "getchildren" });
  } catch (err) {
    console.error("Error loading children for specialist:", err);
    if (childrenListEl) {
      childrenListEl.innerHTML =
        '<div class="empty-state">Error loading children. Please try again later.</div>';
    }
    return;
  }

  if (!Array.isArray(data)) data = [];

  specChildren = data
    .filter((c) => String(c.specialistUsername || "").trim() === specUsername)
    .map((c) => ({
      row:     Number(c.row),
      name:    c.name || "",
      age:     c.age || "",
      notes:   c.notes || "",
      center:  c.center || "",
      specUser: c.specialistUsername || ""
    }));

  renderSpecChildren();
  populateAssessChildSelect();
  updateChildrenStats();
}

function updateChildrenStats() {
  if (childrenCountEl) {
    childrenCountEl.textContent = String(specChildren.length);
  }
}

function renderSpecChildren() {
  // Overview preview (up to 3 children)
  if (childrenPreviewEl) {
    childrenPreviewEl.innerHTML = "";
    if (!specChildren.length) {
      childrenPreviewEl.innerHTML =
        '<div class="empty-state">No children yet.</div>';
    } else {
      specChildren.slice(0, 3).forEach((child) => {
        const card = document.createElement("article");
        card.className = "module-card";
        card.innerHTML =
          '<header>' +
          '  <strong>' + (child.name || "Unnamed child") + '</strong>' +
          '  <p class="hint">' + (child.notes || "No notes yet") + '</p>' +
          '</header>' +
          '<div class="module-meta">' +
          '  <span>🏢 ' + (child.center || "No center / freelance") + '</span>' +
          (child.age ? ('  <span>🎂 Age ' + child.age + '</span>') : "") +
          '</div>';

        childrenPreviewEl.appendChild(card);
      });
    }
  }

  // Children full list
  if (!childrenListEl) return;

  childrenListEl.innerHTML = "";
  if (!specChildren.length) {
    childrenListEl.innerHTML =
      '<div class="empty-state">No children assigned to you yet.</div>';
    return;
  }

  // Group by center (just for better structure)
  const byCenter = {};
  specChildren.forEach((c) => {
    const key = c.center || "No center / freelance";
    if (!byCenter[key]) byCenter[key] = [];
    byCenter[key].push(c);
  });

  Object.keys(byCenter)
    .sort((a, b) => {
      if (a === "No center / freelance") return 1;
      if (b === "No center / freelance") return -1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    })
    .forEach((centerKey) => {
      const label = document.createElement("p");
      label.className = "hint";
      label.style.marginTop = "0.6rem";
      label.textContent = centerKey;
      childrenListEl.appendChild(label);

      const grid = document.createElement("div");
      grid.className = "modules-grid";

      byCenter[centerKey].forEach((child) => {
        const card = document.createElement("article");
        card.className = "module-card";

        card.innerHTML =
          '<header>' +
          '  <strong>' + (child.name || "Unnamed child") + '</strong>' +
          '  <p class="hint">' + (child.notes || "No notes yet") + '</p>' +
          '</header>' +
          '<div class="module-meta">' +
          '  <span>🏢 ' + centerKey + '</span>' +
          (child.age ? ('  <span>🎂 Age ' + child.age + '</span>') : "") +
          '</div>';

        grid.appendChild(card);
      });

      childrenListEl.appendChild(grid);
    });
}

function populateAssessChildSelect() {
  if (!assessChildSelect) return;

  assessChildSelect.innerHTML = "";
  if (!specChildren.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No children available";
    assessChildSelect.appendChild(opt);
    assessChildSelect.disabled = true;
    return;
  }

  assessChildSelect.disabled = false;

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a child";
  placeholder.disabled = true;
  placeholder.selected = true;
  assessChildSelect.appendChild(placeholder);

  specChildren.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = String(c.row); // use row as ID
    opt.textContent = c.name + (c.center ? (" — " + c.center) : "");
    assessChildSelect.appendChild(opt);
  });
}

/* =========================
   ASSESSMENTS LOADING
   ========================= */

async function loadSpecAssessments() {
  if (assessHistoryEl) {
    assessHistoryEl.innerHTML =
      '<div class="empty-state">Loading assessments…</div>';
  }

  let data;
  try {
    data = await apiGet({
      action: "getassessments",
      specUsername: specUsername
    });
  } catch (err) {
    console.error("Error loading assessments:", err);
    if (assessHistoryEl) {
      assessHistoryEl.innerHTML =
        '<div class="empty-state">Error loading assessments. Please try again later.</div>';
    }
    return;
  }

  if (!Array.isArray(data)) data = [];

  specAssessments = data.map((a) => ({
    row:       Number(a.row),
    childName: a.childName || "",
    childRow:  a.childRow || "",
    center:    a.center || "",
    timestamp: a.timestamp || "",
    q1:        Number(a.q1 || 0),
    q2:        Number(a.q2 || 0),
    q3:        Number(a.q3 || 0),
    q4:        Number(a.q4 || 0),
    q5:        Number(a.q5 || 0),
    total:     Number(a.totalScore || 0),
    notes:     a.notes || "",
    vrModule:  a.vrModule || ""
  }));

  renderSpecAssessments();
  updateAssessStats();
}

function updateAssessStats() {
  if (!assessCountEl || !assessAvgEl) return;

  const count = specAssessments.length;
  assessCountEl.textContent = String(count);

  if (!count) {
    assessAvgEl.textContent = "0";
    return;
  }

  const sum = specAssessments.reduce((acc, a) => acc + (a.total || 0), 0);
  const avg = sum / count;
  assessAvgEl.textContent = avg.toFixed(1);
}

function renderSpecAssessments() {
  if (!assessHistoryEl) return;

  assessHistoryEl.innerHTML = "";

  if (!specAssessments.length) {
    assessHistoryEl.innerHTML =
      '<div class="empty-state">No assessments recorded yet.</div>';
    return;
  }

  // Build quick map of children by row
  const childByRow = {};
  specChildren.forEach((c) => {
    if (!c.row) return;
    childByRow[String(c.row)] = c;
  });

  // Group by child
  const byChild = {};
  specAssessments.forEach((a) => {
    const key = String(a.childRow || a.childName || "");
    if (!key) return;
    if (!byChild[key]) byChild[key] = [];
    byChild[key].push(a);
  });

  Object.keys(byChild).forEach((key) => {
    const group = byChild[key];
    const any = group[0];

    const info =
      (any.childRow && childByRow[String(any.childRow)]) || null;

    const childName = (info && info.name) || any.childName || "Child";

    const label = document.createElement("p");
    label.className = "hint";
    label.style.marginTop = "0.6rem";
    label.textContent = childName;
    assessHistoryEl.appendChild(label);

    const grid = document.createElement("div");
    grid.className = "modules-grid";

    group
      .slice()
      .sort((a, b) => {
        const ta = String(a.timestamp || "");
        const tb = String(b.timestamp || "");
        return tb.localeCompare(ta);
      })
      .forEach((a) => {
        const card = document.createElement("article");
        card.className = "module-card";

        const vrPart = a.vrModule ? ('<span>🕶 ' + a.vrModule + '</span>') : "";

        card.innerHTML =
          '<header>' +
          '  <strong>Score ' + a.total + '/50</strong>' +
          '  <p class="hint">' + (a.timestamp || "") + '</p>' +
          '</header>' +
          '<div class="module-meta">' +
          '  <span>Q1: ' + a.q1 + '</span>' +
          '  <span>Q2: ' + a.q2 + '</span>' +
          '  <span>Q3: ' + a.q3 + '</span>' +
          '  <span>Q4: ' + a.q4 + '</span>' +
          '  <span>Q5: ' + a.q5 + '</span>' +
          (vrPart ? ('  ' + vrPart) : '') +
          '</div>' +
          (a.notes
            ? '<p class="hint" style="margin-top:0.35rem;">' +
              String(a.notes) +
              '</p>'
            : '');

        grid.appendChild(card);
      });

    assessHistoryEl.appendChild(grid);
  });
}

/* =========================
   ADD ASSESSMENT (FORM)
   ========================= */

if (assessForm) {
  assessForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!specChildren.length) {
      alert("You have no children to assess.");
      return;
    }

    const childRow = assessChildSelect && assessChildSelect.value;
    if (!childRow) {
      alert("Please select a child.");
      return;
    }

    const child = specChildren.find((c) => String(c.row) === String(childRow));
    if (!child) {
      alert("Selected child not found.");
      return;
    }

    function parseScore(inputEl, label) {
      if (!inputEl) return null;
      const raw = inputEl.value.trim();
      const n = Number(raw);
      if (!n || n < 1 || n > 10) {
        alert(label + " must be a number between 1 and 10.");
        return null;
      }
      return n;
    }

    const q1 = parseScore(assessQ1, "Q1");
    if (q1 === null) return;
    const q2 = parseScore(assessQ2, "Q2");
    if (q2 === null) return;
    const q3 = parseScore(assessQ3, "Q3");
    if (q3 === null) return;
    const q4 = parseScore(assessQ4, "Q4");
    if (q4 === null) return;
    const q5 = parseScore(assessQ5, "Q5");
    if (q5 === null) return;

    const notes    = assessNotes ? assessNotes.value.trim() : "";
    const vrModule = assessVRInput ? assessVRInput.value.trim() : "";

    let res;
    try {
      res = await apiPost({
        action:        "addassessment",
        childName:     child.name,
        childRow:      String(child.row),
        specUsername:  specUsername,
        center:        child.center || specCenter || "",
        q1:            String(q1),
        q2:            String(q2),
        q3:            String(q3),
        q4:            String(q4),
        q5:            String(q5),
        notes:         notes,
        vrModule:      vrModule
      });
    } catch (err) {
      console.error("Error adding assessment:", err);
      alert("Error adding assessment. Please try again.");
      return;
    }

    if (res !== "ADDED") {
      alert("Error adding assessment: " + res);
      return;
    }

    if (assessForm) assessForm.reset();
    await loadSpecAssessments();
    alert("Assessment saved.");
  });
}

/* =========================
   INITIAL LOAD
   ========================= */

setupHeader();
loadSpecChildren();
loadSpecAssessments();

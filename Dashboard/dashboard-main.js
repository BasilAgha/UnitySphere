// ================= CONFIG =================
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzFvCaHToqUu-QYdyD2KYkQn_Z9qo8RVpwNUE1bxBHGV9T7QHW78an8Bl8FjiWeuFm17Q/exec";

// Simple helpers
function qi(id) {
  return document.getElementById(id);
}
function qs(sel, root) {
  return (root || document).querySelector(sel);
}
function qsa(sel, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(sel));
}

// POST helper
async function apiPost(params) {
  const body = new URLSearchParams();
  Object.keys(params).forEach(function (k) {
    body.append(k, params[k]);
  });

  const res = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    body: body
  });
  return res.text();
}

// GET helper
async function apiGet(params) {
  const url = new URL(GOOGLE_SCRIPT_URL);
  Object.keys(params).forEach(function (k) {
    url.searchParams.append(k, params[k]);
  });
  const res = await fetch(url.toString());
  return res.json();
}

// =====================================================
//                  DASHBOARD PAGE
// =====================================================
function isDashboardPage() {
  return location.pathname.toLowerCase().indexOf("dashboard.html") !== -1;
}

if (isDashboardPage()) {
  // 🔒 Admin-only
  if (sessionStorage.getItem("us_role") !== "admin") {
    sessionStorage.clear();
    location.href = "login.html";
  }

  // ================= HEADER =================
  var rawUsername = sessionStorage.getItem("us_username") || "Admin";
  var displayName = (rawUsername.split("@")[0] || rawUsername) || "Admin";

  var sidebarNameEl = qi("sidebar-name");
  var userNameEl = qi("user-name");
  var greetingEl = qi("greeting");
  var headerAvatarEl = qi("header-avatar");
  var sidebarAvatarEl = qi("sidebar-avatar");
  var userRoleEl = qi("user-role");

  if (sidebarNameEl) sidebarNameEl.textContent = displayName;
  if (userNameEl) userNameEl.textContent = displayName;

  if (greetingEl) {
    var hour = new Date().getHours();
    var prefix =
      hour < 12 ? "Good morning" :
      hour < 18 ? "Good afternoon" :
      "Good evening";
    greetingEl.textContent = prefix + ", " + displayName + "!";
  }

  if (userRoleEl) userRoleEl.textContent = "Main admin";

  function setAvatarInitial(el, name) {
    if (!el || !name) return;
    var trimmed = name.trim();
    el.textContent = (trimmed[0] || "A").toUpperCase();
  }

  setAvatarInitial(headerAvatarEl, displayName);
  setAvatarInitial(sidebarAvatarEl, displayName);

  // ================= NAVIGATION =================
  var navBtns = qsa(".nav-link");
  var sections = qsa(".section");

  function activate(key) {
    navBtns.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-section") === key);
    });

    sections.forEach(function (sec) {
      var secKey = sec.id.replace("section-", "");
      sec.classList.toggle("active", secKey === key);
    });

    var activeBtn = qs('.nav-link[data-section="' + key + '"] span');
    var titleText = activeBtn ? activeBtn.textContent : "Admin Dashboard";
    var titleEl = qi("section-title");
    if (titleEl) titleEl.textContent = titleText;
  }

  navBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activate(btn.getAttribute("data-section"));
    });
  });

  // Default section
  activate("overview");

  // ================= LOGOUT =================
  var logoutBtn = qi("logout");
  if (logoutBtn) {
    logoutBtn.onclick = function () {
      sessionStorage.clear();
      location.href = "login.html";
    };
  }

  // =====================================================
  //                 SHARED STATE
  // =====================================================
  var centersCache = [];
  var specialistsCache = [];
  var childrenCache = [];

  // =====================================================
  //       CENTERS SECTION — SIMPLE SHEET MODEL
  // =====================================================
  var centersGrid = qi("centers-grid");
  var statCenters = qi("stat-centers");
  var centersTotalEl = qi("centers-total");
  var addPanel = qi("add-center-panel");
  var toggleBtn = qi("btn-toggle-add-center");
  var cancelBtn = qi("btn-cancel-center");
  var centerForm = qi("form-center");

  // ---- Collapsible Form ----
  if (addPanel && toggleBtn) {
    var defaultOpenLabel =
      toggleBtn.getAttribute("data-label-open") || toggleBtn.textContent.trim();
    var defaultCloseLabel =
      toggleBtn.getAttribute("data-label-close") || "Close form";
    var labelEl = toggleBtn.querySelector(".label");

    function updateToggleLabel(text) {
      if (labelEl) labelEl.textContent = text;
      else toggleBtn.textContent = text;
    }

    function setToggleState(isOpen) {
      addPanel.classList.toggle("active", isOpen);
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
      toggleBtn.classList.toggle("is-open", isOpen);
      updateToggleLabel(isOpen ? defaultCloseLabel : defaultOpenLabel);
    }

    setToggleState(false);

    toggleBtn.addEventListener("click", function () {
      var isOpen = !addPanel.classList.contains("active");
      setToggleState(isOpen);
      if (isOpen) {
        addPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        setToggleState(false);
      });
    }
  }

  // ---- Render centers (with specialists under each center) ----
  function renderCenters() {
    if (!centersGrid) return;

    centersGrid.innerHTML = "";

    if (!centersCache.length) {
      centersGrid.innerHTML = '' +
        '<div class="empty-state">' +
        '  No centers yet. Use “Add New Center” to create the first record in your "centers" sheet.' +
        '</div>';
      if (statCenters) statCenters.textContent = "0";
      if (centersTotalEl) centersTotalEl.textContent = "0";
      return;
    }

    if (statCenters) statCenters.textContent = String(centersCache.length);
    if (centersTotalEl) centersTotalEl.textContent = String(centersCache.length);

    centersCache.forEach(function (c) {
      var card = document.createElement("article");
      card.className = "center-card";

      card.innerHTML =
        '<img src="https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?q=80&w=1600&auto=format&fit=crop" alt="' + (c.name || "Center") + '">' +
        '<div class="card-body">' +
        '  <div class="title">' + (c.name || "Unnamed center") + '</div>' +
        '  <div class="place muted">📍 ' + (c.location || "Location not set") + '</div>' +
        '  <div class="desc muted">' + (c.desc || "Add a short description so others know this center’s focus.") + '</div>' +
        '  <div class="tag-row">' +
        '    <span class="tag">General</span>' +
        '  </div>' +
        '</div>' +
        '<div class="center-roster">' +
        '  <div class="center-roster-header">' +
        '    <span>Specialists</span>' +
        '    <span class="hint">Linked via “Under a center” type.</span>' +
        '  </div>' +
        '  <ul class="center-roster-list"></ul>' +
        '</div>' +
        '<footer class="center-footer">' +
        '  <div class="center-credentials">' +
        '    <span class="badge badge-soft">' + (c.username ? ("Login: " + c.username) : "Login pending") + '</span>' +
        (c.password ? ('    <span class="pill">' + c.password + '</span>') : "") +
        '  </div>' +
        '</footer>';

      var rosterList = card.querySelector(".center-roster-list");
      var assignedSpecs = specialistsCache.filter(function (s) {
        return s.type === "center" && s.center === c.name;
      });

      if (!assignedSpecs.length) {
        var empty = document.createElement("div");
        empty.className = "muted center-roster-empty";
        empty.textContent = "No specialists assigned yet.";
        rosterList.parentNode.replaceChild(empty, rosterList);
      } else {
        assignedSpecs.forEach(function (s) {
          var li = document.createElement("li");
          li.innerHTML =
            "<strong>" + (s.name || s.username) + "</strong>" +
            '<span class="role">' + (s.focus || "") + "</span>";
          rosterList.appendChild(li);
        });
      }

      centersGrid.appendChild(card);
    });
  }

  // ---- Load centers ----
  async function loadCenters() {
    if (!centersGrid) return;

    centersGrid.innerHTML =
      '<div class="empty-state">Loading centers…</div>';

    var centers;
    try {
      centers = await apiGet({ action: "getcenters" });
    } catch (err) {
      console.error(err);
      centersGrid.innerHTML =
        '<div class="empty-state">' +
        '  Error loading centers. Check your Apps Script endpoint / CORS.' +
        '</div>';
      if (statCenters) statCenters.textContent = "0";
      if (centersTotalEl) centersTotalEl.textContent = "0";
      return;
    }

    if (!Array.isArray(centers)) centers = [];

    centersCache = centers.map(function (c) {
      return {
        name: c.name || "",
        desc: c.desc || "",
        location: c.location || "",
        username: c.username || "",
        password: c.password || ""
      };
    });

    renderCenters();
    populateChildCenterSelect();
  }

  // ---- Add center form handler ----
  if (centerForm) {
    centerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      var name = (qi("center-name") && qi("center-name").value || "").trim();
      var desc = (qi("center-desc") && qi("center-desc").value || "").trim();
      var location = (qi("center-location") && qi("center-location").value || "").trim();
      var user = (qi("center-username") && qi("center-username").value || "").trim();
      var pass = (qi("center-password") && qi("center-password").value || "").trim();

      if (!name || !user || !pass) {
        alert("Center name, username, and password are required.");
        return;
      }

      var res;
      try {
        res = await apiPost({
          action: "addcenter",
          centerName: name,
          centerDesc: desc,
          centerLocation: location,
          centerUser: user,
          centerPass: pass
        });
      } catch (err) {
        console.error(err);
        alert("Error adding center. Please check the Apps Script endpoint.");
        return;
      }

      if (res !== "ADDED") {
        alert("Error adding center. Please check the sheet/Apps Script.");
        return;
      }

      centerForm.reset();
      await loadCenters();
      alert("Center added successfully.");
    });
  }

  // =====================================================
  //         SPECIALISTS SYSTEM (FULL + GROUPED)
  // =====================================================
  var specialistsTotalEl    = qi("specialists-total");
  var specialistsAssignedEl = qi("specialists-assigned");
  var statSpecialistsEl     = qi("stat-specialists");

  var specForm            = qi("admin-add-specialist-form");
  var specTypeSelect      = qi("spec-type");
  var specCenterWrapper   = qi("spec-center-wrapper");
  var specCenterSelect    = qi("spec-center");
  var specFilterSelect    = qi("spec-filter");
  var specSearchInput     = qi("spec-search");
  var specSortSelect      = qi("spec-sort");
  var specExportBtn       = qi("spec-export-btn");
  var specialistsListWrap = qi("specialists-list");

  // Edit modal elements
  var specEditModal          = qi("spec-edit-modal");
  var specEditForm           = qi("spec-edit-form");
  var specEditRowInput       = qi("spec-edit-row");
  var specEditNameInput      = qi("spec-edit-name");
  var specEditFocusInput     = qi("spec-edit-focus");
  var specEditUsernameInput  = qi("spec-edit-username");
  var specEditPasswordInput  = qi("spec-edit-password");
  var specEditTypeSelect     = qi("spec-edit-type");
  var specEditCenterWrapper  = qi("spec-edit-center-wrapper");
  var specEditCenterSelect   = qi("spec-edit-center");
  var specEditCloseBtn       = qi("spec-edit-close");
  var specEditCancelBtn      = qi("spec-edit-cancel");

  // ---- Populate any centers <select> ----
  async function populateCentersSelect(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = "";

    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select center";
    selectEl.appendChild(placeholder);

    var centers;
    try {
      centers = await apiGet({ action: "getcenters" });
    } catch (err) {
      console.error("Error loading centers:", err);
      return;
    }

    if (!Array.isArray(centers)) return;

    centers.forEach(function (center) {
      if (!center.name) return;
      var opt = document.createElement("option");
      opt.value = center.name;
      opt.textContent = center.name;
      selectEl.appendChild(opt);
    });
  }

  // ---- Show/hide center dropdown on Add form ----
  if (specTypeSelect && specCenterWrapper) {
    function updateCenterVisibilityAdd() {
      if (specTypeSelect.value === "center") {
        specCenterWrapper.style.display = "block";
        populateCentersSelect(specCenterSelect);
      } else {
        specCenterWrapper.style.display = "none";
      }
    }
    specTypeSelect.addEventListener("change", updateCenterVisibilityAdd);
    updateCenterVisibilityAdd();
  }

  // ---- Search helper ----
  function matchesSearch(spec, term) {
    if (!term) return true;
    var haystack = (spec.name + " " + spec.focus + " " + spec.username + " " + spec.center).toLowerCase();
    return haystack.indexOf(term) !== -1;
  }

  // ---- Specialist card (with Edit + Delete) ----
  function createSpecialistCard(spec) {
    var card = document.createElement("article");
    card.className = "specialist-card";

    var avatar = document.createElement("div");
    avatar.className = "avatar avatar-static";
    var src = (spec.name || spec.username || "?");
    var initial = (src.trim()[0] || "?").toUpperCase();
    avatar.textContent = initial;

    var nameEl = document.createElement("strong");
    nameEl.textContent = spec.name || "(No name)";

    var focusEl = document.createElement("p");
    focusEl.textContent = spec.focus || "Focus not set";

    var typeBadge = document.createElement("span");
    typeBadge.className = "badge badge-soft";
    if (spec.type === "center") {
      typeBadge.textContent = spec.center ? ("Center: " + spec.center) : "Center specialist";
    } else {
      typeBadge.textContent = "Freelance specialist";
    }

    var creds = document.createElement("div");
    creds.className = "specialist-credentials";

    var userBadge = document.createElement("span");
    userBadge.className = "badge badge-soft";
    userBadge.textContent = spec.username ? ("Login: " + spec.username) : "Login not set";
    creds.appendChild(userBadge);

    if (spec.password) {
      var passPill = document.createElement("span");
      passPill.className = "pill small";
      passPill.textContent = spec.password;
      creds.appendChild(passPill);
    }

    var actionsRow = document.createElement("div");
    actionsRow.style.display = "flex";
    actionsRow.style.justifyContent = "center";
    actionsRow.style.gap = "0.4rem";

    var editBtn = document.createElement("button");
    editBtn.className = "ghost small";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", function () {
      openEditModal(spec);
    });

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "primary ghost small";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", function () {
      handleDeleteSpecialist(spec);
    });

    actionsRow.appendChild(editBtn);
    actionsRow.appendChild(deleteBtn);

    card.appendChild(avatar);
    card.appendChild(nameEl);
    card.appendChild(focusEl);
    card.appendChild(typeBadge);
    card.appendChild(creds);
    card.appendChild(actionsRow);

    return card;
  }

  // ---- Stats ----
  function updateSpecialistStats() {
    var total = specialistsCache.length;
    var assigned = specialistsCache.filter(function (s) {
      return s.type === "center";
    }).length;

    if (specialistsTotalEl) specialistsTotalEl.textContent = String(total);
    if (specialistsAssignedEl) specialistsAssignedEl.textContent = String(assigned);
    if (statSpecialistsEl) statSpecialistsEl.textContent = String(total);
  }

  // ---- Render specialists (grouped + search + filter + sort) ----
  function renderSpecialists() {
    if (!specialistsListWrap) return;

    specialistsListWrap.innerHTML = "";

    if (!specialistsCache.length) {
      specialistsListWrap.innerHTML =
        '<div class="empty-state">' +
        '  No specialists yet. Use “Save specialist” to create the first record in your "specialists" sheet.' +
        '</div>';
      updateSpecialistStats();
      return;
    }

    var filterVal = specFilterSelect ? specFilterSelect.value : "all";
    var searchTerm = specSearchInput ? specSearchInput.value.trim().toLowerCase() : "";
    var sortVal = specSortSelect ? specSortSelect.value : "name-asc";

    function byNameAsc(a, b) {
      var an = a.name || a.username || "";
      var bn = b.name || b.username || "";
      return an.localeCompare(bn, undefined, { sensitivity: "base" });
    }

    var freelances = specialistsCache
      .filter(function (s) {
        return s.type !== "center" && matchesSearch(s, searchTerm);
      })
      .sort(byNameAsc);

    var centers = specialistsCache
      .filter(function (s) {
        return s.type === "center" && matchesSearch(s, searchTerm);
      });

    var centersByName = {};
    centers.forEach(function (s) {
      var key = s.center || "Unassigned center";
      if (!centersByName[key]) centersByName[key] = [];
      centersByName[key].push(s);
    });

    var centerNames = Object.keys(centersByName);
    if (sortVal === "center-asc") {
      centerNames.sort(function (a, b) {
        return a.localeCompare(b, undefined, { sensitivity: "base" });
      });
    } else {
      centerNames.sort();
    }
    centerNames.forEach(function (name) {
      centersByName[name].sort(byNameAsc);
    });

    // Freelance section
    if (filterVal === "all" || filterVal === "freelance") {
      var titleF = document.createElement("h4");
      titleF.className = "hint";
      titleF.textContent = "Freelance specialists";
      specialistsListWrap.appendChild(titleF);

      if (!freelances.length) {
        var emptyF = document.createElement("div");
        emptyF.className = "empty-state";
        emptyF.textContent = "No freelance specialists yet.";
        specialistsListWrap.appendChild(emptyF);
      } else {
        var gridF = document.createElement("div");
        gridF.className = "specialists-grid";
        freelances.forEach(function (s) {
          gridF.appendChild(createSpecialistCard(s));
        });
        specialistsListWrap.appendChild(gridF);
      }
    }

    // Center section
    if (filterVal === "all" || filterVal === "center") {
      var titleC = document.createElement("h4");
      titleC.className = "hint";
      titleC.style.marginTop = "1rem";
      titleC.textContent = "Center specialists (grouped by center)";
      specialistsListWrap.appendChild(titleC);

      if (!centerNames.length) {
        var emptyC = document.createElement("div");
        emptyC.className = "empty-state";
        emptyC.textContent = "No center specialists yet.";
        specialistsListWrap.appendChild(emptyC);
      } else {
        centerNames.forEach(function (centerName) {
          var label = document.createElement("p");
          label.className = "hint";
          label.style.marginTop = "0.6rem";
          label.textContent = centerName;
          specialistsListWrap.appendChild(label);

          var gridC = document.createElement("div");
          gridC.className = "specialists-grid";
          centersByName[centerName].forEach(function (s) {
            gridC.appendChild(createSpecialistCard(s));
          });
          specialistsListWrap.appendChild(gridC);
        });
      }
    }

    updateSpecialistStats();
  }

  // ---- Load specialists from sheet ----
  async function loadSpecialists() {
    if (!specialistsListWrap) return;

    specialistsListWrap.innerHTML =
      '<div class="empty-state">Loading specialists…</div>';

    var specs;
    try {
      specs = await apiGet({ action: "getspecialists" });
    } catch (err) {
      console.error("Error loading specialists:", err);
      specialistsListWrap.innerHTML =
        '<div class="empty-state">' +
        '  Error loading specialists. Check your Apps Script endpoint / CORS.' +
        '</div>';
      if (specialistsTotalEl) specialistsTotalEl.textContent = "0";
      if (specialistsAssignedEl) specialistsAssignedEl.textContent = "0";
      if (statSpecialistsEl) statSpecialistsEl.textContent = "0";
      return;
    }

    if (!Array.isArray(specs)) specs = [];

    specialistsCache = specs.map(function (s) {
      return {
        row: Number(s.row),
        name: s.name || "",
        focus: s.focus || "",
        username: s.username || "",
        password: s.password || "",
        type: (s.type || "freelance").toLowerCase() === "center" ? "center" : "freelance",
        center: s.center || ""
      };
    });

    renderSpecialists();
    renderCenters();
  }

  // ---- Delete specialist ----
  async function handleDeleteSpecialist(spec) {
    if (!spec.row) return;
    var label = spec.name || spec.username || "this specialist";
    if (!window.confirm("Delete " + label + "? This cannot be undone.")) return;

    var res;
    try {
      res = await apiPost({
        action: "deletespecialist",
        row: String(spec.row)
      });
    } catch (err) {
      console.error("Error deleting specialist:", err);
      alert("Error deleting specialist. Please check the Apps Script endpoint.");
      return;
    }

    if (res !== "DELETED") {
      alert("Error deleting specialist. Please check the sheet/Apps Script.");
      return;
    }

    specialistsCache = specialistsCache.filter(function (s) {
      return s.row !== spec.row;
    });
    renderSpecialists();
    renderCenters();
  }

  // ---- Add specialist (form submit) ----
  if (specForm) {
    specForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      var name = (qi("spec-name") && qi("spec-name").value || "").trim();
      var focus = (qi("spec-focus") && qi("spec-focus").value || "").trim();
      var username = (qi("spec-username") && qi("spec-username").value || "").trim();
      var password = (qi("spec-password") && qi("spec-password").value || "").trim();
      var type = specTypeSelect ? specTypeSelect.value : "freelance";
      var center =
        type === "center" && specCenterSelect
          ? (specCenterSelect.value || "").trim()
          : "";

      if (!name || !username || !password) {
        alert("Name, username, and password are required.");
        return;
      }

      if (type === "center" && !center) {
        alert("Please select a center for this specialist.");
        return;
      }

      var res;
      try {
        res = await apiPost({
          action: "addspecialist",
          specName: name,
          specFocus: focus,
          specUser: username,
          specPass: password,
          specType: type,
          specCenter: center
        });
      } catch (err) {
        console.error("Error adding specialist:", err);
        alert("Error adding specialist. Please check the Apps Script endpoint.");
        return;
      }

      if (res !== "ADDED") {
        alert("Error adding specialist. Please check the sheet/Apps Script.");
        return;
      }

      specForm.reset();
      if (specCenterWrapper) specCenterWrapper.style.display = "none";
      if (specTypeSelect) specTypeSelect.value = "freelance";

      await loadSpecialists();
      alert("Specialist added successfully.");
    });
  }

  // ---- Edit Modal: open/close/save ----
  function openEditModal(spec) {
    if (!specEditModal || !specEditForm) return;

    specEditRowInput.value      = spec.row || "";
    specEditNameInput.value     = spec.name || "";
    specEditFocusInput.value    = spec.focus || "";
    specEditUsernameInput.value = spec.username || "";
    specEditPasswordInput.value = spec.password || "";
    specEditTypeSelect.value    = spec.type === "center" ? "center" : "freelance";

    var showCenter = specEditTypeSelect.value === "center";

    function afterCentersLoaded() {
      if (spec.type === "center" && spec.center && specEditCenterSelect) {
        specEditCenterSelect.value = spec.center;
      }
    }

    if (showCenter) {
      specEditCenterWrapper.style.display = "block";
      populateCentersSelect(specEditCenterSelect).then(afterCentersLoaded);
    } else {
      specEditCenterWrapper.style.display = "none";
      if (specEditCenterSelect) specEditCenterSelect.value = "";
    }

    specEditModal.classList.add("active");
  }

  function closeEditModal() {
    if (specEditModal) specEditModal.classList.remove("active");
  }

  if (specEditCloseBtn) {
    specEditCloseBtn.addEventListener("click", closeEditModal);
  }
  if (specEditCancelBtn) {
    specEditCancelBtn.addEventListener("click", closeEditModal);
  }

  if (specEditTypeSelect && specEditCenterWrapper) {
    specEditTypeSelect.addEventListener("change", function () {
      if (specEditTypeSelect.value === "center") {
        specEditCenterWrapper.style.display = "block";
        populateCentersSelect(specEditCenterSelect);
      } else {
        specEditCenterWrapper.style.display = "none";
        if (specEditCenterSelect) specEditCenterSelect.value = "";
      }
    });
  }

  if (specEditForm) {
    specEditForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      var row      = Number(specEditRowInput.value || "0");
      var name     = specEditNameInput.value.trim();
      var focus    = specEditFocusInput.value.trim();
      var username = specEditUsernameInput.value.trim();
      var password = specEditPasswordInput.value.trim();
      var type     = specEditTypeSelect.value;
      var center   = type === "center" && specEditCenterSelect
        ? specEditCenterSelect.value.trim()
        : "";

      if (!row || row <= 1) {
        alert("Invalid record.");
        return;
      }

      if (!name || !username || !password) {
        alert("Name, username, and password are required.");
        return;
      }

      if (type === "center" && !center) {
        alert("Please select a center for this specialist.");
        return;
      }

      var res;
      try {
        res = await apiPost({
          action: "updatespecialist",
          row: String(row),
          specName: name,
          specFocus: focus,
          specUser: username,
          specPass: password,
          specType: type,
          specCenter: center
        });
      } catch (err) {
        console.error("Error updating specialist:", err);
        alert("Error updating specialist. Please check the Apps Script endpoint.");
        return;
      }

      if (res !== "UPDATED") {
        alert("Error updating specialist. Please check the sheet/Apps Script.");
        return;
      }

      var idx = -1;
      for (var i = 0; i < specialistsCache.length; i++) {
        if (specialistsCache[i].row === row) {
          idx = i;
          break;
        }
      }
      if (idx !== -1) {
        specialistsCache[idx] = {
          row: row,
          name: name,
          focus: focus,
          username: username,
          password: password,
          type: type,
          center: center
        };
      }

      renderSpecialists();
      renderCenters();
      closeEditModal();
      alert("Specialist updated successfully.");
    });
  }

  // ---- Search / filter / sort / export wiring ----
  if (specFilterSelect) {
    specFilterSelect.addEventListener("change", renderSpecialists);
  }
  if (specSearchInput) {
    specSearchInput.addEventListener("input", renderSpecialists);
  }
  if (specSortSelect) {
    specSortSelect.addEventListener("change", renderSpecialists);
  }

  if (specExportBtn) {
    specExportBtn.addEventListener("click", function () {
      if (!specialistsCache.length) {
        alert("No specialists to export.");
        return;
      }

      var rows = [
        ["Name", "Focus", "Username", "Password", "Type", "Center"]
      ];

      specialistsCache.forEach(function (s) {
        rows.push([
          s.name || "",
          s.focus || "",
          s.username || "",
          s.password || "",
          s.type || "",
          s.center || ""
        ]);
      });

      var csv = rows
        .map(function (r) {
          return r
            .map(function (field) {
              var val = String(field == null ? "" : field);
              return '"' + val.replace(/"/g, '""') + '"';
            })
            .join(",");
        })
        .join("\r\n");

      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "specialists.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }


  // =====================================================
  //                     CHILDREN SYSTEM
  // =====================================================

  var childrenListWrap        = qi("children-list");
  var childrenTotalEl         = qi("children-total");
  var childrenWithCenterEl    = qi("children-with-center");
  var childrenWithoutCenterEl = qi("children-without-center");
  var childForm               = qi("admin-add-child-form");
  var childCenterSelect       = qi("child-center");
  var childSpecSelect         = qi("child-specialist");

  function populateChildCenterSelect() {
    if (!childCenterSelect) return;

    childCenterSelect.innerHTML = "";
    var optNone = document.createElement("option");
    optNone.value = "";
    optNone.textContent = "No center / freelance";
    childCenterSelect.appendChild(optNone);

    centersCache.forEach(function (c) {
      if (!c.name) return;
      var opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = c.name;
      childCenterSelect.appendChild(opt);
    });
  }

  function populateChildSpecialistSelect() {
    if (!childSpecSelect) return;

    childSpecSelect.innerHTML = "";
    var optNone = document.createElement("option");
    optNone.value = "";
    optNone.textContent = "Unassigned specialist";
    childSpecSelect.appendChild(optNone);

    specialistsCache.forEach(function (s) {
      var label = s.name || s.username || "(No name)";
      if (s.type === "center" && s.center) {
        label += " — " + s.center;
      } else {
        label += " — Freelance";
      }

      var opt = document.createElement("option");
      opt.value = s.username;
      opt.textContent = label;
      childSpecSelect.appendChild(opt);
    });
  }

  function updateChildrenStats() {
    var total = childrenCache.length;
    var withCenter = childrenCache.filter(function (c) { return c.center; }).length;
    var withoutCenter = total - withCenter;

    if (childrenTotalEl)         childrenTotalEl.textContent         = String(total);
    if (childrenWithCenterEl)    childrenWithCenterEl.textContent    = String(withCenter);
    if (childrenWithoutCenterEl) childrenWithoutCenterEl.textContent = String(withoutCenter);
  }

  function createChildCard(child, ctx) {
    ctx = ctx || {};
    var centerLabel = ctx.centerLabel || child.center || "No center / freelance";
    var specLabel   = ctx.specLabel   || child.specLabel || "No specialist";

    var card = document.createElement("article");
    card.className = "module-card child-card";

    card.innerHTML =
      '<header>' +
      '  <div>' +
      '    <strong>' + (child.name || "Unnamed child") + '</strong>' +
      '    <p class="hint">' + (child.notes || "No notes yet") + '</p>' +
      '  </div>' +
      '</header>' +
      '<div class="module-meta">' +
      '  <span>🏢 ' + centerLabel + '</span>' +
      '  <span>🧑‍⚕️ ' + specLabel + '</span>' +
      (child.age ? ('  <span>🎂 Age ' + child.age + '</span>') : '') +
      '</div>';

    return card;
  }

  function renderChildren() {
    if (!childrenListWrap) return;

    childrenListWrap.innerHTML = "";

    if (!childrenCache.length) {
      childrenListWrap.innerHTML =
        '<div class="empty-state">' +
        '  No children yet. Use “Save child” to create the first record in your "children" sheet.' +
        '</div>';
      updateChildrenStats();
      return;
    }

    var specByUser = {};
    specialistsCache.forEach(function (s) {
      if (!s.username) return;
      specByUser[s.username] = s;
    });

    // 1) GROUP BY CENTER
    var byCenter = {};
    childrenCache.forEach(function (ch) {
      var spec = ch.spec ? specByUser[ch.spec] : null;

      var centerName = ch.center;
      if (!centerName && spec && spec.type === "center" && spec.center) {
        centerName = spec.center;
      }
      if (!centerName) centerName = "No center / freelance";

      if (!byCenter[centerName]) byCenter[centerName] = [];
      byCenter[centerName].push({ child: ch, spec: spec });
    });

    var centerNames = Object.keys(byCenter).sort(function (a, b) {
      if (a === "No center / freelance") return 1;
      if (b === "No center / freelance") return -1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });

    var titleCenter = document.createElement("h4");
    titleCenter.className = "hint";
    titleCenter.textContent = "By center";
    childrenListWrap.appendChild(titleCenter);

    centerNames.forEach(function (centerName) {
      var label = document.createElement("p");
      label.className = "hint";
      label.style.marginTop = "0.6rem";
      label.textContent = centerName;
      childrenListWrap.appendChild(label);

      var grid = document.createElement("div");
      grid.className = "modules-grid";

      byCenter[centerName].forEach(function (pair) {
        var spec = pair.spec;
        var specLabel = "No specialist";

        if (spec) {
          specLabel = (spec.name || spec.username || "Specialist");
          if (spec.type === "center" && spec.center) {
            specLabel += " — " + spec.center;
          } else {
            specLabel += " — Freelance";
          }
        }

        grid.appendChild(
          createChildCard(pair.child, {
            centerLabel: centerName,
            specLabel: specLabel
          })
        );
      });

      childrenListWrap.appendChild(grid);
    });

    // 2) GROUP BY SPECIALIST
    var bySpec = {};
    childrenCache.forEach(function (ch) {
      var spec = ch.spec ? specByUser[ch.spec] : null;
      var key;

      if (spec) {
        key = (spec.name || spec.username || "Specialist");
        if (spec.type === "center" && spec.center) {
          key += " — " + spec.center;
        } else {
          key += " — Freelance";
        }
      } else {
        key = "Unassigned specialist";
      }

      if (!bySpec[key]) bySpec[key] = [];
      bySpec[key].push({ child: ch, spec: spec });
    });

    var titleSpec = document.createElement("h4");
    titleSpec.className = "hint";
    titleSpec.style.marginTop = "1.2rem";
    titleSpec.textContent = "By specialist";
    childrenListWrap.appendChild(titleSpec);

    Object.keys(bySpec)
      .sort(function (a, b) {
        if (a === "Unassigned specialist") return 1;
        if (b === "Unassigned specialist") return -1;
        return a.localeCompare(b, undefined, { sensitivity: "base" });
      })
      .forEach(function (specLabel) {
        var label = document.createElement("p");
        label.className = "hint";
        label.style.marginTop = "0.6rem";
        label.textContent = specLabel;
        childrenListWrap.appendChild(label);

        var grid = document.createElement("div");
        grid.className = "modules-grid";

        bySpec[specLabel].forEach(function (pair) {
          var centerName =
            pair.child.center ||
            (pair.spec && pair.spec.center) ||
            "No center / freelance";

          grid.appendChild(
            createChildCard(pair.child, {
              centerLabel: centerName,
              specLabel: specLabel
            })
          );
        });

        childrenListWrap.appendChild(grid);
      });

    updateChildrenStats();
  }

  async function loadChildren() {
    if (!childrenListWrap) return;

    childrenListWrap.innerHTML =
      '<div class="empty-state">Loading children…</div>';

    var items;
    try {
      items = await apiGet({ action: "getchildren" });
    } catch (err) {
      console.error("Error loading children:", err);
      childrenListWrap.innerHTML =
        '<div class="empty-state">Error loading children. Please check the Apps Script endpoint.</div>';
      if (childrenTotalEl)         childrenTotalEl.textContent         = "0";
      if (childrenWithCenterEl)    childrenWithCenterEl.textContent    = "0";
      if (childrenWithoutCenterEl) childrenWithoutCenterEl.textContent = "0";
      return;
    }

    if (!Array.isArray(items)) items = [];

    childrenCache = items.map(function (r) {
      return {
        row: Number(r.row),
        name: r.name || "",
        age: r.age || "",
        notes: r.notes || "",
        center: r.center || "",
        spec: r.specialistUsername || ""
      };
    });

    renderChildren();
  }

  if (childForm) {
    childForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      var name  = (qi("child-name")  && qi("child-name").value  || "").trim();
      var age   = (qi("child-age")   && qi("child-age").value   || "").trim();
      var notes = (qi("child-notes") && qi("child-notes").value || "").trim();
      var center =
        childCenterSelect ? (childCenterSelect.value || "").trim() : "";
      var spec =
        childSpecSelect ? (childSpecSelect.value || "").trim() : "";

      if (!name) {
        alert("Child name is required.");
        return;
      }

      var res;
      try {
        res = await apiPost({
          action:     "addchild",
          childName:  name,
          childAge:   age,
          childNotes: notes,
          childCenter: center,
          childSpec:  spec
        });
      } catch (err) {
        console.error("Error adding child:", err);
        alert("Error adding child. Please check the Apps Script endpoint.");
        return;
      }

      if (res !== "ADDED") {
        alert("Error adding child. Please check the sheet/Apps Script.");
        return;
      }

      childForm.reset();
      await loadChildren();
      alert("Child added successfully.");
    });
  }

  // ---- Initial loads ----
  loadCenters();
  loadSpecialists();
  loadChildren();
}

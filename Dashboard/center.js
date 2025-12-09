authGuard("center");

const center = getCurrentUser();
const centerId = center.center_id;

// ================= NAVIGATION =================
document.querySelectorAll(".nav-link").forEach(btn => {
  btn.addEventListener("click", () => {
    const sec = btn.dataset.section;
    switchSection(sec);
    loadSection(sec);
  });
});

// ================= LOAD SECTIONS =================
function loadSection(section) {
  switch (section) {
    case "overview": loadOverview(); break;
    case "specialists": loadSpecialists(); break;
    case "children": loadChildren(); break;
    case "modules": loadModules(); break;
  }
}

// ================= OVERVIEW =================
async function loadOverview() {
  const stats = await apiRequest("getCenterStats", { center_id: centerId });
  if (!stats.success) return;

  setText("statSpecialists", stats.totals.specialists);
  setText("statChildren", stats.totals.children);
  setText("statModules", stats.totals.modules_assigned);
  setText("statSessions", stats.totals.sessions);

  // Simple chart placeholders
  document.getElementById("chartChildrenPerSpecialist").innerHTML =
    `<div class="trend">Chart coming soon</div>`;
  document.getElementById("chartModuleUsage").innerHTML =
    `<div class="trend">Chart coming soon</div>`;
}

// ================= SPECIALISTS =================
async function loadSpecialists() {
  const res = await apiRequest("listSpecialists", { center_id: centerId });

  const grid = document.getElementById("specialistsGrid");
  const empty = document.getElementById("specialistsEmpty");
  grid.innerHTML = "";

  const list = res.specialists || [];
  if (!list.length) return (empty.style.display = "block");

  empty.style.display = "none";

  list.forEach(s => {
    const card = document.createElement("div");
    card.className = "specialist-card";
    card.innerHTML = `
      <div class="avatar" style="background-image:url('https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=60')"></div>
      <strong>${s.name}</strong>
      <p>${s.description || "No description"}</p>
      <div class="specialist-credentials">
        <span class="chip subtle">User: ${s.username}</span>
        <span class="chip subtle">Children: ${s.num_children}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ================= CHILDREN =================
async function loadChildren() {
  const res = await apiRequest("listChildren", { center_id: centerId });

  const grid = document.getElementById("childrenGrid");
  const empty = document.getElementById("childrenEmpty");
  grid.innerHTML = "";

  const list = res.children || [];
  if (!list.length) return (empty.style.display = "block");

  empty.style.display = "none";

  list.forEach(ch => {
    const card = document.createElement("article");
    card.className = "module-card";
    card.innerHTML = `
      <header>
        <strong>${ch.name}</strong>
        <span class="chip subtle">${ch.age || "N/A"} yrs</span>
      </header>
      <div class="module-meta">
        <span>Spec: ${ch.specialist_id || "—"}</span>
        <span>Sessions: ${ch.num_sessions}</span>
      </div>
      <button class="ghost small">View Profile</button>
    `;
    grid.appendChild(card);
  });
}

// ================= MODULES =================
async function loadModules() {
  const res = await apiRequest("listCenterModules", { center_id: centerId });

  const grid = document.getElementById("modulesGrid");
  const empty = document.getElementById("modulesEmpty");
  grid.innerHTML = "";

  const list = res.modules || [];
  if (!list.length) return (empty.style.display = "block");

  empty.style.display = "none";

  list.forEach(m => {
    const card = document.createElement("article");
    card.className = "module-card";

    card.innerHTML = `
      <header>
        <strong>${m.name}</strong>
        <span class="chip subtle">${m.minutes_to_play} min</span>
      </header>
      <div class="hint">${m.description || "No description"}</div>
    `;

    grid.appendChild(card);
  });
}

// ================= INIT =================
document.getElementById("logoutBtn").addEventListener("click", logout);

document.getElementById("refreshAllBtn").addEventListener("click", () => {
  const active = document.querySelector(".section.active")?.id.replace("section-", "");
  loadSection(active || "overview");
});

// Initial load
loadOverview();

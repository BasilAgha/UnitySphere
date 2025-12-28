(function () {
  const NAV_ITEMS = {
    admin: [
      { id: "dashboard", label: "Dashboard", icon: "D" },
      { id: "centers", label: "Centers", icon: "C" },
      { id: "locations", label: "Locations", icon: "L" },
      { id: "specialists", label: "Specialists", icon: "S" },
      { id: "vr-modules", label: "VR Modules", icon: "V" },
      { id: "assessment", label: "Assessment", icon: "A" },
      { id: "settings", label: "Settings", icon: "G" }
    ],
    center: [
      { id: "overview", label: "Overview", icon: "O", section: "overview" },
      { id: "specialists", label: "Specialists", icon: "S", section: "specialists" },
      { id: "children", label: "Children", icon: "C", section: "children" },
      { id: "modules", label: "VR Modules", icon: "V", section: "modules" }
    ],
    specialist: [
      { id: "overview", label: "Overview", icon: "O", section: "overview" },
      { id: "children", label: "Children", icon: "C", section: "children" },
      { id: "assessments", label: "Assessments", icon: "A", section: "assessments" }
    ]
  };

  function buildSidebar({ role, active } = {}) {
    const resolvedRole = role || "admin";
    const items = NAV_ITEMS[resolvedRole] || NAV_ITEMS.admin;
    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";

    const brand = document.createElement("div");
    brand.className = "sidebar-brand";
    brand.innerHTML =
      "<img class=\"brand-logo\" src=\"Logo 02.png\" alt=\"UnitySphere logo\" />" +
      "<div class=\"brand-text\">" +
      "<div id=\"brandName\">UnitySphere</div>" +
      "<div id=\"brandRole\" class=\"hint\">Workspace</div>" +
      "</div>";

    const nav = document.createElement("nav");
    nav.className = "sidebar-nav";
    items.forEach(item => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sidebar-link" + (item.id === active ? " active" : "");
      btn.dataset.nav = item.id;
      if (item.section) {
        btn.dataset.section = item.section;
      }
      btn.innerHTML =
        "<span class=\"nav-icon\">" + item.icon + "</span>" +
        "<span class=\"nav-label\">" + item.label + "</span>";
      nav.appendChild(btn);
    });

    const user = document.createElement("div");
    user.className = "sidebar-user";
    const nameId = resolvedRole === "admin" ? "currentUserName" : "sidebarUserName";
    const roleId = resolvedRole === "admin" ? "currentUserRole" : "sidebarUserRole";
    user.innerHTML =
      "<div class=\"avatar\" data-initials=\"US\"></div>" +
      "<div class=\"user-meta\">" +
      "<div id=\"" + nameId + "\">User</div>" +
      "<div id=\"" + roleId + "\" class=\"hint\">Role</div>" +
      "</div>";

    sidebar.appendChild(brand);
    sidebar.appendChild(nav);
    sidebar.appendChild(user);

    sidebar.addEventListener("click", event => {
      const btn = event.target.closest(".sidebar-link");
      if (!btn) return;
      if (btn.dataset.section) {
        const tab = document.querySelector(
          ".section-tabs [data-section=\"" + btn.dataset.section + "\"]"
        );
        if (tab) tab.click();
      }
    });

    return sidebar;
  }

  function buildHeader({ title } = {}) {
    const header = document.createElement("header");
    header.className = "shell-header";

    const left = document.createElement("div");
    left.className = "header-left";
    left.innerHTML =
      "<button class=\"menu-toggle\" aria-label=\"Toggle navigation\" type=\"button\">|||</button>" +
      "<div class=\"title\">" + (title || "") + "</div>";

    const actions = document.createElement("div");
    actions.className = "header-actions";

    const search = document.createElement("input");
    search.type = "search";
    search.className = "shell-search";
    search.placeholder = "Search";
    search.setAttribute("aria-label", "Search");
    search.addEventListener("input", () => {
      const event = new CustomEvent("unitysphere:search", {
        detail: { query: search.value }
      });
      document.dispatchEvent(event);
    });

    actions.appendChild(search);
    header.appendChild(left);
    header.appendChild(actions);

    return header;
  }

  function setActiveNavItem(sidebar, sectionName) {
    if (!sidebar) return;
    sidebar.querySelectorAll("[data-nav]").forEach(link => {
      link.classList.toggle("active", link.dataset.nav === sectionName);
    });
  }

  function applyTheme(theme) {
    const value = "dark";
    document.body.dataset.theme = value;
    try {
      localStorage.setItem("unitysphere:theme", value);
    } catch {
      // ignore storage failures
    }
  }

  function wireEscManager() {
    if (document.body.dataset.shellWired === "true") return;
    document.body.dataset.shellWired = "true";

    let backdrop = document.querySelector(".sidebar-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "sidebar-backdrop";
      document.body.appendChild(backdrop);
    }

    document.body.addEventListener("click", event => {
      const toggle = event.target.closest(".menu-toggle");
      if (!toggle) return;
      document.body.classList.toggle("sidebar-open");
    });

    backdrop.addEventListener("click", () => {
      document.body.classList.remove("sidebar-open");
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        document.body.classList.remove("sidebar-open");
      }
    });
  }

  window.UnitySphereShell = {
    buildSidebar,
    buildHeader,
    setActiveNavItem,
    applyTheme,
    wireEscManager
  };
})();

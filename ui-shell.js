(function () {
  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", roles: ["admin"] },
    { id: "centers", label: "Centers", roles: ["admin", "center"] },
    { id: "locations", label: "Locations", roles: ["admin"] },
    { id: "specialists", label: "Specialists", roles: ["admin", "center", "specialist"] },
    { id: "vr-modules", label: "VR Modules", roles: ["admin", "center", "specialist"] },
    { id: "assessment", label: "Assessment", roles: ["admin", "specialist"] },
    { id: "settings", label: "Settings", roles: ["admin", "center", "specialist"] },
  ];

  function applyTheme(value) {
    const theme = value === "dark" ? "dark" : "light";
    document.body.dataset.theme = theme;
    localStorage.setItem("unitysphere:theme", theme);
    return theme;
  }

  function updateThemeToggle(button, theme) {
    if (!button) return;
    button.innerHTML = theme === "light" ? "🌙" : "☀️";
    button.setAttribute(
      "aria-label",
      theme === "light" ? "Switch to dark theme" : "Switch to light theme"
    );
  }

  function bindThemeToggle(root) {
    const btn = root.querySelector("[data-theme-toggle]");
    if (!btn) return;
    const stored = localStorage.getItem("unitysphere:theme") || "light";
    const current = applyTheme(stored);
    updateThemeToggle(btn, current);
    btn.addEventListener("click", () => {
      const next = document.body.dataset.theme === "light" ? "dark" : "light";
      const applied = applyTheme(next);
      updateThemeToggle(btn, applied);
    });
  }

  function buildSidebar({ role, active }) {
    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";

    const logo = document.createElement("div");
    logo.className = "logo";
    logo.innerHTML = '<span class="logo-mark"></span><span>UnitySphere</span>';
    sidebar.appendChild(logo);

    const list = document.createElement("ul");
    list.className = "nav-list";

    NAV_ITEMS.forEach((item) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.className = "nav-item";
      link.dataset.nav = item.id;
      link.textContent = item.label;

      if (active === item.id) {
        link.classList.add("active");
      }

      if (role && item.roles && !item.roles.includes(role)) {
        link.classList.add("disabled");
        link.setAttribute("aria-disabled", "true");
        link.tabIndex = -1;
      }

      li.appendChild(link);
      list.appendChild(li);
    });

    sidebar.appendChild(list);
    return sidebar;
  }

  function buildHeader({ title }) {
    const header = document.createElement("header");
    header.className = "shell-header";

    const inner = document.createElement("div");
    inner.className = "shell-header-inner";

    const titleEl = document.createElement("div");
    titleEl.className = "title";
    titleEl.textContent = title || "";
    if (!title) {
      titleEl.style.display = "none";
      header.classList.add("no-title");
    }

    const actions = document.createElement("div");
    actions.className = "header-actions";

    const theme = document.createElement("button");
    theme.className = "icon-button";
    theme.type = "button";
    theme.innerHTML = "🌙";
    theme.setAttribute("aria-label", "Switch to dark theme");
    theme.dataset.themeToggle = "true";

    const language = document.createElement("button");
    language.className = "icon-button";
    language.type = "button";
    language.innerHTML = "🌐";
    language.setAttribute("aria-label", "Language");

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "US";

    actions.append(theme, language, avatar);
    inner.append(titleEl, actions);
    header.append(inner);
    bindThemeToggle(header);
    return header;
  }

  function setActiveNavItem(root, active) {
    const items = root.querySelectorAll("[data-nav]");
    items.forEach((item) => item.classList.toggle("active", item.dataset.nav === active));
  }

  function wireEscManager() {
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;

      document.querySelectorAll(".modal.open, .modal[open]").forEach((modal) => {
        if (typeof modal.close === "function") {
          modal.close();
        } else {
          modal.classList.remove("open");
        }
      });

      document.querySelectorAll(".flip-card.flipped").forEach((card) => {
        card.classList.remove("flipped");
      });
    });
  }

  window.UnitySphereShell = {
    buildSidebar,
    buildHeader,
    setActiveNavItem,
    wireEscManager,
    applyTheme,
    bindThemeToggle,
  };
})();

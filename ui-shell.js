(function () {
  const ROLE_NAV = {
    admin: [
      { id: "dashboard", label: "Dashboard" },
      { id: "centers", label: "Centers" },
      { id: "specialists", label: "Specialists" },
      { id: "children", label: "Children" },
      { id: "vr-modules", label: "VR Modules" },
      { id: "assessment", label: "Assessment" },
      { id: "reports", label: "Reports" },
      { id: "settings", label: "Settings" },
    ],
    center: [
      { id: "dashboard", label: "Dashboard" },
      { id: "specialists", label: "Specialists" },
      { id: "children", label: "Children" },
      { id: "vr-modules", label: "VR Modules" },
      { id: "assessment", label: "Assessment" },
      { id: "settings", label: "Settings" },
    ],
    specialist: [
      { id: "overview", label: "Overview" },
      { id: "children", label: "Children" },
      { id: "assessments", label: "Assessments" },
      { id: "settings", label: "Settings" },
    ],
  };

  function getRoleNav(role) {
    if (role && ROLE_NAV[role]) {
      return ROLE_NAV[role].map((item) => ({ ...item }));
    }
    return [];
  }

  function getAllowedSectionIds(role) {
    return new Set(getRoleNav(role).map((item) => item.id));
  }

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

    const items = getRoleNav(role);
    items.forEach((item) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.className = "nav-item";
      link.dataset.nav = item.id;
      link.textContent = item.label;

      if (active === item.id) {
        link.classList.add("active");
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

  function applyRoleVisibility({ role, root } = {}) {
    if (!role) return;
    const scope = root || document;
    const allowed = getAllowedSectionIds(role);

    scope.querySelectorAll(".section").forEach((section) => {
      const rawId = section.id || "";
      const sectionId = rawId.startsWith("section-") ? rawId.slice(8) : rawId;
      if (!allowed.has(sectionId)) {
        section.hidden = true;
        section.setAttribute("aria-hidden", "true");
        section.classList.remove("active");
      } else {
        section.hidden = false;
        section.removeAttribute("aria-hidden");
      }
    });

    scope.querySelectorAll("[data-section]").forEach((link) => {
      const sectionId = link.dataset.section;
      if (!sectionId) return;
      if (!allowed.has(sectionId)) {
        link.hidden = true;
        link.setAttribute("aria-hidden", "true");
        link.classList.add("disabled");
        link.disabled = true;
      } else {
        link.hidden = false;
        link.removeAttribute("aria-hidden");
        link.classList.remove("disabled");
        link.disabled = false;
      }
    });
  }

  function normalizeStatusValue(value, fallback = "active") {
    return String(value || fallback).trim().toLowerCase();
  }

  function StatusBadge(status) {
    const normalized = normalizeStatusValue(status);
    const label = normalized
      ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
      : "Active";
    return `<span class="pill small status-badge is-${normalized}">${label}</span>`;
  }

  function EmptyState(component, message) {
    const label = String(component || "items").trim();
    const title = label ? `No ${label}` : "No data available";
    const body = message ? `<div>${message}</div>` : "";
    return `
      <div class="empty-state">
        <div class="empty-title">${title}</div>
        ${body}
        <div class="empty-actions"></div>
      </div>
    `;
  }

  function MaskPasswordDisplay(value) {
    if (!value) return "********";
    return "********";
  }

  function ensureConfirmModal() {
    let modal = document.getElementById("confirmModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.id = "confirmModal";
    modal.innerHTML = `
      <div class="modal confirm-modal">
        <div class="modal-header">
          <div>
            <h2 id="confirmTitle">Confirm action</h2>
            <p class="modal-subtitle" id="confirmMessage">Are you sure?</p>
          </div>
          <button class="icon-button" data-close-modal="confirmModal">x</button>
        </div>
        <div class="modal-actions confirm-actions">
          <button class="ghost" id="confirmCancel">Cancel</button>
          <button class="primary danger" id="confirmOk">Yes, proceed</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  function openConfirmModal(modal) {
    if (typeof window.openModal === "function") {
      window.openModal("confirmModal");
      return;
    }
    modal.classList.add("active");
  }

  function closeConfirmModal(modal) {
    if (typeof window.closeModal === "function") {
      window.closeModal("confirmModal");
      return;
    }
    modal.classList.remove("active");
  }

  function ConfirmDangerAction(message, options = {}) {
    const modal = ensureConfirmModal();
    const msgEl = modal.querySelector("#confirmMessage");
    const titleEl = modal.querySelector("#confirmTitle");
    const okBtn = modal.querySelector("#confirmOk");
    const cancelBtn = modal.querySelector("#confirmCancel");
    const closeBtn = modal.querySelector("[data-close-modal]");

    if (msgEl) msgEl.textContent = message || "Are you sure?";
    if (titleEl) titleEl.textContent = options.title || "Confirm action";
    if (okBtn) okBtn.textContent = options.confirmText || "Yes, proceed";
    if (cancelBtn) cancelBtn.textContent = options.cancelText || "Cancel";

    openConfirmModal(modal);

    return new Promise((resolve) => {
      let settled = false;

      const cleanup = () => {
        if (settled) return;
        settled = true;
        if (okBtn) okBtn.removeEventListener("click", onOk);
        if (cancelBtn) cancelBtn.removeEventListener("click", onCancel);
        if (closeBtn) closeBtn.removeEventListener("click", onCancel);
        modal.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKeydown);
        closeConfirmModal(modal);
      };

      const onOk = () => {
        cleanup();
        resolve(true);
      };
      const onCancel = () => {
        cleanup();
        resolve(false);
      };
      const onBackdrop = (event) => {
        if (event.target === modal) onCancel();
      };
      const onKeydown = (event) => {
        if (event.key === "Escape") onCancel();
      };

      if (okBtn) okBtn.addEventListener("click", onOk);
      if (cancelBtn) cancelBtn.addEventListener("click", onCancel);
      if (closeBtn) closeBtn.addEventListener("click", onCancel);
      modal.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKeydown);
    });
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
    getRoleNav,
    getAllowedSectionIds,
    applyRoleVisibility,
  };

  window.StatusBadge = StatusBadge;
  window.EmptyState = EmptyState;
  window.MaskPasswordDisplay = MaskPasswordDisplay;
  window.ConfirmDangerAction = ConfirmDangerAction;
  window.UnitySphereUI = {
    StatusBadge,
    EmptyState,
    MaskPasswordDisplay,
    ConfirmDangerAction,
  };
})();

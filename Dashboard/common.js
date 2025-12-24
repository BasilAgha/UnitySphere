/*****************************************************
 *  GLOBAL CONFIG
 *****************************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbyOXs-qQvV-H4hJGIkPsJbvTjiKHpS1DeDUI_24LrmGipIftzmz8u2CyhnvDbvzhg0/exec"; // <-- Replace with your deployed Apps Script URL


/*****************************************************
 *  GENERIC API HELPER
 *****************************************************/
async function apiRequest(action, params = {}) {
  const fd = new FormData();
  fd.append("action", action);

  // Attach params
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      fd.append(key, val);
    }
  });

  try {
    const res = await fetch(API_URL, { method: "POST", body: fd });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("API Error:", action, err);
    return { success: false, error: "Network error" };
  }
}


/*****************************************************
 *  LOGIN LOGIC
 *****************************************************/
async function login() {
  const username = document.getElementById("username")?.value?.trim();
  const password = document.getElementById("password")?.value?.trim();
  const errorBox = document.getElementById("error");
  const loginBtn = document.getElementById("loginBtn");

  if (loginBtn?.disabled) return;

  if (!username || !password) {
    if (errorBox) errorBox.textContent = "Please enter a username and password.";
    return;
  }

  if (errorBox) errorBox.textContent = "";
  setButtonLoading(loginBtn, true, "Signing in...");

  const data = await apiRequest("login", { username, password });

  if (!data.success) {
    const rawError = String(data.error || "").toLowerCase();
    if (rawError.includes("network")) {
      if (errorBox) errorBox.textContent = "Network error. Check your connection and try again.";
    } else if (rawError.includes("invalid") || rawError.includes("credential")) {
      if (errorBox) errorBox.textContent = "Invalid username or password.";
    } else {
      if (errorBox) errorBox.textContent = "Server error. Please try again shortly.";
    }
    setButtonLoading(loginBtn, false);
    return;
  }

  // Save session
  localStorage.setItem("role", data.role);
  localStorage.setItem("user", JSON.stringify(data.user));

  // Route based on role
  switch (data.role) {
    case "admin":
      window.location.href = "admin.html";
      break;

    case "center":
      window.location.href = "center.html";
      break;

    case "specialist":
      window.location.href = "specialist.html";
      break;
  }
}


/*****************************************************
 *  AUTH GUARD
 *  Call this at the top of every dashboard page.
 *****************************************************/
function authGuard(requiredRole) {
  const role = localStorage.getItem("role");

  if (!role) {
    window.location.href = "login.html";
    return;
  }

  if (requiredRole && role !== requiredRole) {
    // User trying to access a forbidden page
    window.location.href = "login.html";
  }
}


/*****************************************************
 *  GET CURRENT USER HELPERS
 *****************************************************/
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
}

function getCurrentUsername() {
  return getCurrentUser().username || "Unknown User";
}

function getCurrentUserId() {
  return getCurrentUser().id || null;
}


/*****************************************************
 *  LOGOUT
 *****************************************************/
function logout() {
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}


/*****************************************************
 *  UI HELPERS
 *****************************************************/

// Quick text assignment
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// Open modal (supports your dashboard.css)
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("closing");
  modal.classList.add("active");
}

// Close modal
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  if (!modal.classList.contains("active")) return;
  modal.classList.add("closing");
  setTimeout(() => {
    modal.classList.remove("active", "closing");
  }, 180);
}

// Attach close modal buttons automatically
function initModalClose() {
  document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-close-modal");
      closeModal(id);
    });
  });

  // Close modal when clicking outside the box
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", e => {
      if (e.target.classList.contains("modal-backdrop")) {
        closeModal(e.target.id);
      }
    });
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-backdrop.active").forEach(backdrop => closeModal(backdrop.id));
    }
  });
}


/*****************************************************
 *  SECTION NAVIGATION (Dashboard Tabs)
 *****************************************************/
function switchSection(sectionName) {
  document.querySelectorAll(".section").forEach(sec => {
    sec.classList.remove("active");
  });

  const target = document.getElementById(`section-${sectionName}`);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.section === sectionName);
  });
}

/*****************************************************
 *  LOADING + TOASTS
 *****************************************************/
function setButtonLoading(btn, isLoading, loadingLabel = "Loading...") {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingLabel;
    btn.classList.add("btn-loading");
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.classList.remove("btn-loading");
    btn.disabled = false;
  }
}

function getToastStack() {
  let stack = document.getElementById("toastStack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toastStack";
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type = "success", title = "Status") {
  const stack = getToastStack();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-title">${title}</div><div>${message}</div>`;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/*****************************************************
 *  COMPACT MODE
 *****************************************************/
const COMPACT_STORAGE_KEY = "dashboard:compact";

function applyCompactMode(isCompact) {
  const enable = Boolean(isCompact);
  document.body.classList.toggle("compact", enable);
  localStorage.setItem(COMPACT_STORAGE_KEY, enable ? "1" : "0");

  document.querySelectorAll("[data-compact-toggle]").forEach(btn => {
    btn.setAttribute("aria-pressed", enable ? "true" : "false");
    btn.classList.toggle("active", enable);
    const status = btn.querySelector("[data-compact-status]");
    if (status) status.textContent = enable ? "On" : "Off";
  });
}

function applyAvatarFallback(avatarEl, name = "", photo = "") {
  if (!avatarEl) return;
  const initials = getInitials(name);
  if (photo) {
    avatarEl.style.backgroundImage = `url('${photo}')`;
    avatarEl.classList.add("has-photo");
    avatarEl.removeAttribute("data-initials");
    return;
  }
  avatarEl.style.backgroundImage = "";
  avatarEl.classList.remove("has-photo");
  avatarEl.setAttribute("data-initials", initials);
}

function applyAvatarFallbackToSelector(selector, name, photo) {
  document.querySelectorAll(selector).forEach(el => applyAvatarFallback(el, name, photo));
}

function getInitials(name = "") {
  if (!name) return "NA";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function initCompactMode() {
  const saved = localStorage.getItem(COMPACT_STORAGE_KEY) === "1";
  applyCompactMode(saved);

  document.querySelectorAll("[data-compact-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const next = !document.body.classList.contains("compact");
      applyCompactMode(next);
    });
  });
}


/*****************************************************
 *  EXPORT functions for reuse
 *****************************************************/
window.apiRequest = apiRequest;
window.login = login;
window.logout = logout;
window.authGuard = authGuard;
window.getCurrentUser = getCurrentUser;
window.getCurrentUsername = getCurrentUsername;
window.getCurrentUserId = getCurrentUserId;
window.openModal = openModal;
window.closeModal = closeModal;
window.initModalClose = initModalClose;
window.switchSection = switchSection;
window.setText = setText;
window.applyCompactMode = applyCompactMode;
window.initCompactMode = initCompactMode;
window.setButtonLoading = setButtonLoading;
window.showToast = showToast;
window.applyAvatarFallback = applyAvatarFallback;
window.applyAvatarFallbackToSelector = applyAvatarFallbackToSelector;
window.getInitials = getInitials;

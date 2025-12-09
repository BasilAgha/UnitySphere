/*****************************************************
 *  GLOBAL CONFIG
 *****************************************************/
const API_URL = "https://script.google.com/macros/s/AKfycbxErCCEs6YOSy18SufoYe4ZSYSbh6yOvvu7pAvpygqtTUE2m1LPZ_z9xH1TjK3abDlS/exec"; // <-- Replace with your deployed Apps Script URL


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

  if (!username || !password) {
    if (errorBox) errorBox.textContent = "Please enter username & password.";
    return;
  }

  const data = await apiRequest("login", { username, password });

  if (!data.success) {
    if (errorBox) errorBox.textContent = data.error || "Invalid login.";
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
  if (modal) modal.classList.add("active");
}

// Close modal
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("active");
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
        e.target.classList.remove("active");
      }
    });
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

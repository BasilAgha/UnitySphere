// ==========================================
//  UNIVERSAL LOGIN HANDLER (Admin / Center / Specialist)
// ==========================================

const userI = qi("auth-username");
const passI = qi("auth-password");
const form  = qi("auth-form");

// 1) ADMIN LOGIN
async function tryAdminLogin(username, password) {
  const res = await apiPost({
    action: "login",
    username,
    password
  });

  if (res === "ADMIN_OK") {
    sessionStorage.setItem("us_role", "admin");
    sessionStorage.setItem("us_username", username);
    location.href = "dashboard.html";
    return true;
  }

  return false;
}

// 2) CENTER LOGIN
async function tryCenterLogin(username, password) {
  const res = await apiPost({
    action: "centerlogin",
    username,
    password
  });

  if (res === "FAIL") return false;

  const data = JSON.parse(res);

  if (data.status !== "CENTER_OK") return false;

  sessionStorage.setItem("us_role", "center");
  sessionStorage.setItem("center_name",     data.center.name);
  sessionStorage.setItem("center_desc",     data.center.desc);
  sessionStorage.setItem("center_location", data.center.location);
  sessionStorage.setItem("center_username", data.center.username);

  location.href = "center-dashboard.html";
  return true;
}

// 3) SPECIALIST LOGIN
async function trySpecialistLogin(username, password) {
  const res = await apiPost({
    action: "specialistlogin",
    username,
    password
  });

  if (res === "FAIL") return false;

  const data = JSON.parse(res);

  if (data.status !== "SPECIALIST_OK") return false;

  sessionStorage.setItem("us_role",      "specialist");
  sessionStorage.setItem("spec_username", data.username);
  sessionStorage.setItem("spec_name",     data.name);
  sessionStorage.setItem("spec_focus",    data.focus);
  sessionStorage.setItem("spec_type",     data.type);
  sessionStorage.setItem("spec_center",   data.center);

  location.href = "specialist-dashboard.html";
  return true;
}

// ==========================================
//  MAIN LOGIN HANDLER
// ==========================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const u = userI.value.trim();
  const p = passI.value.trim();

  if (!u || !p) {
    alert("Enter username and password");
    return;
  }

  // PRIORITY ORDER:
  if (await tryAdminLogin(u, p)) return;
  if (await tryCenterLogin(u, p)) return;
  if (await trySpecialistLogin(u, p)) return;

  alert("Incorrect username or password.");
});

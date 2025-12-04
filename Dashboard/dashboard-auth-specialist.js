// Specialist login branch
async function trySpecialistLogin(username, password) {
  const body = new URLSearchParams();
  body.append("action", "specialistlogin");
  body.append("username", username);
  body.append("password", password);

  const res = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", body });
  const text = await res.text();

  if (text === "FAIL") return false;

  let data;
  try { data = JSON.parse(text); }
  catch { return false; }

  if (data.status !== "SPECIALIST_OK") return false;

  sessionStorage.setItem("us_role", "specialist");
  sessionStorage.setItem("spec_username", data.username);
  sessionStorage.setItem("spec_name", data.name);
  sessionStorage.setItem("spec_focus", data.focus);
  sessionStorage.setItem("spec_center", data.center);
  sessionStorage.setItem("spec_type", data.type);

  location.href = "specialist-dashboard.html";
  return true;
}

// Patch into your main login logic:
async function handleLoginClick() {
  const u = qi("login-username").value.trim();
  const p = qi("login-password").value.trim();

  // 1) Try admin
  if (await tryAdminLogin(u, p)) return;

  // 2) Try center admin
  if (await tryCenterLogin(u, p)) return;

  // 3) Try specialist
  if (await trySpecialistLogin(u, p)) return;

  alert("Incorrect username or password.");
}

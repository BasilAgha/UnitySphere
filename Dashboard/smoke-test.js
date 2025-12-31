const resultsHost = document.getElementById("smokeResults");

function logResult(label, ok, details) {
  const item = document.createElement("div");
  item.className = "panel";
  item.innerHTML = `
    <div><strong>${ok ? "PASS" : "FAIL"}</strong> ${label}</div>
    <div class="hint">${details || ""}</div>
  `;
  resultsHost.appendChild(item);
}

async function post(action, params = {}) {
  const fd = new FormData();
  fd.append("action", action);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) fd.append(key, val);
  });
  const res = await fetch(API_URL, { method: "POST", body: fd });
  return res.json();
}

async function login(username, password) {
  return post("login", { username, password });
}

async function runAdminChecks(admin) {
  const report = await post("reportsDashboard", {
    actor_role: "admin",
    actor_username: admin.user.username
  });
  logResult("Admin reportsDashboard", report.success, report.success ? "" : report.error);

  const centers = await post("listCenters", {
    actor_role: "admin",
    actor_username: admin.user.username
  });
  logResult("Admin listCenters", centers.success, centers.success ? `${centers.centers.length} centers` : centers.error);
}

async function runCenterChecks(center) {
  const children = await post("listChildren", {
    center_id: center.user.center_id,
    actor_role: "center",
    actor_username: center.user.username,
    actor_center_id: center.user.center_id
  });
  const scoped = (children.children || []).every(ch => String(ch.center_id) === String(center.user.center_id));
  logResult("Center listChildren scoped", children.success && scoped, children.success ? "" : children.error);

  const modules = await post("listCenterModules", {
    center_id: center.user.center_id,
    actor_role: "center",
    actor_username: center.user.username,
    actor_center_id: center.user.center_id
  });
  logResult("Center listCenterModules", modules.success, modules.success ? "" : modules.error);
}

async function runSpecialistChecks(spec) {
  const children = await post("listChildren", {
    specialist_id: spec.user.specialist_id,
    actor_role: "specialist",
    actor_username: spec.user.username,
    actor_specialist_id: spec.user.specialist_id,
    actor_center_id: spec.user.center_id
  });
  const scoped = (children.children || []).every(ch => String(ch.specialist_id) === String(spec.user.specialist_id));
  logResult("Specialist listChildren scoped", children.success && scoped, children.success ? "" : children.error);

  const questions = await post("listQuestions", {
    actor_role: "specialist",
    actor_username: spec.user.username,
    actor_specialist_id: spec.user.specialist_id
  });
  logResult("Specialist listQuestions", questions.success, questions.success ? "" : questions.error);
}

document.getElementById("runSmokeTest")?.addEventListener("click", async () => {
  resultsHost.innerHTML = "";

  const adminUser = document.getElementById("adminUser").value.trim();
  const adminPass = document.getElementById("adminPass").value.trim();
  const centerUser = document.getElementById("centerUser").value.trim();
  const centerPass = document.getElementById("centerPass").value.trim();
  const specUser = document.getElementById("specUser").value.trim();
  const specPass = document.getElementById("specPass").value.trim();

  if (!adminUser || !adminPass || !centerUser || !centerPass || !specUser || !specPass) {
    logResult("Credentials", false, "Fill in all credentials before running.");
    return;
  }

  const admin = await login(adminUser, adminPass);
  logResult("Admin login", admin.success, admin.success ? "" : admin.error);
  if (admin.success) await runAdminChecks(admin);

  const center = await login(centerUser, centerPass);
  logResult("Center login", center.success, center.success ? "" : center.error);
  if (center.success) await runCenterChecks(center);

  const specialist = await login(specUser, specPass);
  logResult("Specialist login", specialist.success, specialist.success ? "" : specialist.error);
  if (specialist.success) await runSpecialistChecks(specialist);
});

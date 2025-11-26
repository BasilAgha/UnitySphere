async function loadRemoteBeforeLogin() {
  const remote = await remoteLoad();
  if (!remote) return;

  db = remote;
  saveData(db);
  syncUsersWithEntities();
}

function isLoginPage() {
  return location.pathname.includes("login");
}

if (isLoginPage()) {
  const form = qi("auth-form");
  const userI = qi("auth-username");
  const passI = qi("auth-password");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    await loadRemoteBeforeLogin();

    const u = userI.value.trim().toLowerCase();
    const p = passI.value.trim();

    const user = (db.users || []).find(
      (x) => x.username.toLowerCase() === u && x.password === p
    );

    if (!user) {
      alert("Invalid username or password");
      return;
    }

    sessionStorage.setItem("us_role", user.role);
    sessionStorage.setItem("us_user", user.username);

    if (user.role === "center-admin")
      sessionStorage.setItem("us_center", user.centerId);

    if (user.role === "specialist")
      sessionStorage.setItem("us_specialist", user.specialistId);

    location.href = "dashboard.html";
  });
}

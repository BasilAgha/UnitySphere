function isLoginPage() {
  return location.pathname.toLowerCase().includes("login");
}

if (isLoginPage()) {
  const form = qi("auth-form");
  const userI = qi("auth-username");
  const passI = qi("auth-password");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const u = userI.value.trim();
    const p = passI.value.trim();

    if (!u || !p) {
      alert("Enter username and password");
      return;
    }

    // 1️⃣ Try Admin Login
    const adminRes = await apiPost({
      action: "login",
      username: u,
      password: p
    });

    if (adminRes === "ADMIN_OK") {
      sessionStorage.setItem("us_role", "admin");
      sessionStorage.setItem("us_username", u);
      location.href = "dashboard.html";
      return;
    }

    // 2️⃣ Try Center Login
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: new URLSearchParams({
        action: "centerlogin",
        username: u,
        password: p
      })
    });

    const text = await res.text();
    if (text === "FAIL") {
      alert("Invalid username or password");
      return;
    }

    const data = JSON.parse(text);

    sessionStorage.setItem("us_role", "center");
    sessionStorage.setItem("center_name", data.center.name);
    sessionStorage.setItem("center_desc", data.center.desc);
    sessionStorage.setItem("center_location", data.center.location);
    sessionStorage.setItem("center_username", data.center.username);

    location.href = "center-dashboard.html";
  });
}

// ================= AUTH =================
if (isLoginPage()) {
  const form = qi('auth-form');
  const userI = qi('auth-username');
  const passI = qi('auth-password');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = (userI.value || '').trim().toLowerCase();
    const p = passI.value || '';
    const user = (db.users || []).find(x => x.username && x.username.toLowerCase() === u && x.password === p);
    if (!user) {
      alert('Invalid credentials');
      return;
    }
    if (!['main-admin', 'center-admin', 'specialist'].includes(user.role)) {
      alert('Access restricted to platform accounts.');
      return;
    }

    sessionStorage.setItem('us_username', user.username);
    sessionStorage.setItem('us_name', user.name || user.username);
    sessionStorage.setItem('us_email', user.email || '');
    sessionStorage.setItem('us_role', user.role);

    if (user.avatar) {
      sessionStorage.setItem('us_avatar', user.avatar);
    } else {
      sessionStorage.removeItem('us_avatar');
    }

    if (user.role === 'center-admin' && user.centerId) {
      sessionStorage.setItem('us_center', user.centerId);
    } else {
      sessionStorage.removeItem('us_center');
    }

    if (user.role === 'specialist' && user.specialistId) {
      sessionStorage.setItem('us_specialist', user.specialistId);
    } else {
      sessionStorage.removeItem('us_specialist');
    }

    location.href = 'dashboard.html';
  });
}
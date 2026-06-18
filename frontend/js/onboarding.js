document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('argen_token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  try {
    const user = await argenApi.getMe();
    if (user.profileComplete) {
      window.location.href = user.role === 'teamadmin' ? '/connect' : '/dashboard';
      return;
    }
    document.getElementById('email').value = user.email || '';
    document.getElementById('name').value = user.name && user.name !== user.email?.split('@')[0] ? user.name : '';

    const params = new URLSearchParams(window.location.search);
    const pendingCode = params.get('code') || sessionStorage.getItem('pending_team_code') || localStorage.getItem('pending_team_code');
    if (pendingCode) {
      document.getElementById('inviteCode').value = pendingCode.toUpperCase();
    }
  } catch {
    window.location.href = '/login';
  }

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const msg = document.getElementById('formMsg');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      const data = await argenApi.completeProfile({
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        jobRole: document.getElementById('jobRole').value.trim(),
        department: document.getElementById('department').value.trim(),
        departmentId: document.getElementById('departmentId').value.trim(),
        employeeId: document.getElementById('employeeId').value.trim(),
        inviteCode: document.getElementById('inviteCode').value.trim(),
        employmentType: document.getElementById('employmentType').value,
        manager: document.getElementById('manager').value.trim(),
        workLocation: document.getElementById('workLocation').value.trim(),
        startDate: document.getElementById('startDate').value
      });

      localStorage.setItem('user', JSON.stringify(data.user));
      argenApi.setCookie('user', JSON.stringify(data.user), 7);
      if (data.user.companyId) {
        sessionStorage.setItem('team_verified', 'true');
        sessionStorage.removeItem('pending_team_code');
        localStorage.removeItem('pending_team_code');
      }
      msg.style.display = 'block';
      msg.style.color = '#00ff88';
      msg.textContent = 'Profile submitted! Redirecting...';
      setTimeout(() => { window.location.href = data.redirect || '/dashboard'; }, 1200);
    } catch (err) {
      msg.style.display = 'block';
      msg.style.color = '#ff4444';
      msg.textContent = err.message;
      btn.disabled = false;
      btn.textContent = 'Submit Profile →';
    }
  });
});

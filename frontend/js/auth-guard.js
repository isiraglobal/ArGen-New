(function() {
    const token = localStorage.getItem('argen_token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    // Define path groups
    const superadminPaths = ['/html/admin-portal.html', '/html/admin-dashboard.html'];
    const teamadminPaths = ['/html/dashboard.html', '/html/teams.html', '/html/team-detail.html'];
    const memberPaths = ['/html/dashboard.html', '/html/challenges.html'];
    
    const currentPath = window.location.pathname;

    // 1. Redirect to login if no token for any protected path
    const isProtected = [...superadminPaths, ...teamadminPaths, ...memberPaths].some(path => currentPath.includes(path));
    
    if (isProtected && !token) {
        console.warn('[AuthGuard] Unauthorized access. Redirecting to login.');
        window.location.href = '/html/login.html?redirect=' + encodeURIComponent(currentPath);
        return;
    }

    // 2. Role-based restrictions
    if (token && user) {
        const isSuperadminPath = superadminPaths.some(path => currentPath.includes(path));
        
        if (isSuperadminPath && user.role !== 'superadmin') {
            console.error('[AuthGuard] Superadmin access denied.');
            window.location.href = '/html/dashboard.html';
            return;
        }

        // If trying to access login while already logged in
        if (currentPath.includes('login.html')) {
            if (user.role === 'superadmin') {
                window.location.href = '/html/admin-portal.html';
            } else {
                window.location.href = '/html/dashboard.html';
            }
        }
    }
})();

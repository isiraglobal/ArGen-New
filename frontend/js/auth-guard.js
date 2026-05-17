(function() {
    const token = localStorage.getItem('argen_token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    // Define path groups (support both .html extension and clean routes)
    const superadminPaths = ['/html/admin-portal.html', '/admin-portal', '/html/admin-dashboard.html', '/admin-dashboard'];
    const teamadminPaths = ['/html/dashboard.html', '/dashboard', '/html/teams.html', '/teams', '/html/team-detail.html', '/team-detail'];
    const memberPaths = ['/html/dashboard.html', '/dashboard', '/html/challenges.html', '/challenges', '/take-evaluation'];
    
    const currentPath = window.location.pathname;

    // 1. Redirect to login if no token for any protected path
    const isProtected = [...superadminPaths, ...teamadminPaths, ...memberPaths].some(path => currentPath.includes(path));
    
    if (isProtected && !token) {
        console.warn('[AuthGuard] Unauthorized access. Redirecting to login.');
        const isSuperadminPath = superadminPaths.some(path => currentPath.includes(path));
        const loginPage = isSuperadminPath ? '/html/admin-access.html' : '/login';
        window.location.href = loginPage + '?redirect=' + encodeURIComponent(currentPath);
        return;
    }

    // 2. Role-based restrictions
    if (token && user) {
        const isSuperadminPath = superadminPaths.some(path => currentPath.includes(path));
        
        const role = user.role.toLowerCase();
        if (isSuperadminPath && role !== 'superadmin') {
            console.error('[AuthGuard] Superadmin access denied.');
            window.location.href = '/dashboard';
            return;
        }

        // If trying to access login while already logged in
        if (currentPath.includes('login')) {
            if (role === 'superadmin') {
                window.location.href = '/admin-portal';
            } else {
                window.location.href = '/dashboard';
            }
        }
    }
})();

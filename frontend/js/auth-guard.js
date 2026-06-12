(function() {
    // Cookie getter helper
    function getCookie(name) {
        let nameEQ = name + "=";
        let ca = document.cookie.split(';');
        for(let i=0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    }

    const currentPath = window.location.pathname;
    const superadminPaths = ['/html/admin-portal.html', '/admin-portal', '/html/admin-dashboard.html', '/admin-dashboard'];
    const isAdminPath = superadminPaths.some(path => currentPath.includes(path)) || currentPath.includes('admin-access');
    
    // Isolated session keys
    const tokenKey = isAdminPath ? 'argen_admin_token' : 'argen_token';
    const userKey = isAdminPath ? 'admin_user' : 'user';

    let token = localStorage.getItem(tokenKey);
    if (!token || token === 'undefined' || token === 'null') {
        token = getCookie(tokenKey);
        if (token && token !== 'undefined' && token !== 'null') {
            localStorage.setItem(tokenKey, token);
        }
    }

    let userStr = localStorage.getItem(userKey);
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
        userStr = getCookie(userKey);
        if (userStr && userStr !== 'undefined' && userStr !== 'null') {
            localStorage.setItem(userKey, userStr);
        }
    }

    const user = userStr && userStr !== 'undefined' && userStr !== 'null' ? JSON.parse(userStr) : null;
    
    // Define path groups (support both .html extension and clean routes)
    const teamadminPaths = ['/html/dashboard.html', '/dashboard', '/html/teams.html', '/teams', '/html/team-detail.html', '/team-detail'];
    const memberPaths = ['/html/dashboard.html', '/dashboard', '/html/challenges.html', '/challenges', '/take-evaluation'];
    
    // 1. Redirect to login if no token or user object for any protected path
    const isProtected = [...superadminPaths, ...teamadminPaths, ...memberPaths].some(path => currentPath.includes(path));
    
    if (isProtected && (!token || !user)) {
        console.warn('[AuthGuard] Unauthorized access. Redirecting to login.');
        const isSuperadminPath = superadminPaths.some(path => currentPath.includes(path));
        const loginPage = isSuperadminPath ? '/html/admin-access.html' : '/login';
        window.location.href = loginPage + '?redirect=' + encodeURIComponent(currentPath);
        return;
    }

    // 2. Role-based restrictions & Team Verification
    if (token && user) {
        const isSuperadminPath = superadminPaths.some(path => currentPath.includes(path));
        const role = user.role ? user.role.toLowerCase() : '';
        
        if (isSuperadminPath && role !== 'superadmin') {
            console.error('[AuthGuard] Superadmin access denied.');
            window.location.href = '/dashboard';
            return;
        }

        // Enforce team passcode verification for company admins and members
        if (role !== 'superadmin') {
            const isTeamsPage = currentPath.includes('/teams') || currentPath.includes('/html/teams.html');
            const isVerified = sessionStorage.getItem('team_verified') === 'true';

            if (isProtected && !isTeamsPage && !isVerified) {
                console.warn('[AuthGuard] Team not verified. Redirecting to passcode verification.');
                window.location.href = '/teams';
                return;
            }

            if (isTeamsPage && isVerified) {
                window.location.href = '/dashboard';
                return;
            }
        }

        // If trying to access login or registration while already logged in
        if (currentPath.includes('login') || currentPath.includes('admin-access') || currentPath.includes('registration')) {
            if (role === 'superadmin') {
                window.location.href = '/admin-portal';
            } else {
                window.location.href = '/dashboard';
            }
        }
    }
})();

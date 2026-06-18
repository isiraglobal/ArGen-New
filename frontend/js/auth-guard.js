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

    // Preserve team invite codes before any auth redirects. Team code is asked after login during onboarding.
    const urlParams = new URLSearchParams(window.location.search);
    const urlTeamCode = urlParams.get('code');
    if (urlTeamCode) {
        sessionStorage.setItem('pending_team_code', urlTeamCode.toUpperCase());
        localStorage.setItem('pending_team_code', urlTeamCode.toUpperCase());
    }

    // Handle OAuth token in URL query param
    const urlToken = urlParams.get('token');
    if (urlToken && urlToken !== 'undefined' && urlToken !== 'null') {
        localStorage.setItem(tokenKey, urlToken);
        document.cookie = `${tokenKey}=${encodeURIComponent(urlToken)}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=lax`;
        urlParams.delete('token');
        const cleanUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', cleanUrl);
        token = urlToken;
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
    const teamadminPaths = ['/html/dashboard.html', '/dashboard', '/html/teams.html', '/teams', '/html/team-detail.html', '/team-detail', '/connect', '/html/connect.html'];
    const onboardingPaths = ['/onboarding', '/html/onboarding.html'];
    const memberPaths = ['/html/dashboard.html', '/dashboard', '/html/challenges.html', '/challenges', '/take-evaluation', '/onboarding'];
    
    // 1. Redirect to login if no token or user object for any protected path
    const isProtected = [...superadminPaths, ...teamadminPaths, ...memberPaths, ...onboardingPaths].some(path => currentPath.includes(path));
    
    if (isProtected && (!token || !user)) {
        console.warn('[AuthGuard] Unauthorized access. Redirecting to login.');
        const isSuperadminPath = superadminPaths.some(path => currentPath.includes(path));
        const loginPage = '/login';
        window.location.href = loginPage + '?redirect=' + encodeURIComponent(currentPath);
        return;
    }

    // 2. Role-based restrictions & Team Verification
    if (token && user) {
        const isSuperadminPath = superadminPaths.some(path => currentPath.includes(path));
        const isOnboardingPath = onboardingPaths.some(path => currentPath.includes(path));
        const role = user.role ? user.role.toLowerCase() : '';

        if (user.profileComplete === false && !isOnboardingPath && !currentPath.includes('login')) {
            window.location.href = '/onboarding';
            return;
        }
        
        if (isSuperadminPath && role !== 'superadmin') {
            console.error('[AuthGuard] Superadmin access denied.');
            window.location.href = '/dashboard';
            return;
        }

        // A team code is never a public gate: users must log in first, then complete onboarding.
        if (role !== 'superadmin') {
            const isTeamsPage = currentPath.includes('/teams') || currentPath.includes('/html/teams.html');
            const isVerified = sessionStorage.getItem('team_verified') === 'true';
            const hasWorkspaceProfile = Boolean(user.companyId) && user.profileComplete !== false;

            if (hasWorkspaceProfile || role === 'teamadmin') {
                sessionStorage.setItem('team_verified', 'true');
            }

            if (isProtected && !hasWorkspaceProfile && !isOnboardingPath && !isTeamsPage) {
                console.warn('[AuthGuard] Workspace profile missing. Redirecting to onboarding.');
                window.location.href = '/onboarding';
                return;
            }

            if (isTeamsPage && (isVerified || hasWorkspaceProfile)) {
                window.location.href = '/dashboard';
                return;
            }
        }

        // If trying to access login or registration while already logged in
        if (currentPath.includes('login') || currentPath.includes('admin-access') || currentPath.includes('registration')) {
            if (role === 'superadmin') {
                window.location.href = '/admin-portal';
            } else if (user.profileComplete === false) {
                window.location.href = '/onboarding';
            } else {
                window.location.href = '/dashboard';
            }
        }
    }
})();

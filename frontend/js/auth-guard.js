(function() {
    const token = localStorage.getItem('argen_token');
    const protectedPaths = ['/teams', '/challenges', '/team'];
    const currentPath = window.location.pathname;

    // Check if current path is protected
    const isProtected = protectedPaths.some(path => currentPath.startsWith(path));

    if (isProtected && !token) {
        console.warn('[AuthGuard] Unauthorized access. Redirecting to login.');
        window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
    }
})();

/**
 * ArGen API Integration Service
 * Handles all communication with the Node.js backend
 */

// Centralized Neo-Brutalist Toast Notification System
window.showToast = (message, type = 'info') => {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    if (type === 'success') {
        icon = '<span style="color:#00ff88; font-weight:bold; margin-right:4px;">[✓]</span>';
    } else if (type === 'error') {
        icon = '<span style="color:#ef4444; font-weight:bold; margin-right:4px;">[✕]</span>';
    } else {
        icon = '<span style="color:#2B60E2; font-weight:bold; margin-right:4px;">[!]</span>';
    }

    toast.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.25rem;">
            ${icon}
            <span>${message}</span>
        </div>
        <button class="toast-close">✕</button>
    `;

    container.appendChild(toast);

    // Trigger reflow for slide transition
    toast.offsetHeight;
    toast.classList.add('show');

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    });

    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }
    }, 5000);
};

// Override window.alert globally to use the Neo-Brutalist Toast System
const originalAlert = window.alert;
window.alert = (message) => {
    if (window.showToast) {
        const lower = String(message).toLowerCase();
        let type = 'info';
        if (lower.includes('success') || lower.includes('copied') || lower.includes('complete') || lower.includes('activated') || lower.includes('sent') || lower.includes('ready') || lower.includes('valid')) {
            type = 'success';
        } else if (lower.includes('failed') || lower.includes('error') || lower.includes('invalid') || lower.includes('denied') || lower.includes('could not') || lower.includes('fail') || lower.includes('timeout')) {
            type = 'error';
        }
        window.showToast(message, type);
    } else {
        originalAlert(message);
    }
};

const getBaseUrl = () => {
    if (window.ARGEN_API_URL) return window.ARGEN_API_URL;
    const { hostname, protocol, port } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001/api';
    }
    return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
};

const API_BASE_URL = getBaseUrl();

const api = {
    baseUrl: API_BASE_URL,

    setCookie(name, value, days) {
        let expires = "";
        if (days) {
            let date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/; secure; samesite=lax";
    },

    getCookie(name) {
        let nameEQ = name + "=";
        let ca = document.cookie.split(';');
        for(let i=0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    },

    eraseCookie(name) {
        document.cookie = name + '=; Max-Age=-99999999; path=/; secure; samesite=lax';
    },

    async request(endpoint, options = {}) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

        // INTERCEPT DEMO MODE
        if (localStorage.getItem('is_demo_mode') === 'true') {
            return this.handleDemoMockRequest(cleanEndpoint, options);
        }

        const fullUrl = `${API_BASE_URL}${cleanEndpoint}`;
        console.log(`[API] ${options.method || 'GET'} ${fullUrl}`);

        const isAdminPage = window.location.pathname.includes('admin-portal') || 
                            window.location.pathname.includes('admin-access') || 
                            window.location.pathname.includes('admin-dashboard');
        const tokenKey = isAdminPage ? 'argen_admin_token' : 'argen_token';

        let token = localStorage.getItem(tokenKey);
        if (!token || token === 'undefined' || token === 'null') {
            token = this.getCookie(tokenKey);
            if (token && token !== 'undefined' && token !== 'null') {
                localStorage.setItem(tokenKey, token);
            }
        }

        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token && token !== 'undefined' && token !== 'null') {
            headers['Authorization'] = `Bearer ${token}`;
        }

        let response;
        try {
            response = await fetch(fullUrl, { ...options, headers });
        } catch (error) {
            console.error(`[API] Network Error for ${endpoint}:`, error);
            throw new Error('Connection failed. Is the backend server running?');
        }

        if (response.status === 401) {
            const isAdminPage = window.location.pathname.includes('admin-portal') || 
                                window.location.pathname.includes('admin-access') || 
                                window.location.pathname.includes('admin-dashboard');
            if (isAdminPage) {
                localStorage.removeItem('argen_admin_token');
                localStorage.removeItem('admin_user');
                this.eraseCookie('argen_admin_token');
                this.eraseCookie('admin_user');
                const path = window.location.pathname;
                if (!path.includes('admin-access')) {
                    window.location.href = '/html/admin-access.html';
                }
            } else {
                localStorage.removeItem('argen_token');
                localStorage.removeItem('user');
                sessionStorage.removeItem('team_verified');
                this.eraseCookie('argen_token');
                this.eraseCookie('user');
                if (window.supabaseAuthHelpers) {
                    window.supabaseAuthHelpers.signOut().catch(e => console.error(e));
                }
                const path = window.location.pathname;
                if (!path.includes('login')) {
                    window.location.href = '/login';
                }
            }
            throw new Error('Session expired. Please log in again.');
        }

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) {
            throw new Error(text || `Error ${response.status}`);
        }
        if (!response.ok) {
            throw new Error(data.message || data.msg || `Request failed (${response.status})`);
        }
        return data;
    },

    // ── Auth ──────────────────────────────────────────────
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        localStorage.setItem('argen_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        this.setCookie('argen_token', data.token, 7);
        this.setCookie('user', JSON.stringify(data.user), 7);
        return data;
    },

    async adminLogin(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data.user.role !== 'superadmin') {
            throw new Error('ACCESS_DENIED: Insufficient Privileges');
        }
        localStorage.setItem('argen_admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        this.setCookie('argen_admin_token', data.token, 7);
        this.setCookie('admin_user', JSON.stringify(data.user), 7);
        return data;
    },

    async getMe() {
        return this.request('/auth/me');
    },

    async registerCompany(companyData) {
        return this.request('/auth/register-company', {
            method: 'POST',
            body: JSON.stringify(companyData),
        });
    },

    async joinTeam(memberData) {
        const data = await this.request('/auth/join-team', {
            method: 'POST',
            body: JSON.stringify(memberData),
        });
        localStorage.setItem('argen_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        this.setCookie('argen_token', data.token, 7);
        this.setCookie('user', JSON.stringify(data.user), 7);
        return data;
    },

    async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    async resetPassword(token, password) {
        return this.request(`/auth/reset-password/${token}`, {
            method: 'POST',
            body: JSON.stringify({ password }),
        });
    },

    async verifyPasscode(inviteCode) {
        return this.request('/auth/verify-passcode', {
            method: 'POST',
            body: JSON.stringify({ inviteCode }),
        });
    },

    handleDemoMockRequest(endpoint, options) {
        console.log(`[API MOCK] ${options.method || 'GET'} ${endpoint}`);
        return new Promise((resolve) => {
            setTimeout(() => {
                if (endpoint.includes('/auth/me')) {
                    resolve({
                        id: "demo-user-id",
                        name: "Guest Explorer",
                        email: "guest@demo.argen",
                        role: "teamadmin",
                        companyId: "demo-company-id",
                        currentStreak: 2,
                        longestStreak: 4
                    });
                } else if (endpoint.includes('/admin/my-company')) {
                    resolve({
                        name: "Acme Global Demo",
                        inviteCode: "DEMO7777"
                    });
                } else if (endpoint.includes('/leaderboard')) {
                    resolve([
                        { userId: "user-1", name: "Sarah Connor", totalScore: 92.5, streak: 5, currentStreak: 5 },
                        { userId: "user-2", name: "John Doe", totalScore: 84.0, streak: 3, currentStreak: 3 },
                        { userId: "user-3", name: "Alice Smith", totalScore: 79.2, streak: 1, currentStreak: 1 },
                        { userId: "demo-user-id", name: "Guest Explorer (You)", totalScore: 88.5, streak: 2, currentStreak: 2 }
                    ]);
                } else if (endpoint.includes('/admin/company-dashboard-stats')) {
                    resolve({
                        avgScore: 86.1,
                        totalSubmissions: 12,
                        benchmark: {
                            team: [88, 82, 85, 89, 90],
                            median: [75, 72, 70, 78, 80]
                        },
                        trend: [72, 75, 78, 80, 81, 84, 85, 86],
                        dimensions: {
                            clarity: 88,
                            constraints: 82,
                            specificity: 85,
                            iteration: 89
                        }
                    });
                } else if (endpoint.includes('/admin/flagged')) {
                    resolve([
                        { userName: "John Doe", flags: ["low-effort", "AI boilerplate detector triggered"] }
                    ]);
                } else if (endpoint.includes('/admin/invoices')) {
                    resolve([
                        {
                            _id: "invoice-demo-1",
                            invoiceNumber: "INV-2026-001",
                            date: new Date().toISOString(),
                            productName: "ArGen Enterprise SaaS Platform License",
                            totalDue: 1200.00,
                            status: "Paid"
                        }
                    ]);
                } else if (endpoint.includes('/challenges/active')) {
                    resolve([
                        {
                            _id: "challenge-demo-1",
                            title: "Persona-Driven Market Assessment",
                            scenario: "Analyze the competitor landscape for a new AI writing assistant, focusing strictly on B2B marketing channels and staying within 400 words."
                        }
                    ]);
                } else if (endpoint.includes('/responses/my')) {
                    resolve([
                        {
                            _id: "response-demo-1",
                            createdAt: new Date(Date.now() - 86400000).toISOString(),
                            challengeId: { title: "Customer Persona Validation" },
                            overallScore: 88.5,
                            scores: { total: 88.5 }
                        }
                    ]);
                } else if (endpoint.includes('/evaluations/generate-ai')) {
                    resolve({ success: true });
                } else if (endpoint.includes('/auth/verify-passcode')) {
                    resolve({ valid: true });
                } else {
                    resolve({});
                }
            }, 300);
        });
    },

    logout() {
        if (localStorage.getItem('is_demo_mode') === 'true') {
            localStorage.removeItem('is_demo_mode');
            localStorage.removeItem('argen_token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('team_verified');
            window.location.href = '/login';
            return;
        }
        const isAdminPage = window.location.pathname.includes('admin-portal') || 
                            window.location.pathname.includes('admin-access') || 
                            window.location.pathname.includes('admin-dashboard');
        if (isAdminPage) {
            localStorage.removeItem('argen_admin_token');
            localStorage.removeItem('admin_user');
            this.eraseCookie('argen_admin_token');
            this.eraseCookie('admin_user');
            window.location.href = '/html/admin-access.html';
        } else {
            localStorage.removeItem('argen_token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('team_verified');
            this.eraseCookie('argen_token');
            this.eraseCookie('user');
            if (window.supabaseAuthHelpers) {
                window.supabaseAuthHelpers.signOut().catch(e => console.error(e));
            }
            window.location.href = '/login';
        }
    },

    // ── Challenges ────────────────────────────────────────
    async getChallenges() {
        return this.request('/challenges');
    },

    async getActiveChallenges() {
        return this.request('/challenges/active');
    },

    // ── Evaluations ───────────────────────────────────────
    async getEvaluations() {
        return this.request('/evaluations');
    },

    async getEvaluation(id) {
        return this.request(`/evaluations/${id}`);
    },

    async createEvaluationBatch(batchData) {
        return this.request('/evaluations', {
            method: 'POST',
            body: JSON.stringify(batchData),
        });
    },

    // ── Responses ─────────────────────────────────────────
    async submitEvaluationResponse(submissionData) {
        return this.request('/responses/submit', {
            method: 'POST',
            body: JSON.stringify(submissionData),
        });
    },

    async getMyResponses() {
        return this.request('/responses/my');
    },

    async getBatchResponses(batchId) {
        return this.request(`/responses/batch/${batchId}`);
    },

    // ── Leaderboard ───────────────────────────────────────
    async getLeaderboard() {
        return this.request('/leaderboard');
    },

    // ── Benchmarks ────────────────────────────────────────
    async getBenchmarks() {
        return this.request('/benchmark');
    },

    // ── Admin ─────────────────────────────────────────────
    async getMyCompany() {
        return this.request('/admin/my-company');
    },

    async getDashboardStats() {
        return this.request('/admin/company-dashboard-stats');
    },

    async getAdminStats() {
        return this.request('/admin/stats');
    },

    async getAllCompanies() {
        return this.request('/admin/companies');
    },

    async approveCompany(companyId) {
        return this.request(`/admin/companies/${companyId}/approve`, { method: 'PATCH' });
    },

    async getAllUsers() {
        return this.request('/admin/users');
    },

    async getFlaggedSubmissions() {
        return this.request('/admin/flagged');
    },

    async sendInvitation(email, companyName) {
        return this.request('/admin/invitations/send', {
            method: 'POST',
            body: JSON.stringify({ email, companyName }),
        });
    },

    // ── Teams ─────────────────────────────────────────────
    async getTeam(teamId) {
        return this.request(`/admin/companies/${teamId}`);
    },

    async getTeamScores(teamId) {
        return this.request(`/admin/companies/${teamId}/scores`);
    },

    // ── Scheduler / AI Cycle ──────────────────────────────
    async triggerDailyCycle() {
        return this.request('/evaluations/generate-ai', { method: 'POST' });
    },

    // ── Invoices ──────────────────────────────────────────
    async getInvoices() {
        return this.request('/admin/invoices');
    },

    async getPublicInvoice(id) {
        return this.request(`/admin/invoices/public/${id}`);
    },

    async createInvoice(invoiceData) {
        return this.request('/admin/invoices', {
            method: 'POST',
            body: JSON.stringify(invoiceData)
        });
    },

    async updateInvoice(id, invoiceData) {
        return this.request(`/admin/invoices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(invoiceData)
        });
    },

    async deleteInvoice(id) {
        return this.request(`/admin/invoices/${id}`, {
            method: 'DELETE'
        });
    }
};

window.argenApi = api;

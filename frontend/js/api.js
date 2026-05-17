/**
 * ArGen API Integration Service
 * Handles all communication with the Node.js backend
 */

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

    async request(endpoint, options = {}) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const fullUrl = `${API_BASE_URL}${cleanEndpoint}`;
        console.log(`[API] ${options.method || 'GET'} ${fullUrl}`);

        const token = localStorage.getItem('argen_token');
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
            localStorage.removeItem('argen_token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('team_verified');
            const path = window.location.pathname;
            if (!path.startsWith('/login') && !path.startsWith('/admin-access')) {
                window.location.href = '/login';
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

    logout() {
        localStorage.removeItem('argen_token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('team_verified');
        window.location.href = '/login';
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
        return this.request('/scheduler/daily', { method: 'POST' });
    },
};

window.argenApi = api;

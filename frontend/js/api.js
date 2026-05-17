/**
 * ArGen API Integration Service
 * Handles all communication with the Node.js backend
 */

// Check if we have a production API URL set, otherwise fallback to localhost
const getBaseUrl = () => {
    if (window.ARGEN_API_URL) return window.ARGEN_API_URL;
    const { hostname, protocol, port } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5001/api';
    }
    // For production, if hosted on the same domain
    return `${protocol}//${hostname}${port ? ':' + port : ''}/api`;
};

const API_BASE_URL = getBaseUrl();

const api = {
    baseUrl: API_BASE_URL,
    // Helper for fetch with auth
    async request(endpoint, options = {}) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const fullUrl = `${API_BASE_URL}${cleanEndpoint}`;
        
        console.log(`[API] Requesting: ${fullUrl}`);
        
        const token = localStorage.getItem('argen_token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token && token !== 'undefined' && token !== 'null') {
            headers['Authorization'] = `Bearer ${token}`;
        }

        let response;
        try {
            response = await fetch(fullUrl, {
                ...options,
                headers,
            });
        } catch (error) {
            console.error(`[API] Network Error for ${endpoint}:`, error);
            throw new Error('Connection failed. Is the backend server running?');
        }

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('argen_token');
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            // Not JSON
            throw new Error(text || `Error ${response.status}: ${response.statusText}`);
        }

        if (!response.ok) {
            throw new Error(data.message || data.msg || 'API request failed');
        }
        return data;
    },

    // Auth
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        localStorage.setItem('argen_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    },

    async registerCompany(companyData) {
        // { companyName, industry, size, country, name, email, password }
        return this.request('/auth/register-company', {
            method: 'POST',
            body: JSON.stringify(companyData),
        });
    },

    async joinTeam(memberData) {
        // { name, email, password, inviteCode, jobRole, department }
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
        window.location.href = '/';
    },

    // Evaluations & Batches
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

    // Challenges
    async getChallenges() {
        return this.request('/challenges');
    },

    // Responses & Submissions
    async submitEvaluationResponse(submissionData) {
        // { challengeId, evaluationId, promptText, modelOutput }
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

    // Benchmarks
    async getBenchmarks() {
        return this.request('/benchmark');
    }
};

window.argenApi = api;

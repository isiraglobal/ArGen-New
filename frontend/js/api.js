/**
 * ArGen API Integration Service
 * Handles all communication with the Node.js backend
 */

// Check if we have a production API URL set, otherwise fallback to localhost
const API_BASE_URL = window.ARGEN_API_URL || 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5001/api' 
        : '/api'); 

const api = {
    baseUrl: API_BASE_URL,
    // Helper for fetch with auth
    async request(endpoint, options = {}) {
        console.log(`[API] Requesting ${endpoint}...`);
        const token = localStorage.getItem('argen_token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        let response;
        try {
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
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

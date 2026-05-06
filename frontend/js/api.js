/**
 * ArGen API Integration Service
 * Handles all communication with the Node.js backend
 */

const API_BASE_URL = 'http://localhost:5000/api';

const api = {
    // Helper for fetch with auth
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('argen_token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('argen_token');
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
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

    async signup(userData) {
        const data = await this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        localStorage.setItem('argen_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    },

    logout() {
        localStorage.removeItem('argen_token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    },

    // Teams
    async getTeams() {
        return this.request('/teams');
    },

    async getTeam(id) {
        return this.request(`/teams/${id}`);
    },

    async createTeam(teamData) {
        return this.request('/teams', {
            method: 'POST',
            body: JSON.stringify(teamData),
        });
    },

    // Challenges
    async getChallenges() {
        return this.request('/challenges');
    },

    async submitResponse(challengeId, responseText) {
        return this.request(`/challenges/${challengeId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ responseText }),
        });
    },

    // Scores & Analytics
    async getTeamScores(teamId) {
        return this.request(`/scores/${teamId}`);
    },

    async getBenchmarks() {
        return this.request('/benchmark');
    }
};

window.argenApi = api;

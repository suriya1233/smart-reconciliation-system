import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                        refreshToken
                    });
                    localStorage.setItem('token', data.data.token);
                    error.config.headers.Authorization = `Bearer ${data.data.token}`;
                    return api(error.config);
                } catch (refreshError) {
                    localStorage.clear();
                    window.location.href = '/';
                }
            }
        }
        return Promise.reject(error);
    }
);

// Authentication APIs
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
    refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken })
};

// Reconciliation APIs
export const reconciliationAPI = {
    uploadFile: (formData) => api.post('/reconciliation/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getResults: (params) => api.get('/reconciliation/results', { params }),
    getResultById: (id) => api.get(`/reconciliation/results/${id}`),
    manualCorrection: (id, updates) => api.put(`/reconciliation/results/${id}/correct`, updates),
    getStatistics: (params) => api.get('/reconciliation/statistics', { params }),
    getHistoricalStatistics: (params) => api.get('/reconciliation/statistics/historical', { params })
};

// Audit APIs
export const auditAPI = {
    getLogs: (params) => api.get('/audit/logs', { params }),
    getLogsByRecordId: (recordId, params) => api.get(`/audit/logs/${recordId}`, { params }),
    getActivitySummary: (params) => api.get('/audit/summary', { params })
};

// Settings APIs
export const settingsAPI = {
    getRules: () => api.get('/settings/rules'),
    updateRules: (rules) => api.put('/settings/rules', { rules }),
    getUsers: (params) => api.get('/settings/users', { params }),
    createUser: (userData) => api.post('/settings/users', userData),
    updateUser: (id, updates) => api.put(`/settings/users/${id}`, updates),
    deleteUser: (id) => api.delete(`/settings/users/${id}`)
};

export default api;

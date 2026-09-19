import axios from 'axios';

// Get API base URL from environment or fallback to proxy path /api
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('taskflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Global Errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred.';

    return Promise.reject(new Error(message));
  }
);

// --- API Service Methods ---

// Health Check
export const checkHealth = () => api.get('/health');

// Authentication
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const registerUser = (userData) => api.post('/auth/register', userData);
export const getMyProfile = () => api.get('/auth/me');
export const updateMyProfile = (data) => api.put('/auth/profile', data);
export const changeMyPassword = (data) => api.put('/auth/change-password', data);
export const searchUsers = (query = '') =>
  api.get(`/auth/users${query ? `?search=${encodeURIComponent(query)}` : ''}`);

// Projects
export const fetchProjects = () => api.get('/projects');
export const fetchProjectById = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const addProjectMember = (projectId, data) =>
  api.post(`/projects/${projectId}/members`, data);
export const removeProjectMember = (projectId, userId) =>
  api.delete(`/projects/${projectId}/members/${userId}`);

// Tasks
export const fetchTasks = (params = {}) => api.get('/tasks', { params });
export const fetchTaskById = (id) => api.get(`/tasks/${id}`);
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// Comments
export const fetchTaskComments = (taskId) => api.get(`/tasks/${taskId}/comments`);
export const addTaskComment = (taskId, data) => api.post(`/tasks/${taskId}/comments`, data);
export const deleteTaskComment = (commentId) => api.delete(`/comments/${commentId}`);

export default api;

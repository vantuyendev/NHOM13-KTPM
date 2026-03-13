import axios from 'axios';

const normalizeApiBaseUrl = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
};

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: configuredApiBaseUrl ? normalizeApiBaseUrl(configuredApiBaseUrl) : '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const login = (companyEmail: string, password: string) =>
  api.post<{ token: string; mustChangePassword: boolean }>('/auth/login', { companyEmail, password });

export const changeFirstPassword = (currentPassword: string, newPassword: string) =>
  api.post('/auth/change-first-password', { currentPassword, newPassword });

export const forgotPassword = (companyEmail: string) =>
  api.post('/auth/forgot-password', { companyEmail });

export const globalSearch = (query: string) =>
  api.get<import('../types').GlobalSearchResponse>('/search/global', {
    params: { query },
  });

// Projects
export const getProjects = () => api.get<import('../types').Project[]>('/project');
export const getProject = (id: number) => api.get<import('../types').Project>(`/project/${id}`);
export const createProject = (data: Partial<import('../types').Project>) => api.post('/project', data);
export const updateProject = (id: number, data: Partial<import('../types').Project>) => api.put(`/project/${id}`, data);
export const deleteProject = (id: number) => api.delete(`/project/${id}`);
export const addProjectMember = (projectId: number, userId: number) =>
  api.post(`/project/${projectId}/members/${userId}`);
export const removeProjectMember = (projectId: number, userId: number) =>
  api.delete(`/project/${projectId}/members/${userId}`);
export const downloadProject = (id: number) =>
  api.get(`/project/${id}/download`, { responseType: 'blob' });

// Tasks
export const getTasks = (projectId: number) =>
  api.get<import('../types').Task[]>(`/projects/${projectId}/tasks`);
export const createTask = (projectId: number, data: Partial<import('../types').Task>) =>
  api.post(`/projects/${projectId}/tasks`, data);
export const updateTask = (projectId: number, taskId: number, data: Partial<import('../types').Task>) =>
  api.put(`/projects/${projectId}/tasks/${taskId}`, data);
export const deleteTask = (projectId: number, taskId: number) =>
  api.delete(`/projects/${projectId}/tasks/${taskId}`);

// Comments
export const getComments = (projectId: number, taskId: number) =>
  api.get<import('../types').Comment[]>(`/projects/${projectId}/tasks/${taskId}/comments`);
export const addComment = (projectId: number, taskId: number, content: string) =>
  api.post(`/projects/${projectId}/tasks/${taskId}/comments`, { content });

// Documents
export const getDocuments = (projectId: number) =>
  api.get<import('../types').Document[]>(`/document/project/${projectId}`);
export const uploadDocument = (data: {
  projectId: number;
  taskId?: number;
  fileSizeBytes: number;
  cloudUrl?: string;
}) => api.post('/document/upload', data);

// Departments
export const getDepartments = () => api.get<import('../types').Department[]>('/department');
export const createDepartment = (data: { name: string; description?: string }) =>
  api.post('/department', data);
export const updateDepartment = (id: number, data: { name: string; description?: string }) =>
  api.put(`/department/${id}`, data);
export const deleteDepartment = (id: number) => api.delete(`/department/${id}`);

// Users
export const getUsers = () => api.get<import('../types').User[]>('/user');
export const getMyProfile = () => api.get<import('../types').User>('/user/me');
export const createUser = (data: {
  systemUserId: string;
  companyEmail: string;
  password: string;
  roleId: number;
  departmentId?: number;
}) => api.post('/user', data);
export const updateUser = (id: number, data: Partial<import('../types').User>) =>
  api.put(`/user/${id}`, data);
export const deleteUser = (id: number) => api.delete(`/user/${id}`);

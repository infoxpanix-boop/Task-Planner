const BASE = '/api';

export class AuthError extends Error {}

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.error || `Request failed: ${res.status}`;
    if (res.status === 401) throw new AuthError(message);
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Auth
export const signup = (email, password, name) =>
  request('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) });
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const logout = () => request('/auth/logout', { method: 'POST' });
export const fetchMe = () => request('/auth/me');

// Tasks
export const fetchTasks = () => request('/tasks');
export const upsertTask = (key, hour, name) =>
  request(`/tasks/${encodeURIComponent(key)}/${hour}`, { method: 'PUT', body: JSON.stringify({ name }) });
export const deleteTask = (key, hour) =>
  request(`/tasks/${encodeURIComponent(key)}/${hour}`, { method: 'DELETE' });
export const ensureDateOverride = (dateKeyStr, dow) =>
  request(`/tasks/ensure-date/${encodeURIComponent(dateKeyStr)}`, { method: 'POST', body: JSON.stringify({ dow }) });

// Completions
export const fetchCompletions = () => request('/completions');
export const setCompletion = (date, hour, completed) =>
  request(`/completions/${encodeURIComponent(date)}/${hour}`, { method: 'PUT', body: JSON.stringify({ completed }) });

// Important tasks
export const fetchImportantTasks = () => request('/important-tasks');
export const createImportantTask = (name) =>
  request('/important-tasks', { method: 'POST', body: JSON.stringify({ name }) });
export const updateImportantTask = (id, patch) =>
  request(`/important-tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
export const deleteImportantTask = (id) =>
  request(`/important-tasks/${id}`, { method: 'DELETE' });

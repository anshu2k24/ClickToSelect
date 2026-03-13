const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const STORAGE_KEY = "interview_ai_auth";

export function getApiBaseUrl() {
  return API_BASE_URL.replace(/\/$/, "");
}

export function getStoredSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredSession(session) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getAccessToken() {
  return getStoredSession()?.accessToken || null;
}

export function getSessionRole() {
  return getStoredSession()?.role || null;
}

function buildUrl(path, params) {
  const url = new URL(`${getApiBaseUrl()}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url;
}

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    params,
    headers = {},
    token = getAccessToken(),
  } = options;

  const requestHeaders = { ...headers };
  const config = { method, headers: requestHeaders };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (body instanceof FormData) {
    config.body = body;
  } else if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, params), config);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string"
      ? payload
      : payload?.detail || payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload;
}
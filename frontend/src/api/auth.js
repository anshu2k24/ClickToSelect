import {
  apiRequest,
  clearStoredSession,
  getStoredSession,
  saveStoredSession,
} from "./client";

export async function registerUser(payload) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function loginUser(payload) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function authenticate({ name, email, password, role }) {
  await registerUser({ name, email, password, role });
  const login = await loginUser({ email, password });
  const session = {
    accessToken: login.access_token,
    tokenType: login.token_type,
    role,
    email,
    name,
  };
  saveStoredSession(session);
  return session;
}

export function getSession() {
  return getStoredSession();
}

export function logout() {
  clearStoredSession();
}
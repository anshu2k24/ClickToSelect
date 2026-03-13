import { apiRequest } from "./client";

export function createRecruiterProfile(payload) {
  return apiRequest("/recruiter/profile", {
    method: "POST",
    body: payload,
  });
}

export function getMyRecruiterProfile() {
  return apiRequest("/recruiter/me");
}

export function updateMyRecruiterProfile(payload) {
  return apiRequest("/recruiter/me", {
    method: "PUT",
    body: payload,
  });
}
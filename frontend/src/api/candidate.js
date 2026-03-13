import { apiRequest } from "./client";

export function createCandidateProfile(payload) {
  return apiRequest("/candidate/profile", {
    method: "POST",
    body: payload,
  });
}

export function getMyCandidateProfile() {
  return apiRequest("/candidate/me");
}

export function updateMyCandidateProfile(payload) {
  return apiRequest("/candidate/me", {
    method: "PUT",
    body: payload,
  });
}

export function listCandidates() {
  return apiRequest("/candidate/list");
}
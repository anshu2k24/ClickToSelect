import { apiRequest } from "./client";

export function listSkills(candidateId) {
  return apiRequest(`/skill/${candidateId}`);
}

export function addSkill(payload) {
  return apiRequest("/skill/add", {
    method: "POST",
    params: payload,
  });
}

export function deleteSkill(skillId) {
  return apiRequest(`/skill/${skillId}`, {
    method: "DELETE",
  });
}

export function verifySkill(skillId, payload) {
  return apiRequest(`/skill/${skillId}/verify`, {
    method: "PUT",
    params: payload,
  });
}
import { apiRequest } from "./client";

export function getCandidateReport(candidateId) {
  return apiRequest(`/report/${candidateId}`);
}

export function getLeaderboard() {
  return apiRequest("/leaderboard/");
}
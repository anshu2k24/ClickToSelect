import { apiRequest } from "./client";

export function reportCheatEvent(payload) {
  return apiRequest("/cheat/report", {
    method: "POST",
    body: payload,
  });
}

export function getCheatLogs(interviewId) {
  return apiRequest(`/cheat/${interviewId}`);
}
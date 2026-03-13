import { apiRequest } from "./client";

export function submitAiScore(payload) {
  return apiRequest("/score/ai", {
    method: "POST",
    params: payload,
  });
}

export function submitHrScore(payload) {
  return apiRequest("/score/hr", {
    method: "POST",
    params: payload,
  });
}
import { apiRequest } from "./client";

export function submitAnswer(payload) {
  return apiRequest("/answer/submit", {
    method: "POST",
    params: payload,
  });
}
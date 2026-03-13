import { apiRequest } from "./client";

export function shortlistCandidate(payload) {
  return apiRequest("/shortlist/add", {
    method: "POST",
    params: payload,
  });
}

export function listShortlist(jobId) {
  return apiRequest(`/shortlist/job/${jobId}`);
}
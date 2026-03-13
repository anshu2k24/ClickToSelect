import { apiRequest } from "./client";

export function createInterview(payload) {
  return apiRequest("/interview/create", {
    method: "POST",
    params: payload,
  });
}

export function addInterviewCandidate(payload) {
  return apiRequest("/interview/add-candidate", {
    method: "POST",
    params: payload,
  });
}

export function startInterview(interviewId) {
  return apiRequest("/interview/start", {
    method: "POST",
    params: { interview_id: interviewId },
  });
}

export function getMyInterviews() {
  return apiRequest("/interview/my");
}
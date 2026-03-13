import { apiRequest } from "./client";

export function addQuestion(payload) {
  return apiRequest("/question/add", {
    method: "POST",
    params: payload,
  });
}

export function listQuestions(interviewId) {
  return apiRequest(`/question/list/${interviewId}`);
}
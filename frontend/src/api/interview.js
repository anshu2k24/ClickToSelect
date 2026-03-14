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

export function listInterviewCandidates(interviewId) {
  return apiRequest(`/interview/candidates/${interviewId}`);
}

export function getInterviewQuestion({ interviewId, candidateId }) {
  return apiRequest("/interview/question", {
    params: {
      interview_id: interviewId,
      candidate_id: candidateId,
    },
  });
}

export function askInterviewQuestionDecision({
  interviewId,
  candidateId,
  decision,
  llmQuestion,
  customQuestion,
}) {
  return apiRequest("/interview/ask", {
    method: "POST",
    params: {
      interview_id: interviewId,
      candidate_id: candidateId,
      decision,
      llm_question: llmQuestion,
      custom_question: customQuestion,
    },
  });
}

export function submitInterviewAnswer({ interviewId, candidateId, answer, source }) {
  return apiRequest("/interview/answer", {
    method: "POST",
    params: {
      interview_id: interviewId,
      candidate_id: candidateId,
      answer,
      source,
    },
  });
}

export function submitInterviewManualScore({ interviewId, candidateId, score }) {
  return apiRequest("/interview/manual-score", {
    method: "POST",
    params: {
      interview_id: interviewId,
      candidate_id: candidateId,
      score,
    },
  });
}

export function endInterview(interviewId) {
  return apiRequest("/interview/end", {
    method: "POST",
    params: { interview_id: interviewId },
  });
}
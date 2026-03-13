import { apiRequest } from "./client";

export function startSkillBrain(skillId) {
  return apiRequest("/skill-brain/start", {
    method: "POST",
    params: { skill_id: skillId },
  });
}

export function answerSkillBrain({ skillId, candidateResponse }) {
  return apiRequest("/skill-brain/answer", {
    method: "POST",
    params: {
      skill_id: skillId,
      candidate_response: candidateResponse,
    },
  });
}

export function queryBrain(payload) {
  return answerSkillBrain({
    skillId: payload?.skill_id,
    candidateResponse: payload?.answer,
  });
}
import { apiRequest } from "./client";

export function createJob(payload) {
  return apiRequest("/job/create", {
    method: "POST",
    body: payload,
  });
}

export function getMyJobs() {
  return apiRequest("/job/my-listings");
}

export function getJob(jobId) {
  return apiRequest(`/job/${jobId}`);
}
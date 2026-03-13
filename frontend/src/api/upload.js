import { apiRequest } from "./client";

export function uploadResume(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest("/upload/resume", {
    method: "POST",
    body: formData,
  });
}
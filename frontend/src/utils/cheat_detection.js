import { getAccessToken, getApiBaseUrl } from "../api/client";

let mediapipeLoadPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureMediapipeLoaded() {
  if (!mediapipeLoadPromise) {
    mediapipeLoadPromise = Promise.all([
      loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js"),
      loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"),
    ]);
  }

  await mediapipeLoadPromise;

  const FaceDetectionCtor = window.FaceDetection || window.faceDetection?.FaceDetection;
  const CameraCtor = window.Camera;

  if (!FaceDetectionCtor || !CameraCtor) {
    throw new Error("MediaPipe face detection scripts loaded, but required globals are missing.");
  }

  return { FaceDetectionCtor, CameraCtor };
}

export async function initCheatDetection({
  video,
  candidateId,
  interviewId,
  onEvent,
  onStatusChange,
}) {
  if (!video) {
    return () => {};
  }

  const { FaceDetectionCtor, CameraCtor } = await ensureMediapipeLoaded();
  const eventCooldowns = new Map();
  let mediaStream = null;
  let camera = null;
  let stopped = false;

  const reportCheat = async (type, confidence) => {
    onEvent?.({ type, confidence });

    if (!candidateId || !interviewId) {
      return;
    }

    const now = Date.now();
    const last = eventCooldowns.get(type) || 0;
    if (now - last < 5000) {
      return;
    }
    eventCooldowns.set(type, now);

    try {
      const token = getAccessToken();
      await fetch(`${getApiBaseUrl()}/cheat/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          interview_id: interviewId,
          event_type: type,
          confidence,
        }),
      });
    } catch {
      onStatusChange?.("Cheat monitoring is active, but reporting failed.");
    }
  };

  mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  video.srcObject = mediaStream;
  video.setAttribute("playsinline", "true");
  await video.play().catch(() => {});

  const faceDetection = new FaceDetectionCtor({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
  });

  faceDetection.setOptions({
    model: "short",
    minDetectionConfidence: 0.6,
  });

  faceDetection.onResults((results) => {
    if (stopped) {
      return;
    }

    const detections = results?.detections || [];
    if (detections.length === 0) {
      reportCheat("no_face", 0.9);
    }
    if (detections.length > 1) {
      reportCheat("multiple_faces", 0.95);
    }
  });

  camera = new CameraCtor(video, {
    onFrame: async () => {
      if (!stopped) {
        await faceDetection.send({ image: video });
      }
    },
    width: 640,
    height: 480,
  });

  const handleVisibility = () => {
    if (document.hidden) {
      reportCheat("tab_switch", 0.85);
    }
  };

  const handleBlur = () => {
    reportCheat("window_blur", 0.8);
  };

  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("blur", handleBlur);

  onStatusChange?.(
    candidateId && interviewId
      ? "Cheat monitoring active."
      : "Camera active. Cheat reporting starts when an interview session is linked."
  );
  await camera.start();

  return async () => {
    stopped = true;
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("blur", handleBlur);

    if (camera?.stop) {
      camera.stop();
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }

    if (video) {
      video.srcObject = null;
    }
  };
}
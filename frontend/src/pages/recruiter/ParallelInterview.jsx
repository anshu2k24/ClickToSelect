import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import RecruiterHeader from "../../components/RecruiterHeader";
import { listCandidates } from "../../api/candidate";
import {
  askInterviewQuestionDecision,
  endInterview,
  getInterviewQuestion,
  listInterviewCandidates,
  submitInterviewAnswer,
  submitInterviewManualScore,
} from "../../api/interview";

const C = {
  bg: "#0F0020",
  panel: "rgba(20,0,45,0.92)",
  vivid: "#A855F7",
  dark: "#1A0033",
  border: "rgba(168,85,247,0.18)",
  textMid: "rgba(255,255,255,0.78)",
  textDim: "rgba(255,255,255,0.52)",
};

const GLOBAL = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{min-height:100vh;background:#0F0020;}
  ::-webkit-scrollbar{width:5px;height:5px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#2D0059;border-radius:4px;}
  @keyframes rPulse{0%,100%{opacity:1}50%{opacity:0.25}}
  .pi-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 14px;border-radius:8px;border:1px solid rgba(168,85,247,0.28);background:rgba(168,85,247,0.10);color:#fff;font-family:'Sora',sans-serif;font-size:12px;font-weight:700;cursor:pointer;}
  .pi-btn:disabled{opacity:0.45;cursor:not-allowed;}
  .pi-btn-solid{background:linear-gradient(135deg,#4C1D95,#7C3AED,#A855F7);border:none;}
  .pi-input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(168,85,247,0.30);background:rgba(15,0,32,0.85);color:#fff;font-family:'Sora',sans-serif;font-size:12px;outline:none;}
  .pi-input:focus{border-color:rgba(168,85,247,0.62);}
`;

function safeAvg(scores) {
  if (!Array.isArray(scores) || !scores.length) {
    return 0;
  }
  const sum = scores.reduce((acc, score) => acc + Number(score || 0), 0);
  return Math.round(sum / scores.length);
}

function profileFromMap(candidateId, profileMap) {
  const profile = profileMap.get(candidateId);
  if (!profile) {
    return {
      name: `Candidate ${String(candidateId).slice(0, 6)}`,
      email: "Not available",
      avatar: "CA",
    };
  }

  const avatar = String(profile.name || "C")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    name: profile.name || "Candidate",
    email: profile.email || "Not available",
    avatar: avatar || "CA",
  };
}

export default function ParallelInterview() {
  const { interviewId: paramInterviewId } = useParams();
  const [searchParams] = useSearchParams();
  const interviewId = paramInterviewId || searchParams.get("interviewId") || "";

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");

  const [pendingQuestions, setPendingQuestions] = useState({});
  const [activeQuestions, setActiveQuestions] = useState({});
  const [customDrafts, setCustomDrafts] = useState({});
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [manualReview, setManualReview] = useState({});
  const [manualScores, setManualScores] = useState({});
  const [actionLog, setActionLog] = useState([]);

  useEffect(() => {
    if (!interviewId) {
      setLoading(false);
      setError("Interview ID is required. Open this page with ?interviewId=<id>.");
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [linkedRows, allProfiles] = await Promise.all([
          listInterviewCandidates(interviewId),
          listCandidates().catch(() => []),
        ]);

        if (cancelled) {
          return;
        }

        const profileMap = new Map((Array.isArray(allProfiles) ? allProfiles : []).map((row) => [String(row.id), row]));
        const normalized = (Array.isArray(linkedRows) ? linkedRows : []).map((row) => {
          const candidateId = String(row.candidate_id || "");
          const profile = profileFromMap(candidateId, profileMap);
          const scores = Array.isArray(row.scores) ? row.scores.map((score) => Number(score || 0)) : [];

          return {
            id: candidateId,
            interviewCandidateId: String(row.id || ""),
            sessionIndex: row.session_index ?? 0,
            status: row.status || "pending",
            scores,
            avgScore: safeAvg(scores),
            ...profile,
          };
        });

        setCandidates(normalized);
        setSelectedCandidateId((prev) => prev || normalized[0]?.id || "");
      } catch (loadError) {
        if (!cancelled) {
          setCandidates([]);
          setError(loadError.message || "Failed to load interview candidates.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [interviewId]);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedCandidateId) || null,
    [candidates, selectedCandidateId]
  );

  const appendLog = (text, type = "system") => {
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setActionLog((prev) => [{ id: `${Date.now()}-${Math.random()}`, time, text, type }, ...prev].slice(0, 30));
  };

  const refreshCandidateScore = (candidateId, nextScore) => {
    setCandidates((prev) => prev.map((candidate) => {
      if (candidate.id !== candidateId) {
        return candidate;
      }
      const scores = [...(candidate.scores || []), Number(nextScore || 0)];
      return {
        ...candidate,
        scores,
        avgScore: safeAvg(scores),
      };
    }));
  };

  const handleGenerateFollowUp = async () => {
    if (!selectedCandidateId || !interviewId) {
      return;
    }

    setBusy(true);
    setStatusMessage("");
    setError("");

    try {
      const response = await getInterviewQuestion({
        interviewId,
        candidateId: selectedCandidateId,
      });

      const question = String(response?.llm_question || "").trim();
      if (!question) {
        throw new Error("Backend did not return an LLM follow-up question.");
      }

      setPendingQuestions((prev) => ({
        ...prev,
        [selectedCandidateId]: question,
      }));
      appendLog(`LLM follow-up generated for ${selectedCandidate?.name || selectedCandidateId}.`, "system");
    } catch (requestError) {
      setError(requestError.message || "Failed to fetch LLM follow-up question.");
    } finally {
      setBusy(false);
    }
  };

  const handleDecision = async (decision) => {
    if (!selectedCandidateId || !interviewId) {
      return;
    }

    const llmQuestion = pendingQuestions[selectedCandidateId] || "";
    const customQuestion = customDrafts[selectedCandidateId] || "";

    setBusy(true);
    setStatusMessage("");
    setError("");

    try {
      const response = await askInterviewQuestionDecision({
        interviewId,
        candidateId: selectedCandidateId,
        decision,
        llmQuestion,
        customQuestion,
      });

      const questionText = String(response?.question || "").trim();
      const source = response?.question_source === "llm" ? "llm" : "custom";

      if (!questionText) {
        throw new Error("Backend did not return the selected question.");
      }

      setActiveQuestions((prev) => ({
        ...prev,
        [selectedCandidateId]: {
          question: questionText,
          source,
        },
      }));
      appendLog(
        source === "llm"
          ? `LLM follow-up accepted for ${selectedCandidate?.name || selectedCandidateId}.`
          : `Recruiter custom question assigned to ${selectedCandidate?.name || selectedCandidateId}.`,
        "recruiter"
      );

      setStatusMessage("Question published to candidate.");
    } catch (requestError) {
      setError(requestError.message || "Failed to apply question decision.");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedCandidateId || !interviewId) {
      return;
    }

    const active = activeQuestions[selectedCandidateId];
    if (!active?.question) {
      setError("Select a follow-up question first.");
      return;
    }

    const answer = String(answerDrafts[selectedCandidateId] || "").trim();
    if (!answer) {
      setError("Enter candidate response before submitting.");
      return;
    }

    setBusy(true);
    setStatusMessage("");
    setError("");

    try {
      const response = await submitInterviewAnswer({
        interviewId,
        candidateId: selectedCandidateId,
        answer,
        source: active.source === "llm" ? "llm" : "custom",
      });

      if (typeof response?.score === "number") {
        refreshCandidateScore(selectedCandidateId, response.score);
        appendLog(`LLM score ${response.score} recorded for ${selectedCandidate?.name || selectedCandidateId}.`, "system");
        setStatusMessage("Answer scored by LLM.");
      } else {
        setManualReview((prev) => ({
          ...prev,
          [selectedCandidateId]: {
            answer: String(response?.answer_for_recruiter_review || answer),
          },
        }));
        appendLog(`Custom question answer received for ${selectedCandidate?.name || selectedCandidateId}.`, "system");
        setStatusMessage("Answer received. Provide recruiter score.");
      }

      setAnswerDrafts((prev) => ({
        ...prev,
        [selectedCandidateId]: "",
      }));
    } catch (requestError) {
      setError(requestError.message || "Failed to submit answer.");
    } finally {
      setBusy(false);
    }
  };

  const handleManualScore = async () => {
    if (!selectedCandidateId || !interviewId) {
      return;
    }

    const scoreValue = Number(manualScores[selectedCandidateId]);
    if (!Number.isFinite(scoreValue) || scoreValue < 0 || scoreValue > 100) {
      setError("Manual score must be between 0 and 100.");
      return;
    }

    setBusy(true);
    setStatusMessage("");
    setError("");

    try {
      await submitInterviewManualScore({
        interviewId,
        candidateId: selectedCandidateId,
        score: Math.round(scoreValue),
      });

      refreshCandidateScore(selectedCandidateId, Math.round(scoreValue));
      appendLog(`Recruiter score ${Math.round(scoreValue)} recorded for ${selectedCandidate?.name || selectedCandidateId}.`, "recruiter");
      setStatusMessage("Manual score submitted.");

      setManualReview((prev) => {
        const next = { ...prev };
        delete next[selectedCandidateId];
        return next;
      });
      setManualScores((prev) => ({
        ...prev,
        [selectedCandidateId]: "",
      }));
    } catch (requestError) {
      setError(requestError.message || "Failed to submit manual score.");
    } finally {
      setBusy(false);
    }
  };

  const handleEndInterview = async () => {
    if (!interviewId) {
      return;
    }

    setBusy(true);
    setStatusMessage("");
    setError("");

    try {
      await endInterview(interviewId);
      appendLog("Interview ended and LLM sessions cleaned up.", "system");
      setStatusMessage("Interview ended successfully.");
    } catch (requestError) {
      setError(requestError.message || "Failed to end interview.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style>{GLOBAL}</style>
      <RecruiterHeader />
      <div style={{ minHeight: "calc(100vh - 68px)", background: C.bg, fontFamily: "'Sora',sans-serif", color: "#fff", padding: "24px" }}>
        <div style={{ maxWidth: "1250px", margin: "0 auto", display: "grid", gridTemplateColumns: "340px 1fr", gap: "16px" }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "14px" }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "rgba(168,85,247,0.9)", letterSpacing: "0.1em", marginBottom: "10px", fontWeight: 700 }}>
              INTERVIEW CANDIDATES
            </div>
            <div style={{ fontSize: "12px", color: C.textDim, marginBottom: "12px" }}>Interview ID: {interviewId || "N/A"}</div>

            {loading && <div style={{ fontSize: "12px", color: C.textMid }}>Loading candidates...</div>}
            {!loading && !candidates.length && <div style={{ fontSize: "12px", color: C.textDim }}>No candidates linked to this interview.</div>}

            <div style={{ display: "grid", gap: "8px", maxHeight: "65vh", overflowY: "auto" }}>
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  onClick={() => setSelectedCandidateId(candidate.id)}
                  style={{
                    textAlign: "left",
                    borderRadius: "10px",
                    border: selectedCandidateId === candidate.id ? `1px solid ${C.vivid}` : "1px solid rgba(168,85,247,0.2)",
                    background: selectedCandidateId === candidate.id ? "rgba(168,85,247,0.16)" : "rgba(15,0,32,0.70)",
                    padding: "10px",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{candidate.name}</div>
                      <div style={{ fontSize: "10px", color: C.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{candidate.email}</div>
                    </div>
                    <div style={{
                      minWidth: "42px",
                      textAlign: "center",
                      borderRadius: "7px",
                      padding: "4px 6px",
                      background: "rgba(74,222,128,0.14)",
                      border: "1px solid rgba(74,222,128,0.3)",
                      fontWeight: 800,
                      fontSize: "12px",
                      color: "#4ade80",
                    }}>{candidate.avgScore}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "16px", display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "18px" }}>Parallel Interview Control</div>
                <div style={{ fontSize: "12px", color: C.textDim }}>
                  {selectedCandidate ? `Selected: ${selectedCandidate.name}` : "Select a candidate to begin"}
                </div>
              </div>
              <button className="pi-btn" onClick={handleEndInterview} disabled={busy || !interviewId}>End Interview</button>
            </div>

            {error && <div style={{ fontSize: "12px", color: "#fda4af", background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.28)", borderRadius: "8px", padding: "8px 10px" }}>{error}</div>}
            {statusMessage && <div style={{ fontSize: "12px", color: "#86efac", background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: "8px", padding: "8px 10px" }}>{statusMessage}</div>}

            <div style={{ border: "1px solid rgba(168,85,247,0.22)", borderRadius: "12px", padding: "12px", background: "rgba(15,0,32,0.65)" }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "rgba(168,85,247,0.8)", letterSpacing: "0.08em", marginBottom: "8px" }}>FOLLOW-UP QUESTION FLOW</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                <button className="pi-btn pi-btn-solid" onClick={handleGenerateFollowUp} disabled={busy || !selectedCandidateId}>Generate LLM Follow-up</button>
                <button className="pi-btn" onClick={() => handleDecision("accept_followup")} disabled={busy || !pendingQuestions[selectedCandidateId]}>Accept Follow-up</button>
              </div>

              <div style={{ marginBottom: "8px", fontSize: "12px", color: C.textDim }}>LLM Suggested Question</div>
              <div style={{ fontSize: "12px", color: C.textMid, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.22)", borderRadius: "8px", padding: "8px 10px", minHeight: "38px", marginBottom: "10px" }}>
                {pendingQuestions[selectedCandidateId] || "No LLM suggestion loaded yet."}
              </div>

              <div style={{ marginBottom: "8px", fontSize: "12px", color: C.textDim }}>Recruiter Custom Question</div>
              <textarea
                className="pi-input"
                rows={3}
                placeholder="Write your own follow-up question"
                value={customDrafts[selectedCandidateId] || ""}
                onChange={(event) => setCustomDrafts((prev) => ({
                  ...prev,
                  [selectedCandidateId]: event.target.value,
                }))}
                disabled={!selectedCandidateId || busy}
              />
              <div style={{ marginTop: "8px" }}>
                <button className="pi-btn" onClick={() => handleDecision("custom_question")} disabled={busy || !selectedCandidateId || !String(customDrafts[selectedCandidateId] || "").trim()}>Publish Custom Question</button>
              </div>
            </div>

            <div style={{ border: "1px solid rgba(168,85,247,0.22)", borderRadius: "12px", padding: "12px", background: "rgba(15,0,32,0.65)" }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "rgba(168,85,247,0.8)", letterSpacing: "0.08em", marginBottom: "8px" }}>ACTIVE QUESTION</div>
              <div style={{ fontSize: "12px", color: C.textMid, marginBottom: "8px" }}>
                {activeQuestions[selectedCandidateId]?.question || "No question has been published yet."}
              </div>
              <div style={{ fontSize: "10px", color: C.textDim, marginBottom: "10px" }}>
                Source: {activeQuestions[selectedCandidateId]?.source === "llm" ? "LLM" : activeQuestions[selectedCandidateId]?.source === "custom" ? "Recruiter" : "N/A"}
              </div>

              <div style={{ marginBottom: "8px", fontSize: "12px", color: C.textDim }}>Candidate Response</div>
              <textarea
                className="pi-input"
                rows={4}
                placeholder="Paste or type candidate response"
                value={answerDrafts[selectedCandidateId] || ""}
                onChange={(event) => setAnswerDrafts((prev) => ({
                  ...prev,
                  [selectedCandidateId]: event.target.value,
                }))}
                disabled={!selectedCandidateId || busy}
              />
              <div style={{ marginTop: "8px" }}>
                <button className="pi-btn pi-btn-solid" onClick={handleSubmitAnswer} disabled={busy || !selectedCandidateId || !activeQuestions[selectedCandidateId]?.question}>Submit Answer</button>
              </div>

              {manualReview[selectedCandidateId] && (
                <div style={{ marginTop: "12px", borderTop: "1px solid rgba(168,85,247,0.18)", paddingTop: "10px" }}>
                  <div style={{ fontSize: "12px", color: C.textMid, marginBottom: "6px" }}>Answer for recruiter review:</div>
                  <div style={{ fontSize: "12px", color: C.textDim, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: "8px", padding: "8px 10px", marginBottom: "8px" }}>
                    {manualReview[selectedCandidateId].answer}
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      className="pi-input"
                      style={{ width: "120px" }}
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Score"
                      value={manualScores[selectedCandidateId] || ""}
                      onChange={(event) => setManualScores((prev) => ({
                        ...prev,
                        [selectedCandidateId]: event.target.value,
                      }))}
                      disabled={busy}
                    />
                    <button className="pi-btn" onClick={handleManualScore} disabled={busy}>Submit Manual Score</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ border: "1px solid rgba(168,85,247,0.22)", borderRadius: "12px", padding: "12px", background: "rgba(15,0,32,0.65)" }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "rgba(168,85,247,0.8)", letterSpacing: "0.08em", marginBottom: "8px" }}>ACTION LOG</div>
              <div style={{ maxHeight: "160px", overflowY: "auto", display: "grid", gap: "7px" }}>
                {!actionLog.length && <div style={{ fontSize: "12px", color: C.textDim }}>No actions yet.</div>}
                {actionLog.map((entry) => (
                  <div key={entry.id} style={{ border: "1px solid rgba(168,85,247,0.15)", borderRadius: "8px", padding: "7px 9px", background: "rgba(168,85,247,0.06)" }}>
                    <div style={{ fontSize: "10px", color: "rgba(168,85,247,0.84)", marginBottom: "3px" }}>{entry.time} · {entry.type.toUpperCase()}</div>
                    <div style={{ fontSize: "12px", color: C.textMid }}>{entry.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

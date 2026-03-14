import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../../components/Header";
import { getMyInterviewQuestion, submitMyInterviewAnswer } from "../../api/interview";

const C = {
  bg: "#200F21",
  card: "rgba(20,8,21,0.82)",
  vivid: "#F638DC",
  border: "rgba(246,56,220,0.22)",
  text: "#FFFFFF",
  textMid: "rgba(255,255,255,0.78)",
  textDim: "rgba(255,255,255,0.52)",
};

const GLOBAL = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{min-height:100vh;background:#200F21;}
  ::-webkit-scrollbar{width:5px;height:5px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#5A3D5C;border-radius:4px;}
  .ci-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:10px;border:1px solid rgba(246,56,220,0.28);background:rgba(246,56,220,0.12);color:#fff;font-family:'Sora',sans-serif;font-size:12px;font-weight:700;cursor:pointer;}
  .ci-btn:disabled{opacity:0.45;cursor:not-allowed;}
  .ci-btn-solid{background:linear-gradient(135deg,#7d1b72,#c026d3,#F638DC);border:none;}
  .ci-input{width:100%;padding:12px 13px;border-radius:10px;border:1px solid rgba(246,56,220,0.30);background:rgba(15,0,16,0.75);color:#fff;font-family:'Sora',sans-serif;font-size:13px;outline:none;line-height:1.6;}
  .ci-input:focus{border-color:rgba(246,56,220,0.65);}
`;

export default function CandidateInterview() {
  const [searchParams] = useSearchParams();
  const interviewId = searchParams.get("interviewId") || searchParams.get("interview_id") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [question, setQuestion] = useState("");
  const [source, setSource] = useState("");
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [awaitingManualScore, setAwaitingManualScore] = useState(false);
  const [answer, setAnswer] = useState("");

  const loadQuestion = async (showLoader = false) => {
    if (!interviewId) {
      setLoading(false);
      setError("Interview ID is missing. Open from candidate profile Join Interview button.");
      return;
    }

    if (showLoader) {
      setLoading(true);
    }

    try {
      const response = await getMyInterviewQuestion(interviewId);
      setQuestion(String(response?.question || ""));
      setSource(String(response?.source || ""));
      setHasSubmittedAnswer(Boolean(response?.has_submitted_answer));
      setAwaitingManualScore(Boolean(response?.awaiting_manual_score));
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Failed to fetch current interview question.");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadQuestion(true);
  }, [interviewId]);

  useEffect(() => {
    if (!interviewId) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      loadQuestion(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [interviewId]);

  const handleSubmit = async () => {
    const text = String(answer || "").trim();
    if (!text) {
      setError("Please type your answer before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    setStatusMessage("");

    try {
      const response = await submitMyInterviewAnswer({ interviewId, answer: text });

      if (typeof response?.score === "number") {
        setStatusMessage(`Answer submitted. LLM score: ${response.score}`);
        setAwaitingManualScore(false);
      } else {
        setStatusMessage("Answer submitted. Waiting for recruiter manual score.");
        setAwaitingManualScore(true);
      }

      setHasSubmittedAnswer(true);
      setAnswer("");
      await loadQuestion(false);
    } catch (requestError) {
      setError(requestError.message || "Failed to submit answer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{GLOBAL}</style>
      <Header />
      <div style={{ minHeight: "calc(100vh - 68px)", background: C.bg, fontFamily: "'Sora',sans-serif", color: C.text, padding: "26px" }}>
        <div style={{ maxWidth: "880px", margin: "0 auto" }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "18px", padding: "20px 22px", boxShadow: "0 10px 40px rgba(0,0,0,0.46)" }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "rgba(246,56,220,0.85)", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "8px" }}>
              CANDIDATE INTERVIEW RESPONSE
            </div>
            <div style={{ fontSize: "12px", color: C.textDim, marginBottom: "14px" }}>Interview ID: {interviewId || "N/A"}</div>

            {error && <div style={{ marginBottom: "12px", fontSize: "12px", color: "#fecaca", background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.30)", borderRadius: "10px", padding: "9px 10px" }}>{error}</div>}
            {statusMessage && <div style={{ marginBottom: "12px", fontSize: "12px", color: "#86efac", background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.30)", borderRadius: "10px", padding: "9px 10px" }}>{statusMessage}</div>}

            <div style={{ border: "1px solid rgba(246,56,220,0.20)", borderRadius: "12px", padding: "12px", background: "rgba(12,0,14,0.60)", marginBottom: "12px" }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "rgba(246,56,220,0.8)", letterSpacing: "0.08em", marginBottom: "7px" }}>PUBLISHED QUESTION</div>
              {loading ? (
                <div style={{ fontSize: "12px", color: C.textMid }}>Loading question...</div>
              ) : (
                <>
                  <div style={{ fontSize: "13px", color: C.textMid, lineHeight: "1.7", marginBottom: "8px" }}>{question || "No question published yet. Recruiter will publish one shortly."}</div>
                  <div style={{ fontSize: "10px", color: C.textDim }}>
                    Source: {source === "llm" ? "LLM Follow-up" : source === "custom" ? "Recruiter Custom" : "N/A"}
                  </div>
                </>
              )}
            </div>

            <div style={{ border: "1px solid rgba(246,56,220,0.20)", borderRadius: "12px", padding: "12px", background: "rgba(12,0,14,0.60)" }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "rgba(246,56,220,0.8)", letterSpacing: "0.08em", marginBottom: "8px" }}>YOUR ANSWER</div>
              <textarea
                className="ci-input"
                rows={7}
                placeholder="Type your answer here..."
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                disabled={submitting || !question}
              />

              <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "space-between", marginTop: "10px", flexWrap: "wrap" }}>
                <div style={{ fontSize: "11px", color: awaitingManualScore ? "#fbbf24" : C.textDim }}>
                  {awaitingManualScore
                    ? "Latest answer is awaiting recruiter manual score."
                    : hasSubmittedAnswer
                      ? "Answer submitted. You can submit another answer if needed."
                      : "Submit your answer once ready."}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="ci-btn" onClick={() => loadQuestion(false)} disabled={submitting}>Refresh</button>
                  <button className="ci-btn ci-btn-solid" onClick={handleSubmit} disabled={submitting || !question}>{submitting ? "Submitting..." : "Submit Answer"}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

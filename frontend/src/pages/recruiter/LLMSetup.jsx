import RecruiterHeader from "../../components/RecruiterHeader";

const C = {
  bg: "#0F0020",
  card: "rgba(20,0,45,0.90)",
  vivid: "#A855F7",
  lite: "#C084FC",
  border: "rgba(168,85,247,0.18)",
  text: "#FFFFFF",
  textMid: "rgba(255,255,255,0.78)",
  textDim: "rgba(255,255,255,0.52)",
};

const GLOBAL = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{min-height:100vh;background:#0F0020;}
  @keyframes rBF{0%{background-position:0% 50%}100%{background-position:300% 50%}}
  @keyframes rPulse{0%,100%{opacity:1}50%{opacity:0.35}}
  .llm-setup-link{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:10px;border:1px solid rgba(168,85,247,0.30);background:rgba(168,85,247,0.10);color:#fff;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;text-decoration:none;transition:all 0.2s;}
  .llm-setup-link:hover{background:rgba(168,85,247,0.18);border-color:#A855F7;transform:translateY(-1px);}
`;

export default function LLMSetup() {
  return (
    <>
      <style>{GLOBAL}</style>
      <RecruiterHeader />
      <div style={{ minHeight: "calc(100vh - 68px)", background: C.bg, fontFamily: "'Sora',sans-serif", padding: "34px 24px" }}>
        <div style={{ maxWidth: "920px", margin: "0 auto" }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "20px", padding: "24px 26px", boxShadow: "0 10px 42px rgba(0,0,0,0.52)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg,transparent,${C.vivid},${C.lite},transparent)`, backgroundSize: "300% 100%", animation: "rBF 3s linear infinite" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f87171", boxShadow: "0 0 10px #f87171", animation: "rPulse 2s ease-in-out infinite" }} />
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "11px", color: "rgba(248,113,113,0.95)", letterSpacing: "0.1em", fontWeight: 700 }}>
                LLM SERVICE NOT AVAILABLE
              </div>
            </div>

            <h1 style={{ fontSize: "26px", color: C.text, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "8px" }}>
              Interview AI session init failed
            </h1>
            <p style={{ color: C.textMid, fontSize: "13px", lineHeight: "1.8", marginBottom: "18px" }}>
              Your backend calls the AI service at <span style={{ color: C.lite }}>http://localhost:8080/api/verify</span>. If the RAG server is not running, or running in the wrong folder, interview start will fail.
            </p>

            <div style={{ background: "rgba(15,0,32,0.72)", border: "1px solid rgba(168,85,247,0.16)", borderRadius: "12px", padding: "14px 16px", marginBottom: "14px" }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "rgba(168,85,247,0.85)", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "8px" }}>
                QUICK CHECKLIST
              </div>
              <ul style={{ color: C.textMid, fontSize: "12px", lineHeight: "1.8", paddingLeft: "18px" }}>
                <li>Open terminal in project <span style={{ color: C.lite }}>rag/</span> folder.</li>
                <li>Run <span style={{ color: C.lite }}>python -m uvicorn main:app --host 127.0.0.1 --port 8080</span>.</li>
                <li>Open <span style={{ color: C.lite }}>http://127.0.0.1:8080/docs</span> and verify `/api/verify/init` exists.</li>
                <li>Retry interview start from recruiter job page.</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <a className="llm-setup-link" href="http://127.0.0.1:8080/docs" target="_blank" rel="noreferrer">Open LLM Docs ↗</a>
              <a className="llm-setup-link" href="/recruiter/profile">Back to Recruiter Profile</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

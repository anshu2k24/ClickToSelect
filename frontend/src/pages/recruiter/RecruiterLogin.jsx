// src/pages/recruiter/RecruiterLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RecruiterHeader from "../../components/RecruiterHeader";
import { loginUser } from "../../api/auth";
import { saveStoredSession } from "../../api/client";

const C = {
  bg:"#0F0020", dark:"#1A0033", mid:"#2D0059", vivid:"#A855F7", lite:"#C084FC",
  card:"rgba(20,0,45,0.88)", border:"rgba(168,85,247,0.18)",
  text:"#FFFFFF", textDim:"rgba(255,255,255,0.52)",
};

const GLOBAL = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{min-height:100vh;background:#0F0020;}
  ::placeholder{color:rgba(255,255,255,0.20)!important;font-family:'Sora',sans-serif;font-size:13px;}
  ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#0F0020;}::-webkit-scrollbar-thumb{background:#2D0059;border-radius:4px;}
  @keyframes rlFU{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes rlBF{0%{background-position:0% 50%}100%{background-position:300% 50%}}
  @keyframes rlGP{0%,100%{background-position:0% 60%}50%{background-position:100% 40%}}
  @keyframes rlSweep{0%{left:-120%}100%{left:160%}}
  @keyframes rlSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  .rl-input{
    width:100%;padding:12px 15px;border-radius:10px;
    border:1.5px solid rgba(168,85,247,0.22);
    background:rgba(15,0,32,0.70);
    color:#fff;font-family:'Sora',sans-serif;font-size:14px;font-weight:500;outline:none;
    caret-color:#A855F7;transition:border-color 0.2s,box-shadow 0.2s;
  }
  .rl-input:focus{border-color:rgba(168,85,247,0.60);box-shadow:0 0 0 3px rgba(168,85,247,0.12);}
  .rl-btn{
    display:inline-flex;align-items:center;justify-content:center;gap:10px;
    width:100%;padding:14px;border-radius:12px;border:none;
    background:linear-gradient(135deg,#4C1D95,#7C3AED,#A855F7);
    background-size:200% 200%;animation:rlGP 3s ease infinite;
    color:#fff;font-family:'Sora',sans-serif;font-size:15px;font-weight:700;
    cursor:pointer;position:relative;overflow:hidden;
    box-shadow:0 4px 24px rgba(168,85,247,0.40);transition:transform 0.2s,box-shadow 0.2s;
  }
  .rl-btn::before{content:'';position:absolute;top:0;left:-120%;width:50%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,0.20),transparent);animation:rlSweep 2.5s ease-in-out infinite;pointer-events:none;}
  .rl-btn:hover{transform:translateY(-2px);box-shadow:0 8px 36px rgba(168,85,247,0.55);}
  .rl-btn:disabled{opacity:0.45;cursor:not-allowed;transform:none;animation:none;}
`;

export default function RecruiterLogin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await loginUser({ email, password });
      saveStoredSession({
        accessToken: res.access_token,
        tokenType: res.token_type,
        role: "recruiter",
        email,
        name: "",
      });
      navigate("/recruiter/profile");
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{GLOBAL}</style>
      <RecruiterHeader />
      <div style={{minHeight:"calc(100vh - 68px)",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",fontFamily:"'Sora',sans-serif",position:"relative",overflow:"hidden"}}>
        {/* BG glow */}
        <div style={{position:"fixed",top:"-200px",left:"50%",transform:"translateX(-50%)",width:"700px",height:"700px",borderRadius:"50%",background:"radial-gradient(circle,rgba(109,40,217,0.15) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"fixed",bottom:"-150px",right:"-100px",width:"400px",height:"400px",borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.09) 0%,transparent 70%)",pointerEvents:"none"}}/>

        <div style={{maxWidth:"420px",width:"100%",position:"relative",zIndex:1,animation:"rlFU 0.5s ease both"}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"24px",padding:"44px 40px",backdropFilter:"blur(24px)",boxShadow:"0 16px 80px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.04)",position:"relative",overflow:"hidden"}}>
            {/* shimmer top */}
            <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,transparent,#4C1D95,#7C3AED,${C.vivid},${C.lite},transparent)`,backgroundSize:"300% 100%",animation:"rlBF 3s linear infinite"}}/>
            {/* dot grid */}
            <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(168,85,247,0.04) 1px,transparent 1px)",backgroundSize:"36px 36px",pointerEvents:"none"}}/>

            {/* Header */}
            <div style={{textAlign:"center",marginBottom:"32px",position:"relative",zIndex:1}}>
              <div style={{width:62,height:62,borderRadius:"18px",margin:"0 auto 18px",background:`linear-gradient(135deg,${C.dark},${C.vivid})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",boxShadow:`0 0 28px rgba(168,85,247,0.45)`,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:"-80%",width:"55%",height:"100%",background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)",animation:"rlSweep 2.5s ease-in-out infinite"}}/>
                🏢
              </div>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(168,85,247,0.80)`,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:"8px"}}>RECRUITER PORTAL</div>
              <h1 style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"26px",color:"#fff",letterSpacing:"-0.04em",marginBottom:"6px"}}>Welcome Back</h1>
              <p style={{fontSize:"13px",color:"rgba(255,255,255,0.42)",lineHeight:"1.65"}}>Sign in to manage your jobs and candidates</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"16px",position:"relative",zIndex:1}}>
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",fontWeight:"700",letterSpacing:"0.12em",textTransform:"uppercase",color:`rgba(168,85,247,0.75)`}}>Email Address</label>
                <input className="rl-input" type="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",fontWeight:"700",letterSpacing:"0.12em",textTransform:"uppercase",color:`rgba(168,85,247,0.75)`}}>Password</label>
                <input className="rl-input" type="password" placeholder="Your password" value={password} onChange={e=>setPassword(e.target.value)} required/>
              </div>

              {error && (
                <div style={{background:"rgba(255,60,60,0.10)",border:"1px solid rgba(255,60,60,0.30)",borderRadius:"8px",padding:"10px 14px",fontFamily:"'Sora',sans-serif",fontSize:"13px",color:"#ff8080",lineHeight:"1.5"}}>
                  {error}
                </div>
              )}

              <button type="submit" className="rl-btn" disabled={loading}>
                {loading ? (
                  <>
                    <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.30)",borderTopColor:"#fff",animation:"rlSpin 0.7s linear infinite"}}/>
                    Signing In…
                  </>
                ) : "Sign In →"}
              </button>
            </form>

            {/* Footer links */}
            <div style={{marginTop:"24px",textAlign:"center",position:"relative",zIndex:1}}>
              <span style={{fontFamily:"'Sora',sans-serif",fontSize:"13px",color:"rgba(255,255,255,0.38)"}}>New recruiter?{" "}</span>
              <span
                onClick={() => navigate("/recruiter/register")}
                style={{fontFamily:"'Sora',sans-serif",fontSize:"13px",color:C.vivid,fontWeight:"600",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:"3px"}}
              >Create account →</span>
            </div>

            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",marginTop:"14px"}}>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(168,85,247,0.52)`,letterSpacing:"0.08em"}}>🔒 256-BIT ENCRYPTED · GDPR COMPLIANT · SOC-2</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

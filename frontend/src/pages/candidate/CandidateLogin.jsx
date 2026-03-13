// src/pages/candidate/CandidateLogin.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { loginUser } from "../../api/auth";
import { saveStoredSession } from "../../api/client";

const C = {
  bg: "#200F21", dark: "#382039", mid: "#5A3D5C", vivid: "#F638DC",
  text: "#FFFFFF", textDim: "rgba(255,255,255,0.52)",
};

const GLOBAL = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{min-height:100vh;background:#200F21;}
  ::placeholder{color:rgba(255,255,255,0.20)!important;font-family:'Sora',sans-serif;font-size:13px;}
  ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#200F21;}::-webkit-scrollbar-thumb{background:#5A3D5C;border-radius:4px;}
  @keyframes clFadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
  @keyframes clSweep{0%{left:-120%}100%{left:160%}}
  @keyframes clBF{0%{background-position:0% 50%}100%{background-position:300% 50%}}
  @keyframes clGP{0%,100%{background-position:0% 60%}50%{background-position:100% 40%}}
  @keyframes clFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-18px) scale(1.02)}}
  @keyframes clSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  .cl-input{
    width:100%;padding:12px 15px;border-radius:10px;
    border:1.5px solid rgba(246,56,220,0.18);
    background:rgba(32,15,33,0.70);
    color:#fff;font-family:'Sora',sans-serif;font-size:14px;outline:none;
    caret-color:#F638DC;transition:border-color 0.2s,box-shadow 0.2s;
  }
  .cl-input:focus{border-color:rgba(246,56,220,0.60);box-shadow:0 0 0 3px rgba(246,56,220,0.12);}
  .cl-btn{
    width:100%;padding:14px;border-radius:10px;border:none;
    background:linear-gradient(135deg,#382039,#5A3D5C,#F638DC);
    background-size:200% 200%;animation:clGP 3s ease infinite;
    color:#fff;font-family:'Sora',sans-serif;font-size:15px;font-weight:700;
    cursor:pointer;position:relative;overflow:hidden;
    box-shadow:0 4px 24px rgba(246,56,220,0.40);transition:transform 0.2s,box-shadow 0.2s;
  }
  .cl-btn::before{content:'';position:absolute;top:0;left:-120%;width:50%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,0.20),transparent);animation:clSweep 2.5s ease-in-out infinite;pointer-events:none;}
  .cl-btn:hover{transform:translateY(-2px);box-shadow:0 8px 36px rgba(246,56,220,0.55);}
  .cl-btn:disabled{opacity:0.45;cursor:not-allowed;transform:none;animation:none;}
`;

function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, W, H;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const N = 28;
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.24, vy: (Math.random()-0.5)*0.24,
      r: Math.random()*2+1, pulse: Math.random()*Math.PI*2,
    }));
    const DIST = 140;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      nodes.forEach(n => { n.x+=n.vx; n.y+=n.vy; n.pulse+=0.018; if(n.x<0||n.x>W)n.vx*=-1; if(n.y<0||n.y>H)n.vy*=-1; });
      for(let i=0;i<N;i++) for(let j=i+1;j<N;j++) {
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<DIST){ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.strokeStyle=`rgba(246,56,220,${(1-d/DIST)*0.14})`;ctx.lineWidth=0.7;ctx.stroke();}
      }
      nodes.forEach(n => {
        const p=0.5+0.5*Math.sin(n.pulse);
        ctx.beginPath();ctx.arc(n.x,n.y,n.r+p,0,Math.PI*2);
        ctx.fillStyle=`rgba(246,56,220,${0.18+p*0.28})`;ctx.shadowColor="#F638DC";ctx.shadowBlur=5+p*7;ctx.fill();ctx.shadowBlur=0;
      });
      raf=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  }, []);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",opacity:0.42}}/>;
}

export default function CandidateLogin() {
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
        role: "candidate",
        email,
        name: "",
      });
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{GLOBAL}</style>
      <Header />
      <div style={{minHeight:"calc(100vh - 68px)",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 24px",fontFamily:"'Sora',sans-serif",position:"relative",overflow:"hidden"}}>
        <NeuralCanvas />
        {/* ambient blobs */}
        <div style={{position:"fixed",top:"-200px",right:"-180px",width:"550px",height:"550px",borderRadius:"50%",background:"radial-gradient(circle,rgba(90,61,92,0.32) 0%,transparent 70%)",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"fixed",bottom:"-150px",left:"-150px",width:"480px",height:"480px",borderRadius:"50%",background:"radial-gradient(circle,rgba(246,56,220,0.09) 0%,transparent 70%)",animation:"clFloat 20s ease-in-out infinite",pointerEvents:"none",zIndex:0}}/>

        <div style={{maxWidth:"420px",width:"100%",position:"relative",zIndex:2,animation:"clFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both"}}>
          {/* Card */}
          <div style={{background:"rgba(20,8,21,0.88)",border:"1px solid rgba(246,56,220,0.20)",borderRadius:"24px",padding:"44px 40px",backdropFilter:"blur(28px)",boxShadow:"0 16px 80px rgba(0,0,0,0.70),inset 0 1px 0 rgba(255,255,255,0.04)",position:"relative",overflow:"hidden"}}>
            {/* shimmer top bar */}
            <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,transparent,#382039,#5A3D5C,#F638DC,#5A3D5C,transparent)`,backgroundSize:"300% 100%",animation:"clBF 3s linear infinite"}}/>
            {/* grid texture */}
            <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(246,56,220,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(246,56,220,0.022) 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none"}}/>

            {/* Header */}
            <div style={{textAlign:"center",marginBottom:"32px",position:"relative",zIndex:1}}>
              <div style={{width:62,height:62,borderRadius:"16px",margin:"0 auto 18px",background:"linear-gradient(135deg,#382039,#F638DC)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",boxShadow:"0 0 28px rgba(246,56,220,0.50)",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:"-80%",width:"55%",height:"100%",background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)",animation:"clSweep 2.5s ease-in-out infinite"}}/>
                🤖
              </div>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:"rgba(246,56,220,0.80)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:"8px"}}>CANDIDATE PORTAL</div>
              <h1 style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"26px",color:"#fff",letterSpacing:"-0.04em",marginBottom:"6px"}}>Welcome Back</h1>
              <p style={{fontSize:"13px",color:"rgba(255,255,255,0.42)",lineHeight:"1.65"}}>Sign in to access your AI interview dashboard</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"16px",position:"relative",zIndex:1}}>
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",fontWeight:"700",letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(246,56,220,0.70)"}}>Email Address</label>
                <input className="cl-input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <label style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",fontWeight:"700",letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(246,56,220,0.70)"}}>Password</label>
                <input className="cl-input" type="password" placeholder="Your password" value={password} onChange={e=>setPassword(e.target.value)} required/>
              </div>

              {error && (
                <div style={{background:"rgba(255,60,60,0.10)",border:"1px solid rgba(255,60,60,0.30)",borderRadius:"8px",padding:"10px 14px",fontFamily:"'Sora',sans-serif",fontSize:"13px",color:"#ff8080",lineHeight:"1.5"}}>
                  {error}
                </div>
              )}

              <button type="submit" className="cl-btn" disabled={loading}>
                {loading ? (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}>
                    <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.30)",borderTopColor:"#fff",animation:"clSpin 0.7s linear infinite"}}/>
                    Signing In…
                  </div>
                ) : "Sign In →"}
              </button>
            </form>

            {/* Footer links */}
            <div style={{marginTop:"24px",textAlign:"center",position:"relative",zIndex:1}}>
              <span style={{fontFamily:"'Sora',sans-serif",fontSize:"13px",color:"rgba(255,255,255,0.38)"}}>New candidate?{" "}</span>
              <span
                onClick={() => navigate("/register")}
                style={{fontFamily:"'Sora',sans-serif",fontSize:"13px",color:"#F638DC",fontWeight:"600",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:"3px"}}
              >Create account →</span>
            </div>

            <div style={{marginTop:"14px",textAlign:"center",position:"relative",zIndex:1}}>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:"rgba(246,56,220,0.45)",letterSpacing:"0.08em"}}>🔒 ENCRYPTED · SECURE · GDPR COMPLIANT</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

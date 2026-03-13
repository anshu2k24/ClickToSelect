// src/pages/recruiter/RecruiterRegister.jsx — DARK MODE
import { useState } from "react";
import RecruiterHeader from "../../components/RecruiterHeader";

const C = {
  bg:"#0F0020", dark:"#1A0033", mid:"#2D0059", vivid:"#A855F7", lite:"#C084FC",
  card:"rgba(20,0,45,0.88)", border:"rgba(168,85,247,0.18)", inputBg:"rgba(15,0,32,0.70)",
  text:"#FFFFFF", textMid:"rgba(255,255,255,0.78)", textDim:"rgba(255,255,255,0.52)",
};

const GLOBAL=`
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{min-height:100vh;background:#0F0020;}
  ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:#0F0020;} ::-webkit-scrollbar-thumb{background:#2D0059;border-radius:4px;}
  ::placeholder{color:rgba(255,255,255,0.20)!important;font-family:'Sora',sans-serif;font-size:13px;}
  @keyframes rFU{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes rBF{0%{background-position:0% 50%}100%{background-position:300% 50%}}
  @keyframes rGP{0%,100%{background-position:0% 60%}50%{background-position:100% 40%}}
  @keyframes rSweep{0%{left:-120%}100%{left:160%}}
  @keyframes rPulse{0%,100%{opacity:1}50%{opacity:0.25}}
  @keyframes rSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

  .rr-input{
    width:100%;padding:12px 15px;border-radius:10px;
    border:1.5px solid rgba(168,85,247,0.22);
    background:rgba(15,0,32,0.70);
    color:#fff;font-family:'Sora',sans-serif;font-size:13px;font-weight:500;outline:none;
    caret-color:#A855F7;transition:border-color 0.2s,box-shadow 0.2s;
  }
  .rr-input:focus{border-color:rgba(168,85,247,0.60);box-shadow:0 0 0 3px rgba(168,85,247,0.12);}
  .rr-textarea{
    width:100%;padding:12px 15px;border-radius:10px;resize:vertical;min-height:90px;
    border:1.5px solid rgba(168,85,247,0.22);
    background:rgba(15,0,32,0.70);
    color:#fff;font-family:'Sora',sans-serif;font-size:13px;font-weight:500;outline:none;
    caret-color:#A855F7;transition:border-color 0.2s,box-shadow 0.2s;line-height:1.65;
  }
  .rr-textarea:focus{border-color:rgba(168,85,247,0.60);box-shadow:0 0 0 3px rgba(168,85,247,0.12);}
  .rr-submit{
    display:inline-flex;align-items:center;justify-content:center;gap:10px;
    width:100%;padding:14px;border-radius:12px;border:none;
    background:linear-gradient(135deg,#4C1D95,#7C3AED,#A855F7);
    background-size:200% 200%;animation:rGP 3s ease infinite;
    color:#fff;font-family:'Sora',sans-serif;font-size:15px;font-weight:700;
    cursor:pointer;position:relative;overflow:hidden;
    box-shadow:0 4px 24px rgba(168,85,247,0.40);transition:transform 0.2s,box-shadow 0.2s;
  }
  .rr-submit::before{content:'';position:absolute;top:0;left:-120%;width:50%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,0.20),transparent);animation:rSweep 2.5s ease-in-out infinite;pointer-events:none;}
  .rr-submit:hover{transform:translateY(-2px);box-shadow:0 8px 36px rgba(168,85,247,0.55);}
  .rr-submit:disabled{opacity:0.45;cursor:not-allowed;transform:none;animation:none;}
`;

const LL={fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(168,85,247,0.75)`,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:"700"};

function FloatLabel({label,required,children}){
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
      <label style={LL}>{label}{required&&<span style={{color:C.vivid,marginLeft:3}}>*</span>}</label>
      {children}
    </div>
  );
}

export default function RecruiterRegister() {
  const [form,setForm]=useState({company_name:"",company_description:"",company_website:"",location:""});
  const [submitting,setSubmitting]=useState(false);
  const [done,setDone]=useState(false);
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const valid=form.company_name.trim()&&form.location.trim();

  const handleSubmit=async e=>{
    e.preventDefault(); if(!valid||submitting) return;
    setSubmitting(true);
    await new Promise(r=>setTimeout(r,1600));
    setSubmitting(false); setDone(true);
  };

  if (done) return (
    <>
      <style>{GLOBAL}</style><RecruiterHeader/>
      <div style={{minHeight:"calc(100vh - 68px)",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora',sans-serif"}}>
        <div style={{maxWidth:"480px",width:"100%",margin:"0 24px",background:C.card,border:`1px solid rgba(168,85,247,0.20)`,borderRadius:"24px",padding:"52px 44px",textAlign:"center",backdropFilter:"blur(24px)",boxShadow:"0 16px 80px rgba(0,0,0,0.7)",animation:"rFU 0.5s ease both",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,transparent,${C.vivid},${C.lite},transparent)`,backgroundSize:"200% 100%",animation:"rBF 3s linear infinite"}}/>
          <div style={{width:80,height:80,borderRadius:"50%",margin:"0 auto 20px",background:"linear-gradient(135deg,#6D28D9,#A855F7)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 0 16px rgba(168,85,247,0.07),0 0 0 32px rgba(168,85,247,0.03)",fontSize:"36px"}}>✓</div>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"24px",color:"#fff",marginBottom:"10px"}}>Account Created!</h2>
          <p style={{fontSize:"14px",color:C.textMid,lineHeight:"1.75",marginBottom:"28px",fontWeight:"500"}}>Welcome to <strong style={{color:C.lite}}>{form.company_name||"your company"}</strong>. Your recruiter profile is ready.</p>
          <a href="/recruiter/profile" style={{display:"inline-flex",alignItems:"center",gap:"8px",padding:"12px 28px",borderRadius:"10px",textDecoration:"none",background:`linear-gradient(135deg,${C.mid},${C.vivid})`,color:"#fff",fontFamily:"'Sora',sans-serif",fontWeight:"700",fontSize:"14px",boxShadow:`0 4px 20px rgba(168,85,247,0.38)`,transition:"transform 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}>Go to Dashboard →</a>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{GLOBAL}</style><RecruiterHeader/>
      <div style={{minHeight:"calc(100vh - 68px)",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora',sans-serif",padding:"40px 24px"}}>
        {/* BG glow */}
        <div style={{position:"fixed",top:"-200px",left:"50%",transform:"translateX(-50%)",width:"700px",height:"700px",borderRadius:"50%",background:`radial-gradient(circle,rgba(109,40,217,0.15) 0%,transparent 70%)`,pointerEvents:"none"}}/>

        <div style={{maxWidth:"580px",width:"100%",animation:"rFU 0.5s ease both",position:"relative",zIndex:1}}>
          {/* Trust badges */}
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"20px",justifyContent:"center"}}>
            {["🔐 Secure Onboarding","🏢 Company Verified","⚡ AI-Powered Hiring"].map(b=>(
              <div key={b} style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 12px",borderRadius:"100px",background:`rgba(168,85,247,0.10)`,border:`1px solid rgba(168,85,247,0.22)`,fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(168,85,247,0.85)`,letterSpacing:"0.06em"}}>{b}</div>
            ))}
          </div>

          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"24px",padding:"40px 40px 36px",backdropFilter:"blur(24px)",boxShadow:"0 16px 80px rgba(0,0,0,0.65),inset 0 1px 0 rgba(255,255,255,0.04)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:"2.5px",background:`linear-gradient(90deg,transparent,${C.dark},${C.mid},${C.vivid},${C.mid},transparent)`,backgroundSize:"300% 100%",animation:"rBF 3s linear infinite"}}/>
            <div style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(rgba(168,85,247,0.04) 1px,transparent 1px)`,backgroundSize:"36px 36px",pointerEvents:"none"}}/>

            {/* Header */}
            <div style={{textAlign:"center",marginBottom:"30px",position:"relative",zIndex:1}}>
              <div style={{width:64,height:64,borderRadius:"18px",margin:"0 auto 18px",background:`linear-gradient(135deg,${C.dark},${C.vivid})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",boxShadow:`0 0 28px rgba(168,85,247,0.45)`,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:"-80%",width:"55%",height:"100%",background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)",animation:"rSweep 2.5s ease-in-out infinite"}}/>
                🏢
              </div>
              <div style={{...LL,color:`rgba(168,85,247,0.80)`,letterSpacing:"0.16em",marginBottom:"8px"}}>RECRUITER REGISTRATION</div>
              <h1 style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"clamp(22px,3.5vw,28px)",color:"#fff",letterSpacing:"-0.04em",marginBottom:"8px"}}>Create Your Company Profile</h1>
              <p style={{fontSize:"13px",color:C.textMid,lineHeight:"1.70",fontWeight:"500"}}>Set up your recruiter account to start posting jobs and finding top talent through AI-powered screening.</p>
            </div>

            <form onSubmit={handleSubmit} style={{position:"relative",zIndex:1}}>
              <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
                <FloatLabel label="Company Name" required>
                  <input className="rr-input" placeholder="e.g. Razorpay Technologies" value={form.company_name} onChange={f("company_name")} required/>
                </FloatLabel>
                <FloatLabel label="Company Description">
                  <textarea className="rr-textarea" placeholder="Brief description of your company, mission, and what makes it unique..." value={form.company_description} onChange={f("company_description")}/>
                </FloatLabel>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
                  <FloatLabel label="Company Website">
                    <input className="rr-input" type="url" placeholder="https://yourcompany.com" value={form.company_website} onChange={f("company_website")}/>
                  </FloatLabel>
                  <FloatLabel label="Location" required>
                    <input className="rr-input" placeholder="e.g. Bengaluru / Remote" value={form.location} onChange={f("location")} required/>
                  </FloatLabel>
                </div>

                {/* Live preview */}
                {form.company_name&&(
                  <div style={{background:`rgba(168,85,247,0.07)`,border:`1px solid rgba(168,85,247,0.18)`,borderRadius:"12px",padding:"14px 16px"}}>
                    <div style={{...LL,marginBottom:"8px"}}>👁 LIVE PREVIEW</div>
                    <div style={{fontFamily:"'Sora',sans-serif",fontWeight:"700",fontSize:"15px",color:"#fff",marginBottom:"3px"}}>{form.company_name}</div>
                    {form.location&&<div style={{fontSize:"12px",color:C.textMid,fontWeight:"500"}}>📍 {form.location}</div>}
                    {form.company_website&&<div style={{fontSize:"11px",color:`rgba(168,85,247,0.80)`,marginTop:"3px",fontFamily:"'Space Mono',monospace"}}>🌐 {form.company_website}</div>}
                  </div>
                )}

                <button type="submit" className="rr-submit" disabled={!valid||submitting}>
                  {submitting?<><div style={{width:16,height:16,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.30)",borderTopColor:"#fff",animation:"rSpin 0.7s linear infinite"}}/>Creating Account…</>:<>Create Recruiter Account →</>}
                </button>
              </div>
            </form>

            {/* Security bar */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",marginTop:"16px"}}>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(168,85,247,0.52)`,letterSpacing:"0.08em"}}>🔒 256-BIT ENCRYPTED · GDPR COMPLIANT · SOC-2</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// src/pages/recruiter/JobRole.jsx — DARK MODE
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import RecruiterHeader from "../../components/RecruiterHeader";

const C={bg:"#0F0020",card:"rgba(20,0,45,0.90)",vivid:"#A855F7",lite:"#C084FC",dark:"#1A0033",border:"rgba(168,85,247,0.18)",text:"#FFFFFF",textMid:"rgba(255,255,255,0.78)",textDim:"rgba(255,255,255,0.52)"};
const LL={fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(168,85,247,0.80)`,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:"700"};

const MOCK_CANDIDATES=[
  {id:1,name:"Arjun Mehta",  email:"arjun@example.com", score:92,skills:["React","Node.js","TypeScript"],exp:"3 yrs",location:"Bengaluru",avatar:"AM",mailStatus:"idle"},
  {id:2,name:"Priya Nair",   email:"priya@example.com", score:88,skills:["Python","ML","FastAPI"],       exp:"4 yrs",location:"Remote",   avatar:"PN",mailStatus:"idle"},
  {id:3,name:"Rohan Sharma", email:"rohan@example.com", score:85,skills:["Java","Spring","AWS"],         exp:"2 yrs",location:"Pune",     avatar:"RS",mailStatus:"idle"},
  {id:4,name:"Sneha Pillai", email:"sneha@example.com", score:81,skills:["Vue","Laravel","MySQL"],       exp:"3 yrs",location:"Chennai",  avatar:"SP",mailStatus:"idle"},
  {id:5,name:"Dev Agarwal",  email:"dev@example.com",   score:79,skills:["Go","Docker","Kubernetes"],    exp:"5 yrs",location:"Hyderabad",avatar:"DA",mailStatus:"idle"},
  {id:6,name:"Kavya Reddy",  email:"kavya@example.com", score:76,skills:["Android","Kotlin","Firebase"], exp:"2 yrs",location:"Bengaluru",avatar:"KR",mailStatus:"idle"},
];

const GLOBAL=`
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{min-height:100vh;background:#0F0020;}
  ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:#0F0020;} ::-webkit-scrollbar-thumb{background:#2D0059;border-radius:4px;}
  @keyframes rFU{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes rBF{0%{background-position:0% 50%}100%{background-position:300% 50%}}
  @keyframes rGP{0%,100%{background-position:0% 60%}50%{background-position:100% 40%}}
  @keyframes rSweep{0%{left:-120%}100%{left:160%}}
  @keyframes rPulse{0%,100%{opacity:1}50%{opacity:0.25}}
  @keyframes rSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes rScore{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}
  .jd-back-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;border-radius:9px;border:1.5px solid rgba(168,85,247,0.30);background:rgba(168,85,247,0.08);color:#C084FC;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;transition:all 0.2s;}
  .jd-back-btn:hover{background:rgba(168,85,247,0.15);border-color:#A855F7;transform:translateY(-1px);}
  .send-mail-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;border:none;background:linear-gradient(135deg,#4C1D95,#7C3AED,#A855F7);background-size:200% 200%;animation:rGP 3s ease infinite;color:#fff;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 2px 12px rgba(168,85,247,0.35);transition:transform 0.15s,box-shadow 0.2s;position:relative;overflow:hidden;}
  .send-mail-btn::before{content:'';position:absolute;top:0;left:-100%;width:55%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,0.22),transparent);animation:rSweep 2.4s ease-in-out infinite;pointer-events:none;}
  .send-mail-btn:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(168,85,247,0.50);}
  .send-mail-btn:disabled{opacity:0.45;cursor:not-allowed;transform:none;animation:none;}
  .start-int-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;border:none;background:linear-gradient(135deg,#14532d,#16a34a);color:#fff;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 2px 12px rgba(22,163,74,0.30);transition:transform 0.15s,box-shadow 0.2s;}
  .start-int-btn:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(22,163,74,0.45);}
  .awaited-badge{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;border:1px solid rgba(234,88,12,0.32);background:rgba(234,88,12,0.10);color:rgba(253,186,116,0.95);font-family:'Space Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.06em;}
`;

function CandidateCard({candidate,onSendMail}){
  const{mailStatus,name,email,score,skills,exp,location,avatar}=candidate;
  const isSending=mailStatus==="sending",isAwaited=mailStatus==="awaited",isAccepted=mailStatus==="accepted";
  const sc=score>=85?"#4ade80":score>=70?"#fbbf24":"#f87171";
  const sb=score>=85?"rgba(74,222,128,0.10)":score>=70?"rgba(251,191,36,0.10)":"rgba(248,113,113,0.10)";
  const sbr=score>=85?"rgba(74,222,128,0.30)":score>=70?"rgba(251,191,36,0.30)":"rgba(248,113,113,0.30)";
  return(
    <div style={{background:"rgba(25,0,55,0.80)",border:`1px solid rgba(168,85,247,0.18)`,borderRadius:"14px",padding:"18px 20px",boxShadow:"0 4px 20px rgba(0,0,0,0.45)",transition:"transform 0.2s,box-shadow 0.2s",position:"relative",overflow:"hidden"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 10px 32px rgba(168,85,247,0.18)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.45)";}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:"2.5px",background:`linear-gradient(90deg,transparent,${C.vivid},${C.lite},transparent)`,backgroundSize:"200% 100%",animation:"rBF 3s linear infinite"}}/>
      <div style={{display:"flex",alignItems:"flex-start",gap:"12px",marginBottom:"10px"}}>
        <div style={{width:42,height:42,borderRadius:"12px",flexShrink:0,background:`linear-gradient(135deg,${C.dark},${C.vivid})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"13px",color:"#fff",boxShadow:`0 4px 12px rgba(168,85,247,0.30)`}}>{avatar}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"'Sora',sans-serif",fontWeight:"700",fontSize:"14px",color:"#fff",letterSpacing:"-0.02em",marginBottom:"2px"}}>{name}</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:C.textDim,letterSpacing:"0.04em"}}>{email}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"6px 10px",borderRadius:"8px",background:sb,border:`1px solid ${sbr}`,animation:"rScore 0.5s ease"}}>
          <span style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"17px",color:sc,lineHeight:1}}>{score}</span>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:"8px",color:sc,opacity:.85,letterSpacing:"0.08em",fontWeight:"700"}}>AI SCORE</span>
        </div>
      </div>
      <div style={{height:"3px",borderRadius:"2px",background:"rgba(255,255,255,0.06)",overflow:"hidden",marginBottom:"10px"}}>
        <div style={{height:"100%",width:`${score}%`,background:sc,borderRadius:"2px",transition:"width 1s ease"}}/>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"12px"}}>
        {[["📍",location],["🕐",exp]].map(m=><div key={m[1]} style={{padding:"3px 8px",borderRadius:"5px",background:`rgba(168,85,247,0.09)`,border:`1px solid rgba(168,85,247,0.18)`,fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(168,85,247,0.88)`,letterSpacing:"0.04em",fontWeight:"700"}}>{m[0]} {m[1]}</div>)}
        {skills.map(s=><div key={s} style={{padding:"3px 8px",borderRadius:"5px",background:"rgba(255,255,255,0.06)",border:`1px solid rgba(255,255,255,0.10)`,fontFamily:"'Sora',sans-serif",fontSize:"10px",color:C.textMid,fontWeight:"500"}}>{s}</div>)}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
        {mailStatus==="idle"   &&<button className="send-mail-btn" onClick={()=>onSendMail(candidate.id)}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 2.5L6 6.5L11 2.5M1 2.5H11V9.5H1V2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>Send Invite Mail</button>}
        {isSending             &&<button className="send-mail-btn" disabled><div style={{width:10,height:10,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"rSpin 0.7s linear infinite"}}/>Sending…</button>}
        {isAwaited             &&<><div className="awaited-badge"><div style={{width:6,height:6,borderRadius:"50%",background:"rgba(253,186,116,0.80)",animation:"rPulse 1.5s ease-in-out infinite"}}/>Response Awaited</div><span style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:C.textDim,letterSpacing:"0.06em",fontWeight:"700"}}>AWAITING ACCEPTANCE</span></>}
        {isAccepted            &&<><button className="start-int-btn" onClick={()=>window.open("/skill-verify","_blank")}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polygon points="3,1 11,6 3,11" fill="currentColor"/></svg>Start Interview</button><div style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 10px",borderRadius:"6px",background:"rgba(22,163,74,0.12)",border:"1px solid rgba(22,163,74,0.30)",fontFamily:"'Space Mono',monospace",fontSize:"9px",color:"#4ade80",letterSpacing:"0.08em",fontWeight:"700"}}>✓ ACCEPTED</div></>}
      </div>
    </div>
  );
}

export default function JobRole(){
  const location=useLocation(),navigate=useNavigate(),{id}=useParams();
  const job=location.state?.job||(()=>{try{return JSON.parse(localStorage.getItem("r_jobs")||"[]").find(j=>String(j.id)===String(id))||null;}catch{return null;}})();
  const[candidates,setCandidates]=useState(MOCK_CANDIDATES);
  const[sortBy,setSortBy]=useState("score");

  const handleSendMail=async cId=>{
    setCandidates(prev=>prev.map(c=>c.id===cId?{...c,mailStatus:"sending"}:c));
    try{
      await new Promise(r=>setTimeout(r,1800+Math.random()*800));
      /* TODO replace with: const res=await fetch(`/api/v1/job/${id}/candidate/${cId}/invite`,{method:"POST"}); const {accepted}=await res.json(); */
      const accepted=Math.random()>0.45;
      setCandidates(prev=>prev.map(c=>c.id===cId?{...c,mailStatus:accepted?"accepted":"awaited"}:c));
    }catch{setCandidates(prev=>prev.map(c=>c.id===cId?{...c,mailStatus:"idle"}:c));}
  };

  if(!job) return(
    <><style>{GLOBAL}</style><RecruiterHeader/>
      <div style={{minHeight:"calc(100vh - 68px)",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",fontFamily:"'Sora',sans-serif"}}>
          <div style={{fontSize:"40px",marginBottom:"12px"}}>⚠️</div>
          <p style={{marginBottom:"16px",color:C.textMid,fontWeight:"500"}}>Job role not found.</p>
          <button className="jd-back-btn" onClick={()=>navigate("/recruiter/profile")}>← Back to Profile</button>
        </div>
      </div>
    </>
  );

  const sorted=([...candidates]).sort((a,b)=>sortBy==="score"?b.score-a.score:a.name.localeCompare(b.name));
  const acceptedCount=candidates.filter(c=>c.mailStatus==="accepted").length;
  const awaitedCount=candidates.filter(c=>c.mailStatus==="awaited").length;

  return(
    <><style>{GLOBAL}</style><RecruiterHeader/>
      <div style={{minHeight:"calc(100vh - 68px)",background:C.bg,fontFamily:"'Sora',sans-serif",paddingBottom:"80px"}}>
        <div style={{maxWidth:"1160px",margin:"0 auto",padding:"44px 28px 0"}}>
          {/* Breadcrumb */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"26px",flexWrap:"wrap",gap:"10px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:C.textDim,letterSpacing:"0.08em",cursor:"pointer",fontWeight:"700"}} onClick={()=>navigate("/recruiter/profile")}>RECRUITER</span>
              <span style={{color:`rgba(168,85,247,0.40)`,fontSize:"12px"}}>›</span>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:C.textDim,letterSpacing:"0.08em",cursor:"pointer",fontWeight:"700"}} onClick={()=>navigate("/recruiter/profile")}>PROFILE</span>
              <span style={{color:`rgba(168,85,247,0.40)`,fontSize:"12px"}}>›</span>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:`rgba(168,85,247,0.88)`,letterSpacing:"0.08em",fontWeight:"700"}}>{job.title?.toUpperCase()}</span>
            </div>
            <button className="jd-back-btn" onClick={()=>navigate("/recruiter/profile")}>← Back to Profile</button>
          </div>

          {/* Job details */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"22px",padding:"28px 32px",boxShadow:"0 8px 50px rgba(0,0,0,0.60)",position:"relative",overflow:"hidden",marginBottom:"20px",animation:"rFU 0.5s ease both"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:"3px",background:`linear-gradient(90deg,transparent,${C.vivid},${C.lite},transparent)`,backgroundSize:"300% 100%",animation:"rBF 3s linear infinite"}}/>
            <div style={{display:"flex",alignItems:"flex-start",gap:"18px",flexWrap:"wrap",marginBottom:"18px"}}>
              <div style={{width:56,height:56,borderRadius:"14px",flexShrink:0,background:`linear-gradient(135deg,${C.dark},${C.vivid})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",boxShadow:`0 6px 20px rgba(168,85,247,0.38)`,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:"-80%",width:"55%",height:"100%",background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.28),transparent)",animation:"rSweep 2.5s ease-in-out infinite"}}/>💼
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap",marginBottom:"4px"}}>
                  <h1 style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"clamp(18px,3vw,24px)",color:"#fff",letterSpacing:"-0.04em",margin:0}}>{job.title}</h1>
                  <div style={{display:"inline-flex",alignItems:"center",gap:"5px",background:`rgba(168,85,247,0.10)`,border:`1px solid rgba(168,85,247,0.24)`,borderRadius:"100px",padding:"3px 10px"}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:C.vivid,animation:"rPulse 2s ease-in-out infinite"}}/>
                    <span style={{...LL,color:`rgba(168,85,247,0.92)`}}>ACTIVE</span>
                  </div>
                </div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:`rgba(168,85,247,0.85)`,letterSpacing:"0.04em",marginBottom:"12px",fontWeight:"700"}}>{job.role}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>
                  {[["📍",job.location||"Remote"],["🕐",`${job.experience_required||0}+ yrs`],["📅",new Date(job.createdAt||Date.now()).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})]].map(m=>(
                    <div key={m[1]} style={{display:"flex",alignItems:"center",gap:"5px",padding:"5px 12px",background:`rgba(168,85,247,0.08)`,border:`1px solid rgba(168,85,247,0.18)`,borderRadius:"7px"}}>
                      <span style={{fontSize:"11px"}}>{m[0]}</span><span style={{fontFamily:"'Sora',sans-serif",fontSize:"12px",color:C.textMid,fontWeight:"500"}}>{m[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                {[["Candidates",candidates.length],["Accepted",acceptedCount],["Awaiting",awaitedCount]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 14px",borderRadius:"10px",background:`rgba(168,85,247,0.08)`,border:`1px solid rgba(168,85,247,0.18)`}}>
                    <span style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"18px",color:C.lite,letterSpacing:"-0.03em"}}>{v}</span>
                    <span style={{fontFamily:"'Space Mono',monospace",fontSize:"8px",color:C.textDim,letterSpacing:"0.08em",textTransform:"uppercase",marginTop:"2px",fontWeight:"700"}}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            {job.description&&(
              <div style={{background:`rgba(168,85,247,0.06)`,border:`1px solid rgba(168,85,247,0.14)`,borderRadius:"12px",padding:"14px 16px"}}>
                <div style={{...LL,marginBottom:"8px"}}>📝 JOB DESCRIPTION</div>
                <p style={{fontFamily:"'Sora',sans-serif",fontSize:"13px",color:C.textMid,lineHeight:"1.70",margin:0,fontWeight:"500"}}>{job.description}</p>
              </div>
            )}
          </div>

          {/* Candidates */}
          <div style={{animation:"rFU 0.5s 0.12s ease both"}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",boxShadow:"0 6px 40px rgba(0,0,0,0.55)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:"2.5px",background:`linear-gradient(90deg,transparent,${C.vivid},${C.lite},transparent)`,backgroundSize:"200% 100%",animation:"rBF 3s linear infinite"}}/>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 26px 14px",borderBottom:`1px solid rgba(168,85,247,0.10)`,flexWrap:"wrap",gap:"12px"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"4px"}}>
                    <h2 style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"16px",color:"#fff",letterSpacing:"-0.03em",margin:0}}>AI-Filtered Candidates</h2>
                    <div style={{display:"flex",alignItems:"center",gap:"5px",background:`rgba(168,85,247,0.10)`,border:`1px solid rgba(168,85,247,0.22)`,borderRadius:"100px",padding:"2px 10px"}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:C.vivid,animation:"rPulse 2s ease-in-out infinite"}}/>
                      <span style={{...LL,color:`rgba(168,85,247,0.88)`}}>{candidates.length} MATCHED</span>
                    </div>
                  </div>
                  <p style={{fontFamily:"'Sora',sans-serif",fontSize:"12px",color:C.textDim,margin:0,fontWeight:"500"}}>Ranked by AI score — send invite mail to shortlisted candidates</p>
                </div>
                <div style={{display:"flex",gap:"5px",background:"rgba(255,255,255,0.04)",padding:"4px",borderRadius:"9px",border:"1px solid rgba(255,255,255,0.06)"}}>
                  {[["score","By Score"],["name","By Name"]].map(([key,label])=>(
                    <button key={key} onClick={()=>setSortBy(key)} style={{padding:"6px 14px",borderRadius:"6px",border:"none",cursor:"pointer",fontFamily:"'Sora',sans-serif",fontSize:"12px",fontWeight:"600",background:sortBy===key?`linear-gradient(135deg,${C.dark},${C.vivid})`:"transparent",color:sortBy===key?"#fff":C.textDim,boxShadow:sortBy===key?`0 2px 10px rgba(168,85,247,0.30)`:"none",transition:"all 0.2s"}}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{padding:"10px 26px",borderBottom:`1px solid rgba(168,85,247,0.06)`,display:"flex",gap:"16px",flexWrap:"wrap"}}>
                {[["#4ade80","Score ≥85 — Strong"],["#fbbf24","Score 70–84 — Good"],["#f87171","Score <70 — Borderline"]].map(([col,label])=>(
                  <div key={label} style={{display:"flex",alignItems:"center",gap:"6px"}}><div style={{width:7,height:7,borderRadius:"50%",background:col}}/><span style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:C.textDim,letterSpacing:"0.04em",fontWeight:"700"}}>{label}</span></div>
                ))}
              </div>
              <div style={{padding:"18px 26px 26px"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:"14px"}}>
                  {sorted.map(c=><CandidateCard key={c.id} candidate={c} onSendMail={handleSendMail}/>)}
                </div>
              </div>
              <div style={{borderTop:`1px solid rgba(168,85,247,0.06)`,padding:"12px 26px",display:"flex",alignItems:"center",gap:"10px"}}>
                <span style={{fontSize:"12px"}}>ℹ️</span>
                <span style={{fontFamily:"'Sora',sans-serif",fontSize:"11px",color:C.textDim,fontWeight:"500"}}>Candidates are AI-screened against job requirements. Scores reflect skill match, experience depth, and communication quality.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

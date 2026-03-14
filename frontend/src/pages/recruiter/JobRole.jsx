// src/pages/recruiter/JobRole.jsx — DARK MODE
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import RecruiterHeader from "../../components/RecruiterHeader";
import { listCandidates } from "../../api/candidate";
import { getCheatLogs } from "../../api/cheat";
import { addInterviewCandidate, createInterview, startInterview } from "../../api/interview";
import { getJob } from "../../api/job";
import { getLeaderboard } from "../../api/report";

const C={bg:"#0F0020",card:"rgba(20,0,45,0.90)",vivid:"#A855F7",lite:"#C084FC",dark:"#1A0033",border:"rgba(168,85,247,0.18)",text:"#FFFFFF",textMid:"rgba(255,255,255,0.78)",textDim:"rgba(255,255,255,0.52)"};
const LL={fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(168,85,247,0.80)`,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:"700"};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  .llm-help-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:8px;border:1.5px solid rgba(168,85,247,0.30);background:rgba(168,85,247,0.10);color:#C084FC;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;}
  .llm-help-btn:hover{background:rgba(168,85,247,0.17);border-color:#A855F7;transform:translateY(-1px);}
`;

function CandidateCard({candidate,onStartInterview}){
  const{name,email,score,skills,exp,location,avatar,cheatCount,lastCheatEvent,interviewId}=candidate;
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
        {cheatCount > 0 && <div style={{padding:"3px 8px",borderRadius:"5px",background:"rgba(248,113,113,0.12)",border:`1px solid rgba(248,113,113,0.30)`,fontFamily:"'Space Mono',monospace",fontSize:"9px",color:"#fca5a5",letterSpacing:"0.04em",fontWeight:"700"}}>⚠ {cheatCount} alerts</div>}
      </div>
      {cheatCount > 0 && lastCheatEvent && <div style={{marginBottom:"10px",fontFamily:"'Sora',sans-serif",fontSize:"11px",color:"#fca5a5",fontWeight:"600"}}>Latest alert: {String(lastCheatEvent).replaceAll("_", " ")}</div>}
      <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
        <button className="start-int-btn" onClick={()=>onStartInterview(candidate)}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polygon points="3,1 11,6 3,11" fill="currentColor"/></svg>{interviewId ? "Open Interview" : "Start Interview"}</button>
        {interviewId && <div style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"5px 10px",borderRadius:"6px",background:"rgba(22,163,74,0.12)",border:"1px solid rgba(22,163,74,0.30)",fontFamily:"'Space Mono',monospace",fontSize:"9px",color:"#4ade80",letterSpacing:"0.08em",fontWeight:"700"}}>✓ LINKED</div>}
      </div>
    </div>
  );
}

export default function JobRole(){
  const location=useLocation(),navigate=useNavigate(),{id}=useParams();
  const interviewId = new URLSearchParams(location.search).get("interviewId") || "";
  const [job, setJob] = useState(location.state?.job || null);
  const [jobLoading, setJobLoading] = useState(!location.state?.job && !!id);
  const[candidates,setCandidates]=useState([]);
  const[sortBy,setSortBy]=useState("score");
  const [cheatLogs, setCheatLogs] = useState([]);
  const [pageError, setPageError] = useState("");
  const isLlmInitError = /Failed to initialize LLM session|LLM service|api\/verify|api\/interview/i.test(String(pageError || ""));
  const activeInterviewIdsKey = candidates.map((candidate) => candidate.interviewId).filter(Boolean).sort().join("|");

  useEffect(() => {
    if (location.state?.job) {
      setJob(location.state.job);
      setJobLoading(false);
      return;
    }

    if (!id) {
      setJob(null);
      setJobLoading(false);
      return;
    }

    let cancelled = false;
    setJobLoading(true);

    getJob(id)
      .then((jobRow) => {
        if (!cancelled) {
          setJob(jobRow || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setJob(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setJobLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, location.state]);

  useEffect(() => {
    Promise.all([listCandidates(), getLeaderboard()])
      .then(([candidateRows, leaderboardRows]) => {
        const scores = new Map((leaderboardRows || []).map((row) => [row.candidate_id, row.avg_score]));
        const mapped = (candidateRows || []).map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          score: Math.round(scores.get(candidate.id) || 0),
          skills: [candidate.organisation || "Candidate"].filter(Boolean),
          exp: `${candidate.experience_years || 0} yrs`,
          location: candidate.location || "Unknown",
          avatar: String(candidate.name || "C").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
          interviewId: null,
          cheatCount: 0,
          lastCheatEvent: null,
        }));
        setCandidates(mapped);
      })
      .catch(() => {
        setCandidates([]);
        setPageError("Unable to load candidates from backend.");
      });
  }, []);

  useEffect(() => {
    if (!interviewId) {
      setCheatLogs([]);
      return;
    }

    getCheatLogs(interviewId)
      .then((logs) => setCheatLogs(Array.isArray(logs) ? logs : []))
      .catch(() => setCheatLogs([]));
  }, [interviewId]);

  useEffect(() => {
    const interviewIds = activeInterviewIdsKey ? activeInterviewIdsKey.split("|") : [];
    if (interviewIds.length === 0) {
      return undefined;
    }

    let cancelled = false;

    const refreshLogs = async () => {
      const entries = await Promise.all(
        interviewIds.map(async (candidateInterviewId) => {
          try {
            const logs = await getCheatLogs(candidateInterviewId);
            return [candidateInterviewId, Array.isArray(logs) ? logs : []];
          } catch {
            return [candidateInterviewId, []];
          }
        })
      );

      if (cancelled) {
        return;
      }

      const logMap = new Map(entries);
      setCandidates((prev) => prev.map((candidate) => {
        if (!candidate.interviewId) {
          return candidate;
        }
        const logs = logMap.get(candidate.interviewId) || [];
        return {
          ...candidate,
          cheatCount: logs.length,
          lastCheatEvent: logs[0]?.event_type || null,
        };
      }));
    };

    refreshLogs();
    const intervalId = setInterval(refreshLogs, 15000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeInterviewIdsKey]);

  const handleStartInterview = async (candidate) => {
    setPageError("");

    if (candidate?.interviewId) {
      navigate(`/recruiter/parallel/${encodeURIComponent(candidate.interviewId)}`);
      return;
    }

    if (!job?.id || !UUID_RE.test(String(job.id))) {
      setPageError("This job is not backed by a real backend job record yet, so a tracked interview cannot be created.");
      return;
    }

    if (!candidate?.id || !UUID_RE.test(String(candidate.id))) {
      setPageError("This candidate is not backed by a real backend candidate record yet.");
      return;
    }

    try {
      const interview = await createInterview({
        job_id: job.id,
        interview_type: "individual",
      });

      const createdInterviewId = interview?.id || interview?.interview_id;
      await addInterviewCandidate({
        interview_id: createdInterviewId,
        candidate_id: candidate.id,
      });
      await startInterview(createdInterviewId);

      setCandidates((prev) => prev.map((row) => row.id === candidate.id ? {
        ...row,
        interviewId: createdInterviewId,
      } : row));

      navigate(`/recruiter/parallel/${encodeURIComponent(createdInterviewId)}`);
    } catch (error) {
      setPageError(error.message || "Failed to create interview session.");
    }
  };

  if(jobLoading) return(
    <><style>{GLOBAL}</style><RecruiterHeader/>
      <div style={{minHeight:"calc(100vh - 68px)",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",fontFamily:"'Sora',sans-serif",color:C.textMid}}>Loading job details...</div>
      </div>
    </>
  );

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
  const monitoredCount=candidates.filter(c=>Boolean(c.interviewId)).length;
  const flaggedCount=candidates.filter(c=>(c.cheatCount||0)>0).length;
  const totalAlerts=candidates.reduce((sum,c)=>sum+(c.cheatCount||0),0);
  const highRiskCount=candidates.filter(c=>(c.cheatCount||0)>=3).length;

  return(
    <><style>{GLOBAL}</style><RecruiterHeader/>
      <div style={{minHeight:"calc(100vh - 68px)",background:C.bg,fontFamily:"'Sora',sans-serif",paddingBottom:"80px"}}>
        <div style={{maxWidth:"1160px",margin:"0 auto",padding:"44px 28px 0"}}>
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
                {[["Candidates",candidates.length],["Monitored",monitoredCount],["High Risk",highRiskCount],["Alerts",totalAlerts]].map(([l,v])=>(
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
                  <p style={{fontFamily:"'Sora',sans-serif",fontSize:"12px",color:C.textDim,margin:0,fontWeight:"500"}}>Ranked by backend score — start tracked interviews directly.</p>
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
                {pageError && (
                  <div style={{marginBottom:"16px",padding:"12px 14px",borderRadius:"12px",background:"rgba(248,113,113,0.10)",border:`1px solid rgba(248,113,113,0.30)`,fontFamily:"'Sora',sans-serif",fontSize:"12px",color:"#fecaca"}}>
                    <div>{pageError}</div>
                    {isLlmInitError && (
                      <div style={{marginTop:"10px"}}>
                        <button className="llm-help-btn" onClick={()=>navigate("/recruiter/llm-setup")}>Open LLM Setup Guide</button>
                      </div>
                    )}
                  </div>
                )}
                <div style={{marginBottom:"18px",padding:"16px",borderRadius:"14px",background:`rgba(168,85,247,0.08)`,border:`1px solid rgba(168,85,247,0.18)`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",marginBottom:"12px",flexWrap:"wrap"}}>
                    <div style={{fontFamily:"'Sora',sans-serif",fontSize:"14px",fontWeight:"700",color:"#fff"}}>Live Interview Monitoring</div>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:`rgba(168,85,247,0.85)`}}>{monitoredCount ? `${monitoredCount} active tracked interview${monitoredCount > 1 ? "s" : ""}` : "No tracked interviews started yet"}</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:"10px"}}>
                    {[["👁","Monitored",monitoredCount,"#c084fc"],["⚠","Flagged Candidates",flaggedCount,flaggedCount?"#fca5a5":"#c084fc"],["🚨","Total Alerts",totalAlerts,totalAlerts?"#f87171":"#c084fc"],["⛔","High Risk",highRiskCount,highRiskCount?"#fb7185":"#c084fc"]].map(([icon,label,value,color])=>(
                      <div key={label} style={{padding:"12px 14px",borderRadius:"12px",background:"rgba(255,255,255,0.04)",border:`1px solid rgba(168,85,247,0.12)`}}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px"}}><span style={{fontSize:"14px"}}>{icon}</span><span style={{...LL,color:`rgba(168,85,247,0.75)`}}>{label}</span></div>
                        <div style={{fontFamily:"'Sora',sans-serif",fontSize:"22px",fontWeight:"800",color,letterSpacing:"-0.03em"}}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {interviewId && (
                  <div style={{marginBottom:"18px",padding:"14px 16px",borderRadius:"14px",background:`rgba(168,85,247,0.08)`,border:`1px solid rgba(168,85,247,0.18)`}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",marginBottom:"10px",flexWrap:"wrap"}}>
                      <div style={{fontFamily:"'Sora',sans-serif",fontSize:"14px",fontWeight:"700",color:"#fff"}}>Cheat Detection Alerts</div>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:`rgba(168,85,247,0.85)`}}>INTERVIEW {interviewId.slice(0, 8)}...</div>
                    </div>
                    {cheatLogs.length === 0 ? (
                      <div style={{fontFamily:"'Sora',sans-serif",fontSize:"12px",color:C.textDim}}>No cheating logs reported for this interview yet.</div>
                    ) : (
                      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                        {cheatLogs.slice(0, 8).map((log) => (
                          <div key={log.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",padding:"10px 12px",borderRadius:"10px",background:"rgba(255,255,255,0.04)",border:`1px solid rgba(168,85,247,0.12)`}}>
                            <span style={{fontFamily:"'Sora',sans-serif",fontSize:"12px",color:"#fff"}}>⚠ {String(log.event_type || "unknown").replaceAll("_", " ")}</span>
                            <span style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:`rgba(168,85,247,0.85)`}}>{Math.round((Number(log.confidence) || 0) * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:"14px"}}>
                  {sorted.map(c=><CandidateCard key={c.id} candidate={c} onStartInterview={handleStartInterview}/>)}
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

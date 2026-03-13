// src/pages/candidate/SkillVerify.jsx — DARK MODE
import { useState, useEffect, useRef } from "react";
import Header from "../../components/Header";
import { startSkillBrain, answerSkillBrain } from "../../api/brain";
import { getMyCandidateProfile } from "../../api/candidate";
import { getMyInterviews } from "../../api/interview";
import { listQuestions } from "../../api/question";
import { submitAnswer as submitInterviewAnswer } from "../../api/answer";
import { listSkills } from "../../api/skill";
import { initCheatDetection } from "../../utils/cheat_detection";

const C = {
  bg:"#200F21", dark:"#382039", mid:"#5A3D5C", vivid:"#F638DC",
  panel:"rgba(20,8,21,0.88)", card:"rgba(32,16,34,0.75)",
  border:"rgba(246,56,220,0.15)",
  text:"#FFFFFF", textMid:"rgba(255,255,255,0.78)", textDim:"rgba(255,255,255,0.52)",
};

const extractNumeric = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const extractBrainScore = (payload) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const direct = [
    payload.final_score,
    payload.ai_score,
    payload.score,
    payload.last_score,
    payload.avg_score,
    payload.rating,
    payload.result?.score,
    payload.data?.score,
  ];

  for (const candidate of direct) {
    const parsed = extractNumeric(candidate);
    if (parsed !== null) {
      return Math.max(0, Math.min(100, parsed));
    }
  }

  const confidence = extractNumeric(payload.confidence ?? payload.result?.confidence ?? payload.data?.confidence);
  if (confidence !== null) {
    const scaled = confidence <= 1 ? confidence * 100 : confidence;
    return Math.max(0, Math.min(100, scaled));
  }

  return null;
};

function TypedText({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(()=>{ setDisplayed(""); let i=0; const iv=setInterval(()=>{ i++; setDisplayed(text.slice(0,i)); if(i>=text.length){clearInterval(iv);onDone?.();} },14); return()=>clearInterval(iv); },[text]);
  return <span>{displayed}<span style={{borderRight:`1.5px solid ${C.vivid}`,marginLeft:1,animation:"blink 0.9s step-end infinite"}}>&nbsp;</span></span>;
}
function ThinkingDots() {
  return <div style={{display:"flex",gap:"5px",alignItems:"center",padding:"4px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:C.vivid,opacity:0.65,animation:`thinkBounce 1.2s ease-in-out ${i*0.18}s infinite`,boxShadow:`0 0 6px ${C.vivid}`}}/>)}</div>;
}
function ChatBubble({ role, text, typing, onTypeDone }) {
  const isAI = role==="ai";
  return (
    <div style={{display:"flex",flexDirection:isAI?"row":"row-reverse",gap:"10px",alignItems:"flex-start",marginBottom:"16px",animation:"msgSlide 0.25s ease both"}}>
      <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:isAI?`linear-gradient(135deg,${C.dark},${C.vivid})`:"rgba(255,255,255,0.09)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:isAI?"14px":"12px",boxShadow:isAI?`0 0 12px rgba(246,56,220,0.35)`:"none",border:isAI?"none":"1px solid rgba(255,255,255,0.12)"}}>
        {isAI?"🤖":"👤"}
      </div>
      <div style={{maxWidth:"85%",background:isAI?"rgba(56,32,57,0.60)":"rgba(246,56,220,0.12)",border:isAI?`1px solid rgba(246,56,220,0.20)`:`1px solid rgba(246,56,220,0.32)`,borderRadius:isAI?"4px 14px 14px 14px":"14px 4px 14px 14px",padding:"11px 14px",backdropFilter:"blur(10px)"}}>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:isAI?`rgba(246,56,220,0.80)`:"rgba(255,255,255,0.42)",letterSpacing:"0.10em",marginBottom:"5px"}}>{isAI?"AI INTERVIEWER":"YOU"}</div>
        <div style={{fontFamily:"'Sora',sans-serif",fontSize:"12.5px",color:isAI?"rgba(255,255,255,0.92)":"rgba(255,255,255,0.82)",lineHeight:"1.65",fontWeight:"500"}}>
          {typing?<TypedText text={text} onDone={onTypeDone}/>:text}
        </div>
      </div>
    </div>
  );
}
function ProgressBar({ current, total }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{height:"3px",flex:1,borderRadius:"2px",background:i<current?`linear-gradient(90deg,${C.dark},${C.vivid})`:i===current?`linear-gradient(90deg,${C.mid},rgba(246,56,220,0.4))`:"rgba(255,255,255,0.10)",boxShadow:i<current?`0 0 6px rgba(246,56,220,0.40)`:"none",transition:"all 0.5s ease"}}/>
      ))}
    </div>
  );
}

const GLOBAL=`
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{min-height:100vh;background:#200F21;}
  ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:#5A3D5C;border-radius:4px;}
  ::placeholder{color:rgba(255,255,255,0.22)!important;font-family:'Sora',sans-serif;}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes msgSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes thinkBounce{0%,100%{transform:translateY(0);opacity:0.5}50%{transform:translateY(-5px);opacity:1}}
  @keyframes borderFlow{0%{background-position:0% 50%}100%{background-position:300% 50%}}
  @keyframes gradPulse{0%,100%{background-position:0% 60%}50%{background-position:100% 40%}}
  @keyframes sweep{0%{left:-120%}100%{left:160%}}
  @keyframes pulse2{0%,100%{opacity:1}50%{opacity:0.4}}
  .sv-submit-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;border-radius:10px;border:none;background:linear-gradient(135deg,#382039 0%,#5A3D5C 45%,#F638DC 100%);background-size:200% 200%;animation:gradPulse 3s ease infinite;color:#fff;font-family:'Sora',sans-serif;font-size:14px;font-weight:700;cursor:pointer;position:relative;overflow:hidden;box-shadow:0 4px 22px rgba(246,56,220,0.40),inset 0 1px 0 rgba(255,255,255,0.08);transition:transform 0.2s,box-shadow 0.2s;white-space:nowrap;}
  .sv-submit-btn::before{content:'';position:absolute;top:0;left:-120%;width:55%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent);animation:sweep 2.4s ease-in-out infinite;pointer-events:none;}
  .sv-submit-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(246,56,220,0.55);}
  .sv-submit-btn:disabled{opacity:0.40;cursor:not-allowed;transform:none;animation:none;}
  .sv-skip-btn{padding:12px 20px;border-radius:10px;border:1px solid rgba(246,56,220,0.22);background:transparent;color:rgba(255,255,255,0.52);font-family:'Sora',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:border-color 0.2s,color 0.2s,transform 0.15s;}
  .sv-skip-btn:hover{border-color:rgba(246,56,220,0.5);color:#F638DC;transform:translateY(-1px);}
  .sv-skip-btn:disabled{opacity:0.3;cursor:not-allowed;transform:none;}
  .sv-textarea{width:100%;height:100%;resize:none;background:transparent;border:none;outline:none;color:#fff;font-family:'Sora',sans-serif;font-size:14px;line-height:1.75;letter-spacing:-0.01em;caret-color:#F638DC;padding:0;font-weight:500;}
`;

export default function SkillVerify() {
  const searchParams = new URLSearchParams(window.location.search);
  const skill = searchParams.get("skill") || "Your Skill";
  const querySkillId = searchParams.get("skillId") || searchParams.get("skill_id") || "";
  const queryInterviewId = searchParams.get("interviewId") || searchParams.get("interview_id") || "";
  const [phase,setPhase]       = useState("intro");
  const [qIndex,setQIndex]     = useState(0);
  const [answer,setAnswer]     = useState("");
  const [chatHistory,setCH]    = useState([]);
  const [typing,setTyping]     = useState(false);
  const [thinking,setThinking] = useState(false);
  const [submitted,setSub]     = useState(false);
  const [finalScore,setFS]     = useState(null);
  const [charCount,setCC]      = useState(0);
  const [candidateId, setCandidateId] = useState("");
  const [skillId, setSkillId] = useState(querySkillId);
  const [skillLoading, setSkillLoading] = useState(false);
  const [skillBrainStarted, setSkillBrainStarted] = useState(false);
  const [effectiveInterviewId, setEffectiveInterviewId] = useState(queryInterviewId);
  const [monitorStatus, setMonitorStatus] = useState("");
  const [cheatEvents, setCheatEvents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState("");
  const [scoreSamples, setScoreSamples] = useState([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const chatEndRef = useRef(null);
  const videoRef = useRef(null);
  const MIN_CHARS  = 30;
  const TOTAL = questions.length;
  const isSkillOnlyFlow = Boolean(skillId) && !effectiveInterviewId;
  useEffect(()=>chatEndRef.current?.scrollIntoView({behavior:"smooth"}),[chatHistory,thinking]);

  useEffect(() => {
    getMyCandidateProfile()
      .then((profile) => setCandidateId(profile?.id || ""))
      .catch(() => setCandidateId(""));
  }, []);

  useEffect(() => {
    if (querySkillId) {
      setSkillId(querySkillId);
      return;
    }

    if (!candidateId) {
      setSkillId("");
      setSkillBrainStarted(false);
      return;
    }

    let cancelled = false;
    setSkillLoading(true);

    listSkills(candidateId)
      .then((rows) => {
        if (cancelled) {
          return;
        }

        const allSkills = Array.isArray(rows) ? rows : [];
        const normalizedSkill = String(skill || "").toLowerCase().trim();

        const exactMatch = allSkills.find(
          (entry) => String(entry?.skill_name || "").toLowerCase().trim() === normalizedSkill,
        );
        const fuzzyMatch = allSkills.find((entry) =>
          String(entry?.skill_name || "").toLowerCase().includes(normalizedSkill),
        );

        const resolved = exactMatch || fuzzyMatch || allSkills[0] || null;
        setSkillId(resolved?.id ? String(resolved.id) : "");
        setSkillBrainStarted(false);
      })
      .catch(() => {
        if (!cancelled) {
          setSkillId("");
          setSkillBrainStarted(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSkillLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [candidateId, skill, querySkillId]);

  useEffect(() => {
    if (querySkillId) {
      setEffectiveInterviewId("");
      return;
    }

    if (queryInterviewId) {
      setEffectiveInterviewId(queryInterviewId);
      return;
    }

    let cancelled = false;
    const normalizedSkill = String(skill || "").toLowerCase().trim();

    getMyInterviews()
      .then((rows) => {
        if (cancelled) {
          return;
        }

        const all = Array.isArray(rows) ? rows : [];
        if (!all.length) {
          return;
        }

        const upcoming = all.filter((item) => String(item.status || "").toUpperCase() === "UPCOMING");
        const matchBySkill = (item) => String(item.role || "").toLowerCase().includes(normalizedSkill);

        const selected =
          upcoming.find(matchBySkill) ||
          all.find(matchBySkill) ||
          upcoming[0] ||
          all[0];

        if (selected?.id) {
          setEffectiveInterviewId(String(selected.id));
          const params = new URLSearchParams(window.location.search);
          params.set("interviewId", String(selected.id));
          window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [queryInterviewId, skill, querySkillId]);

  useEffect(() => {
    if (!videoRef.current || !["intro", "qa"].includes(phase)) {
      return undefined;
    }

    let cleanup = () => {};

    initCheatDetection({
      video: videoRef.current,
      candidateId,
      interviewId: effectiveInterviewId,
      onStatusChange: setMonitorStatus,
      onEvent: (event) => {
        setCheatEvents((prev) => [event, ...prev].slice(0, 5));
      },
    })
      .then((stop) => {
        cleanup = stop;
      })
      .catch(() => {
        setMonitorStatus("Unable to start cheat monitoring.");
      });

    return () => {
      cleanup?.();
    };
  }, [phase, candidateId, effectiveInterviewId]);

  useEffect(() => {
    if (isSkillOnlyFlow) {
      setQuestions([]);
      setQuestionsLoading(false);
      setQuestionsError("");
      return;
    }

    if (!effectiveInterviewId) {
      setQuestions([]);
      setQuestionsError("Interview ID is missing and no candidate-linked interview could be resolved from backend.");
      return;
    }

    let cancelled = false;
    setQuestionsLoading(true);
    setQuestionsError("");

    listQuestions(effectiveInterviewId)
      .then((rows) => {
        if (cancelled) {
          return;
        }

        const normalized = Array.isArray(rows)
          ? rows.filter((row) => row?.id && row?.question_text)
          : [];

        setQuestions(normalized);
        if (!normalized.length) {
          setQuestionsError("No interview questions were found for this interview yet.");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setQuestions([]);
          setQuestionsError(error.message || "Failed to load interview questions from backend.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setQuestionsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveInterviewId, isSkillOnlyFlow]);

  const startInterview = async () => {
    if (questionsLoading || !skillId || skillLoading || (!isSkillOnlyFlow && !TOTAL)) {
      return;
    }

    let firstQuestionText = questions[0]?.question_text || "";

    try {
      const started = await startSkillBrain(skillId);
      const questionFromBrain =
        started?.question ||
        started?.next_question ||
        started?.data?.question ||
        "";

      if (isSkillOnlyFlow) {
        firstQuestionText = questionFromBrain || firstQuestionText;
      }

      setSkillBrainStarted(true);
    } catch (error) {
      if (!String(error?.message || "").toLowerCase().includes("already running")) {
        setMonitorStatus(error.message || "Failed to start AI skill interview session.");
        return;
      }
      setSkillBrainStarted(true);
    }

    if (!firstQuestionText) {
      setMonitorStatus("Skill interview started, but no first question was returned by backend.");
      return;
    }

    if (isSkillOnlyFlow) {
      setQuestions([{ id: `brain-0`, question_text: firstQuestionText }]);
      setQIndex(0);
    }

    setPhase("qa"); setThinking(true);
    setTimeout(()=>{ setThinking(false); setCH([{id:Date.now(),role:"ai",text:firstQuestionText,typing:true}]); },1200);
  };
  const handleTypeDone = id => { setCH(prev=>prev.map(m=>m.id===id?{...m,typing:false}:m)); setTyping(false); };
  const handleSubmitAnswer = async ({ force = false } = {}) => {
    if (!answer.trim() || (!force && answer.length < MIN_CHARS) || submitted) return;

    const cleanedAnswer = answer.trim();
    const currentQuestion = questions[qIndex];
    if ((!currentQuestion?.id && !isSkillOnlyFlow) || !candidateId || !skillId) {
      setMonitorStatus("Unable to submit answer because candidate or question context is missing.");
      return;
    }

    setCH(prev=>[...prev,{id:Date.now(),role:"user",text:cleanedAnswer,typing:false}]);
    setSub(true); setAnswer(""); setCC(0);

    let currentAnswerScore = null;
    let brainResponse = null;

    try {
      if (effectiveInterviewId && currentQuestion?.id && !String(currentQuestion.id).startsWith("brain-")) {
        await submitInterviewAnswer({
          question_id: currentQuestion.id,
          candidate_id: candidateId,
          answer_text: cleanedAnswer,
        });
      }

      if (!skillBrainStarted) {
        await startSkillBrain(skillId);
        setSkillBrainStarted(true);
      }

      brainResponse = await answerSkillBrain({
        skillId,
        candidateResponse: cleanedAnswer,
      }).catch(() => null);

      const scoreFromBrain = extractBrainScore(brainResponse);
      if (scoreFromBrain === null) {
        throw new Error("AI scoring service did not return a valid score.");
      }
      currentAnswerScore = scoreFromBrain;
      setScoreSamples((prev) => [...prev, scoreFromBrain]);
    } catch (error) {
      setSub(false);
      setMonitorStatus(error.message || "Failed to submit answer to backend.");
      return;
    }

    const next=qIndex+1;
    const backendFinished = String(brainResponse?.message || "").toLowerCase().includes("interview finished");

    if (isSkillOnlyFlow) {
      if (backendFinished) {
        setTimeout(()=>{ setThinking(true); setTimeout(()=>{ setThinking(false);
          const totalScores = [...scoreSamples, ...(currentAnswerScore !== null ? [currentAnswerScore] : [])];
          const avg = totalScores.length ? totalScores.reduce((sum, value) => sum + value, 0) / totalScores.length : 0;
          const skippedPenalty = skippedCount * 8;
          const sc = Math.max(0, Math.round(avg - skippedPenalty));
          setFS(sc);
          setCH(prev=>[...prev,{id:Date.now(),role:"ai",text:`Interview finished for ${skill}. Computing your verification score now...`,typing:true}]);
          setTimeout(()=>setPhase("done"),3200); },1400); },500);
        return;
      }

      const nextQuestionText =
        brainResponse?.question ||
        brainResponse?.next_question ||
        brainResponse?.data?.question ||
        "";

      if (!nextQuestionText) {
        setSub(false);
        setMonitorStatus("Next question was not returned by backend.");
        return;
      }

      setQuestions((prev) => [...prev, { id: `brain-${next}`, question_text: nextQuestionText }]);

      setTimeout(()=>{ setThinking(true); setTimeout(()=>{ setThinking(false); setTyping(true); setCH(prev=>[...prev,{id:Date.now(),role:"ai",text:nextQuestionText,typing:true}]); setQIndex(next); setSub(false); },1400+Math.random()*800); },500);
      return;
    }

    if (next>=TOTAL) {
      setTimeout(()=>{ setThinking(true); setTimeout(()=>{ setThinking(false);
        const totalScores = [...scoreSamples, ...(currentAnswerScore !== null ? [currentAnswerScore] : [])];
        const avg = totalScores.length ? totalScores.reduce((sum, value) => sum + value, 0) / totalScores.length : 0;
        const skippedPenalty = skippedCount * 8;
        const sc = Math.max(0, Math.round(avg - skippedPenalty));
        setFS(sc);
        setCH(prev=>[...prev,{id:Date.now(),role:"ai",text:`Excellent! You've completed all ${TOTAL} questions for ${skill}. Computing your verification score now...`,typing:true}]);
        setTimeout(()=>setPhase("done"),3500); },1800); },600);
    } else {
      setTimeout(()=>{ setThinking(true); setTimeout(()=>{ setThinking(false); setTyping(true); setCH(prev=>[...prev,{id:Date.now(),role:"ai",text:questions[next].question_text,typing:true}]); setQIndex(next); setSub(false); },1400+Math.random()*800); },500);
    }
  };
  const handleKeyDown = e => { if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)) handleSubmitAnswer(); };

  if (phase==="intro") return (
    <>
      <style>{GLOBAL}</style><Header/>
      <div style={{minHeight:"calc(100vh - 68px)",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora',sans-serif",position:"relative"}}>
        <div style={{position:"fixed",top:"-200px",right:"-200px",width:"600px",height:"600px",borderRadius:"50%",background:`radial-gradient(circle,rgba(90,61,92,0.28) 0%,transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{maxWidth:"560px",width:"100%",margin:"0 24px",background:C.panel,border:`1px solid ${C.border}`,borderRadius:"24px",padding:"52px 48px",backdropFilter:"blur(24px)",boxShadow:"0 16px 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.04)",position:"relative",overflow:"hidden",animation:"fadeUp 0.5s ease both",zIndex:1}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,transparent,${C.dark},${C.mid},${C.vivid},${C.mid},transparent)`,backgroundSize:"300% 100%",animation:"borderFlow 3s linear infinite"}}/>
          <div style={{width:72,height:72,borderRadius:"20px",margin:"0 auto 28px",background:`linear-gradient(135deg,${C.dark},${C.vivid})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",boxShadow:`0 0 32px rgba(246,56,220,0.45)`,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:"-80%",width:"55%",height:"100%",background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)",animation:"sweep 2.5s ease-in-out infinite"}}/>🧠
          </div>
          <div style={{textAlign:"center",position:"relative",zIndex:1}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:`rgba(246,56,220,0.85)`,letterSpacing:"0.14em",marginBottom:"12px",fontWeight:"700"}}>AI SKILL VERIFICATION · {TOTAL || 0} QUESTIONS</div>
            <h1 style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"clamp(24px,4vw,32px)",color:"#fff",letterSpacing:"-0.04em",marginBottom:"14px"}}>
              Verifying: <span style={{background:`linear-gradient(135deg,${C.mid},${C.vivid})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{skill}</span>
            </h1>
            <p style={{fontSize:"14px",color:C.textMid,lineHeight:"1.75",marginBottom:"18px",fontWeight:"500"}}>{isSkillOnlyFlow ? "Questions and scoring are generated live by AI skill brain. Answer each thoroughly — quality and depth are scored, not speed." : "Questions and scoring are loaded from backend interview data. Answer each thoroughly — quality and depth are scored, not speed."}</p>
            <div style={{marginBottom:"16px",padding:"10px 12px",borderRadius:"10px",background:"rgba(56,32,57,0.28)",border:`1px solid rgba(246,56,220,0.15)`,fontFamily:"'Sora',sans-serif",fontSize:"12px",color:questionsError?"#fca5a5":"rgba(255,255,255,0.72)",lineHeight:"1.5"}}>
              {isSkillOnlyFlow ? `Skill selected with ID ${skillId}. Questions will stream from AI after start.` : (questionsLoading ? "Loading interview questions from backend..." : (questionsError || `Loaded ${TOTAL} backend interview questions.`))}
            </div>
            <div style={{background:"rgba(56,32,57,0.38)",border:`1px solid rgba(246,56,220,0.15)`,borderRadius:"12px",padding:"18px 20px",marginBottom:"28px",textAlign:"left"}}>
              {[["🎯","Answer every question in depth — partial credit for partial answers"],["⏱️",`~${TOTAL*3}–${TOTAL*5} minutes total`],["💬","Chat panel on the left tracks the entire conversation"],["⌨️","Press Ctrl+Enter to submit your answer quickly"]].map(([icon,text])=>(
                <div key={icon} style={{display:"flex",gap:"10px",alignItems:"flex-start",marginBottom:"10px"}}>
                  <span style={{fontSize:"13px",flexShrink:0}}>{icon}</span>
                  <span style={{fontFamily:"'Sora',sans-serif",fontSize:"12px",color:C.textMid,lineHeight:"1.55",fontWeight:"500"}}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(32,15,33,0.70)",border:`1px solid rgba(246,56,220,0.20)`,borderRadius:"12px",padding:"12px",marginBottom:"18px"}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(246,56,220,0.80)`,letterSpacing:"0.10em",marginBottom:"8px"}}>CAMERA PREVIEW</div>
              <video ref={videoRef} autoPlay muted playsInline style={{width:"100%",aspectRatio:"4 / 3",objectFit:"cover",borderRadius:"10px",background:"#120813",border:`1px solid rgba(246,56,220,0.14)`}} />
              <div style={{marginTop:"8px",fontFamily:"'Sora',sans-serif",fontSize:"11px",color:"rgba(255,255,255,0.58)",lineHeight:"1.5"}}>{monitorStatus || "Allow camera permission to start preview."}</div>
            </div>
            <button className="sv-submit-btn" style={{width:"100%",justifyContent:"center"}} onClick={startInterview} disabled={skillLoading || !skillId || (!isSkillOnlyFlow && (questionsLoading || !!questionsError || !TOTAL))}>Begin Verification Session →</button>
          </div>
        </div>
      </div>
    </>
  );

  if (phase==="done"&&finalScore!==null) return (
    <>
      <style>{GLOBAL}</style><Header/>
      <div style={{minHeight:"calc(100vh - 68px)",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora',sans-serif"}}>
        <div style={{maxWidth:"520px",width:"100%",margin:"0 24px",background:C.panel,border:`1px solid rgba(0,220,120,0.25)`,borderRadius:"24px",padding:"52px 44px",textAlign:"center",backdropFilter:"blur(24px)",boxShadow:"0 16px 80px rgba(0,0,0,0.6),0 0 60px rgba(0,200,100,0.06)",position:"relative",overflow:"hidden",animation:"fadeUp 0.55s ease both"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:"linear-gradient(90deg,transparent,#16a34a,#4ade80,transparent)",backgroundSize:"200% 100%",animation:"borderFlow 3s linear infinite"}}/>
          <div style={{width:100,height:100,borderRadius:"50%",margin:"0 auto 10px",background:"linear-gradient(135deg,#16a34a,#4ade80)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 0 12px rgba(74,222,128,0.10),0 0 0 24px rgba(74,222,128,0.04),0 12px 48px rgba(74,222,128,0.35)"}}>
            <span style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"28px",color:"#fff"}}>{finalScore}</span>
          </div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:"rgba(74,222,128,0.75)",letterSpacing:"0.14em",marginBottom:"20px",fontWeight:"700"}}>SKILL SCORE / 100</div>
          <h2 style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"28px",color:"#fff",letterSpacing:"-0.04em",marginBottom:"10px"}}>Verification Complete!</h2>
          <p style={{fontSize:"14px",color:C.textMid,lineHeight:"1.75",marginBottom:"28px",fontWeight:"500"}}>Your <strong style={{color:"#4ade80"}}>{skill}</strong> skill has been verified with a score of <strong style={{color:"#4ade80"}}>{finalScore}/100</strong>. This is reflected on your profile.</p>
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:"6px",height:"8px",overflow:"hidden",marginBottom:"28px"}}>
            <div style={{height:"100%",width:`${finalScore}%`,background:"linear-gradient(90deg,#16a34a,#4ade80)",borderRadius:"6px",boxShadow:"0 0 10px rgba(74,222,128,0.5)",transition:"width 1.2s ease"}}/>
          </div>
          <a href="/profile" style={{display:"inline-flex",alignItems:"center",gap:"8px",padding:"12px 28px",borderRadius:"10px",textDecoration:"none",background:"linear-gradient(135deg,#16a34a,#4ade80)",color:"#fff",fontFamily:"'Sora',sans-serif",fontWeight:"700",fontSize:"14px",boxShadow:"0 4px 18px rgba(74,222,128,0.35)",transition:"transform 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}>← Back to Profile</a>
        </div>
      </div>
    </>
  );

  const canSubmit = answer.trim().length>=MIN_CHARS&&!submitted&&!typing&&!!skillId;
  const currentQ  = questions[qIndex]?.question_text || "";
  return (
    <>
      <style>{GLOBAL}</style><Header/>
      <div style={{height:"calc(100vh - 68px)",display:"flex",background:C.bg,fontFamily:"'Sora',sans-serif",overflow:"hidden"}}>
        {/* LEFT: Chat */}
        <div style={{width:"320px",flexShrink:0,display:"flex",flexDirection:"column",background:"rgba(16,6,17,0.95)",borderRight:`1px solid rgba(246,56,220,0.12)`,position:"relative"}}>
          <div style={{position:"absolute",top:0,right:0,bottom:0,width:"1px",background:`linear-gradient(to bottom,transparent,${C.dark},${C.vivid},${C.dark},transparent)`,backgroundSize:"100% 300%",animation:"borderFlow 6s ease infinite",opacity:0.6}}/>
          <div style={{padding:"16px 18px 14px",borderBottom:`1px solid rgba(246,56,220,0.10)`,background:"rgba(20,8,21,0.90)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:C.vivid,boxShadow:`0 0 7px ${C.vivid}`,animation:"pulse2 2s ease-in-out infinite"}}/>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:`rgba(246,56,220,0.88)`,letterSpacing:"0.10em",fontWeight:"700"}}>INTERVIEW TRANSCRIPT</span>
            </div>
            <div style={{fontFamily:"'Sora',sans-serif",fontWeight:"700",fontSize:"13px",color:"#fff",letterSpacing:"-0.02em",marginBottom:"10px"}}>{skill} Verification</div>
            <ProgressBar current={qIndex} total={TOTAL}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:"6px"}}>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:C.textDim,letterSpacing:"0.06em"}}>Q {qIndex+1}/{Math.max(TOTAL,1)}</span>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(246,56,220,0.72)`,letterSpacing:"0.06em"}}>{Math.round((qIndex/Math.max(TOTAL,1))*100)}% COMPLETE</span>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 14px 8px"}}>
            {chatHistory.length===0&&<div style={{textAlign:"center",padding:"40px 12px"}}><div style={{fontSize:"28px",marginBottom:"10px"}}>💬</div><p style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:C.textDim,letterSpacing:"0.06em"}}>CONVERSATION WILL<br/>APPEAR HERE</p></div>}
            {chatHistory.map(msg=><ChatBubble key={msg.id} role={msg.role} text={msg.text} typing={msg.typing} onTypeDone={()=>handleTypeDone(msg.id)}/>)}
            {thinking&&<div style={{display:"flex",gap:"10px",alignItems:"flex-start",marginBottom:"16px"}}>
              <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${C.dark},${C.vivid})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",boxShadow:`0 0 12px rgba(246,56,220,0.30)`}}>🤖</div>
              <div style={{background:"rgba(56,32,57,0.60)",border:`1px solid rgba(246,56,220,0.20)`,borderRadius:"4px 14px 14px 14px",padding:"11px 14px"}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(246,56,220,0.80)`,letterSpacing:"0.1em",marginBottom:"6px"}}>AI INTERVIEWER</div>
                <ThinkingDots/>
              </div>
            </div>}
            <div ref={chatEndRef}/>
          </div>
          <div style={{padding:"10px 14px",borderTop:`1px solid rgba(255,255,255,0.04)`,flexShrink:0}}>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:C.textDim,letterSpacing:"0.06em"}}>CTRL+ENTER TO SUBMIT</span>
          </div>
        </div>

        {/* RIGHT: Q + Answer split */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* TOP: Question */}
          <div style={{flex:"0 0 42%",display:"flex",flexDirection:"column",padding:"28px 36px 22px",background:`rgba(22,10,23,0.70)`,borderBottom:`1px solid rgba(246,56,220,0.14)`,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,transparent,${C.dark},${C.mid},${C.vivid},${C.mid},transparent)`,backgroundSize:"300% 100%",animation:"borderFlow 3s linear infinite"}}/>
            <div style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(rgba(246,56,220,0.06) 1px,transparent 1px)`,backgroundSize:"28px 28px",pointerEvents:"none"}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",position:"relative",zIndex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{width:40,height:40,borderRadius:"11px",flexShrink:0,background:`linear-gradient(135deg,${C.dark},${C.vivid})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",boxShadow:`0 0 18px rgba(246,56,220,0.40)`,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:"-80%",width:"55%",height:"100%",background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.28),transparent)",animation:"sweep 2.5s ease-in-out 0.5s infinite"}}/>🤖
                </div>
                <div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(246,56,220,0.88)`,letterSpacing:"0.12em",marginBottom:"2px",fontWeight:"700"}}>QUESTION {qIndex+1} OF {Math.max(TOTAL,1)}</div>
                  <div style={{fontFamily:"'Sora',sans-serif",fontWeight:"600",fontSize:"13px",color:"rgba(255,255,255,0.62)",letterSpacing:"-0.02em"}}>{skill} · AI Interviewer</div>
                </div>
              </div>
              <div style={{display:"flex",gap:"5px"}}>
                {Array.from({length:TOTAL}).map((_,i)=>(
                  <div key={i} style={{width:i===qIndex?22:7,height:7,borderRadius:"4px",background:i<qIndex?`linear-gradient(90deg,${C.dark},${C.vivid})`:i===qIndex?C.vivid:"rgba(255,255,255,0.10)",boxShadow:i===qIndex?`0 0 8px ${C.vivid}`:"none",transition:"all 0.4s ease"}}/>
                ))}
              </div>
            </div>
            <div style={{flex:1,position:"relative",zIndex:1,background:"rgba(56,32,57,0.28)",border:`1px solid rgba(246,56,220,0.15)`,borderRadius:"14px",padding:"22px 24px",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-start",overflow:"auto"}}>
              <div style={{fontFamily:"serif",fontSize:"60px",color:`rgba(246,56,220,0.18)`,lineHeight:0.8,marginRight:"12px",flexShrink:0,marginTop:"6px"}}>"</div>
              <p style={{fontFamily:"'Sora',sans-serif",fontSize:"clamp(14px,1.5vw,17px)",fontWeight:"600",color:"rgba(255,255,255,0.95)",lineHeight:"1.70",letterSpacing:"-0.02em",margin:0}}>{currentQ}</p>
            </div>
          </div>
          {/* BOTTOM: Answer */}
          <div style={{flex:1,display:"flex",flexDirection:"column",padding:"20px 36px 24px",background:`rgba(18,8,19,0.85)`,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",bottom:"-80px",right:"-80px",width:"300px",height:"300px",borderRadius:"50%",background:`radial-gradient(circle,rgba(246,56,220,0.06) 0%,transparent 70%)`,pointerEvents:"none"}}/>
            <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:"16px",marginBottom:"16px",position:"relative",zIndex:1}}>
              <div style={{background:"rgba(32,15,33,0.70)",border:`1px solid rgba(246,56,220,0.20)`,borderRadius:"14px",padding:"12px"}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(246,56,220,0.80)`,letterSpacing:"0.10em",marginBottom:"8px"}}>MONITOR CAMERA</div>
                <video ref={videoRef} id="video" autoPlay muted style={{width:"100%",aspectRatio:"4 / 3",objectFit:"cover",borderRadius:"10px",background:"#120813",border:`1px solid rgba(246,56,220,0.14)`}} />
                <div style={{marginTop:"8px",fontFamily:"'Sora',sans-serif",fontSize:"11px",color:"rgba(255,255,255,0.58)",lineHeight:"1.5"}}>
                  {monitorStatus || "Camera monitoring starts when the interview begins."}
                </div>
              </div>
              <div style={{background:"rgba(32,15,33,0.50)",border:`1px solid rgba(246,56,220,0.14)`,borderRadius:"14px",padding:"12px"}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(246,56,220,0.80)`,letterSpacing:"0.10em",marginBottom:"8px"}}>MONITOR EVENTS</div>
                {cheatEvents.length === 0 ? (
                  <div style={{fontFamily:"'Sora',sans-serif",fontSize:"12px",color:"rgba(255,255,255,0.45)"}}>No suspicious events reported in this session.</div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                    {cheatEvents.map((event, index) => (
                      <div key={`${event.type}-${index}`} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",padding:"8px 10px",borderRadius:"10px",background:"rgba(246,56,220,0.08)",border:`1px solid rgba(246,56,220,0.16)`}}>
                        <span style={{fontFamily:"'Sora',sans-serif",fontSize:"12px",color:"#fff"}}>⚠ {event.type.replaceAll("_", " ")}</span>
                        <span style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:`rgba(246,56,220,0.80)`}}>{Math.round(event.confidence * 100)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px",position:"relative",zIndex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,0.35)",flexShrink:0}}/>
                <span style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:C.textDim,letterSpacing:"0.10em",fontWeight:"700"}}>YOUR RESPONSE</span>
              </div>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",letterSpacing:"0.06em",color:charCount<MIN_CHARS?`rgba(246,56,220,0.65)`:"rgba(74,222,128,0.80)",fontWeight:"700"}}>
                {charCount} chars {charCount<MIN_CHARS?`(min ${MIN_CHARS})`:"✓"}
              </span>
            </div>
            <div style={{flex:1,background:"rgba(32,15,33,0.70)",border:`1px solid rgba(246,56,220,0.20)`,borderRadius:"14px",padding:"18px 20px",backdropFilter:"blur(10px)",position:"relative",zIndex:1,display:"flex",flexDirection:"column",transition:"border-color 0.2s,box-shadow 0.2s",marginBottom:"16px"}}
              onFocus={e=>{e.currentTarget.style.borderColor="rgba(246,56,220,0.55)";e.currentTarget.style.boxShadow="0 0 0 3px rgba(246,56,220,0.10)";}}
              onBlur={e=>{e.currentTarget.style.borderColor="rgba(246,56,220,0.20)";e.currentTarget.style.boxShadow="none";}}>
              <textarea className="sv-textarea" placeholder="Type your answer here. Be thorough — the AI evaluator rewards depth and clarity. Press Ctrl+Enter to submit." value={answer} disabled={submitted||typing} onChange={e=>{setAnswer(e.target.value);setCC(e.target.value.length);}} onKeyDown={handleKeyDown}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"12px",position:"relative",zIndex:1}}>
              <button className="sv-submit-btn" disabled={!canSubmit} onClick={handleSubmitAnswer}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {isSkillOnlyFlow ? "Submit Answer" : (qIndex<TOTAL-1?"Submit & Next Question":"Submit Final Answer")}
              </button>
              <button className="sv-skip-btn" disabled={submitted||typing} onClick={()=>{setSkippedCount(prev => prev + 1); setAnswer("(Skipped due to timeout)"); setCC(24); setTimeout(()=>{setAnswer("");handleSubmitAnswer({ force: true });},10);}}>Skip</button>
              {submitted&&<div style={{display:"flex",alignItems:"center",gap:"8px",animation:"fadeUp 0.3s ease"}}>
                <div style={{width:10,height:10,borderRadius:"50%",border:"2px solid rgba(246,56,220,0.25)",borderTopColor:C.vivid,animation:"thinkBounce 0.8s linear infinite"}}/>
                <span style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:`rgba(246,56,220,0.75)`,letterSpacing:"0.06em",fontWeight:"700"}}>{isSkillOnlyFlow ? "PROCESSING ANSWER..." : (qIndex<TOTAL-1?"PREPARING NEXT QUESTION...":"COMPUTING SCORE...")}</span>
              </div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// src/pages/candidate/Profile.jsx
import { useState, useEffect, useRef } from "react";
import Header from "../../components/Header";
import { getMyCandidateProfile, updateMyCandidateProfile } from "../../api/candidate";
import { getMyInterviews } from "../../api/interview";
import { listSkills, addSkill, deleteSkill } from "../../api/skill";

/* ── Palette ── */
const C = {
  bg:      "#200F21",
  dark:    "#382039",
  mid:     "#5A3D5C",
  vivid:   "#F638DC",
  text:    "#FFFFFF",
  textMid: "rgba(255,255,255,0.78)",
  textDim: "rgba(255,255,255,0.52)",
  card:    "rgba(20,8,21,0.80)",
};

/* ── Neural canvas ── */
function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, W, H;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const N = 32;
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 2 + 1, pulse: Math.random() * Math.PI * 2,
    }));
    const DIST = 150;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.016;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < DIST) {
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(246,56,220,${(1-d/DIST)*0.13})`; ctx.lineWidth = 0.6; ctx.stroke();
        }
      }
      nodes.forEach(n => {
        const p = 0.5 + 0.5 * Math.sin(n.pulse);
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + p, 0, Math.PI*2);
        ctx.fillStyle = `rgba(246,56,220,${0.18 + p*0.28})`; ctx.shadowColor = C.vivid; ctx.shadowBlur = 5+p*7;
        ctx.fill(); ctx.shadowBlur = 0;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", opacity:0.4 }} />;
}

/* ── Extract username from URL ── */
const ghUser = url => { try { const p = new URL(url).pathname.split("/").filter(Boolean); return p[0] || null; } catch { return null; } };

/* ── GitHub Heatmap ── */
function GithubHeatmap({ url }) {
  const user = ghUser(url);
  if (!user) return <div style={heatmapEmpty}>No GitHub URL set</div>;
  return (
    <div style={{ width:"100%", overflowX:"auto" }}>
      <img
        src={`https://ghchart.rshah.org/F638DC/${user}`}
        alt={`${user} GitHub contributions`}
        style={{ width:"100%", minWidth:"580px", borderRadius:"6px", filter:"brightness(1.1) saturate(1.2)" }}
        onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
      />
      <div style={{ ...heatmapEmpty, display:"none" }}>Could not load GitHub heatmap</div>
    </div>
  );
}

const heatmapEmpty = {
  padding:"18px", borderRadius:"8px", background:`rgba(246,56,220,0.05)`,
  border:`1px dashed rgba(246,56,220,0.2)`, color:"rgba(255,255,255,0.3)",
  fontFamily:"'Space Mono',monospace", fontSize:"11px", letterSpacing:"0.06em",
  display:"flex", alignItems:"center", justifyContent:"center",
};

/* ── Stat chip ── */
function StatChip({ label, value, glow }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", gap:"3px",
      padding:"12px 18px", borderRadius:"10px",
      background:`rgba(56,32,57,0.45)`, border:`1px solid rgba(246,56,220,0.18)`,
      backdropFilter:"blur(8px)", minWidth:"80px",
      boxShadow: glow ? `0 0 18px rgba(246,56,220,0.2)` : "none",
    }}>
      <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:"800", fontSize:"20px", color:"#fff", letterSpacing:"-0.03em", lineHeight:1 }}>{value}</span>
      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:`rgba(246,56,220,0.7)`, letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</span>
    </div>
  );
}

/* ── Interview status badge ── */
function StatusBadge({ status }) {
  const cfg = {
    UPCOMING:  { bg:`rgba(246,56,220,0.12)`, border:`rgba(246,56,220,0.38)`, color:"#f870e0", label:"UPCOMING",  dot:C.vivid },
    COMPLETED: { bg:"rgba(0,200,100,0.10)", border:"rgba(0,200,100,0.3)",    color:"#40d080", label:"COMPLETED", dot:"#40d080" },
    CANCELLED: { bg:"rgba(255,60,60,0.10)",  border:"rgba(255,60,60,0.3)",   color:"#ff6060", label:"CANCELLED", dot:"#ff6060" },
  };
  const s = cfg[status] || cfg.UPCOMING;
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", background:s.bg, border:`1px solid ${s.border}`, borderRadius:"100px", padding:"3px 10px" }}>
      <div style={{ width:5, height:5, borderRadius:"50%", background:s.dot, boxShadow:`0 0 6px ${s.dot}`, animation: status==="UPCOMING"?"blink 2s ease-in-out infinite":"none" }} />
      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", fontWeight:"700", color:s.color, letterSpacing:"0.1em" }}>{s.label}</span>
    </div>
  );
}

/* ── Interview card ── */
function InterviewCard({ iv }) {
  const dt   = new Date(iv.scheduled_at);
  const date = dt.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  const time = dt.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true });

  return (
    <div style={{
      background:C.card, border:`1px solid rgba(246,56,220,0.16)`,
      borderRadius:"16px", padding:"22px 26px",
      backdropFilter:"blur(20px)",
      boxShadow:"0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
      position:"relative", overflow:"hidden",
      transition:"transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 8px 40px rgba(0,0,0,0.6), 0 0 30px rgba(246,56,220,0.10)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)"; }}
    >
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"1.5px", background:`linear-gradient(90deg,transparent,${C.dark},${C.vivid},transparent)`, backgroundSize:"200% 100%", animation:"borderFlow 3s linear infinite" }} />
      <div style={{ position:"absolute", top:"-40px", right:"-40px", width:"120px", height:"120px", borderRadius:"50%", background:`radial-gradient(circle,rgba(56,32,57,0.4) 0%,transparent 70%)`, pointerEvents:"none" }} />

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"14px", flexWrap:"wrap", gap:"10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{
            width:"44px", height:"44px", borderRadius:"12px", flexShrink:0,
            background:`linear-gradient(135deg,${C.dark},${C.vivid})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"20px", boxShadow:`0 0 16px rgba(246,56,220,0.30)`,
            position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", top:0, left:"-80%", width:"55%", height:"100%", background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)", animation:"sweep 2.5s ease-in-out infinite" }} />
            {iv.company_logo}
          </div>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:"700", fontSize:"15px", color:"#fff", letterSpacing:"-0.02em", marginBottom:"2px" }}>{iv.role}</div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:`rgba(246,56,220,0.8)`, letterSpacing:"0.04em" }}>{iv.company} · {iv.round}</div>
          </div>
        </div>
        <StatusBadge status={iv.status} />
      </div>

      <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"14px" }}>
        {[{ icon:"📅", val:date }, { icon:"🕐", val:time }, { icon:"⏱️", val:`${iv.duration_mins} min` }, { icon:"🤖", val:iv.interviewer }].map(m => (
          <div key={m.val} style={{ display:"flex", alignItems:"center", gap:"5px", padding:"4px 10px", background:`rgba(56,32,57,0.40)`, border:`1px solid rgba(246,56,220,0.12)`, borderRadius:"6px" }}>
            <span style={{ fontSize:"11px" }}>{m.icon}</span>
            <span style={{ fontFamily:"'Sora',sans-serif", fontSize:"11px", color:"rgba(255,255,255,0.55)", letterSpacing:"-0.01em" }}>{m.val}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: iv.status==="COMPLETED" ? "14px" : "16px" }}>
        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:`rgba(246,56,220,0.6)`, letterSpacing:"0.1em", textTransform:"uppercase", marginRight:"8px" }}>AI FOCUS</span>
        <span style={{ fontFamily:"'Sora',sans-serif", fontSize:"12px", color:"rgba(255,255,255,0.45)" }}>{iv.ai_level}</span>
      </div>

      {iv.status === "COMPLETED" && iv.score && (
        <div style={{ background:"#fff", color:C.text, border:`1px solid rgba(246,56,220,0.14)`, borderRadius:"8px", padding:"12px 14px", marginBottom:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"8px" }}>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:`rgba(246,56,220,0.7)`, letterSpacing:"0.1em" }}>AI SCORE</span>
            <div style={{ flex:1, height:"4px", borderRadius:"2px", background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${iv.score}%`, background:`linear-gradient(90deg,${C.dark},${C.vivid})`, borderRadius:"2px", boxShadow:`0 0 8px rgba(246,56,220,0.4)`, transition:"width 1s ease" }} />
            </div>
            <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:"700", fontSize:"14px", color:"#fff", minWidth:"36px", textAlign:"right" }}>{iv.score}</span>
          </div>
          {iv.feedback && <p style={{ fontFamily:"'Sora',sans-serif", fontSize:"12px", color:"rgba(255,255,255,0.40)", lineHeight:"1.6", margin:0 }}>{iv.feedback}</p>}
        </div>
      )}

      {iv.status === "UPCOMING" && iv.join_url && (
        <a href={iv.join_url} style={{
          display:"inline-flex", alignItems:"center", gap:"7px",
          background:`linear-gradient(135deg,${C.dark},${C.vivid})`,
          backgroundSize:"200% 200%", animation:"gradPulse 4s ease infinite",
          color:"#fff", fontFamily:"'Sora',sans-serif", fontWeight:"600", fontSize:"13px",
          padding:"9px 20px", borderRadius:"8px", textDecoration:"none",
          boxShadow:`0 4px 18px rgba(246,56,220,0.35)`, transition:"transform 0.2s, box-shadow 0.2s",
          position:"relative", overflow:"hidden",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow=`0 8px 28px rgba(246,56,220,0.5)`; }}
          onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=`0 4px 18px rgba(246,56,220,0.35)`; }}
        >
          <div style={{ position:"absolute", top:0, left:"-80%", width:"55%", height:"100%", background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent)", animation:"sweep 2.5s ease-in-out infinite" }} />
          <span style={{ position:"relative" }}>▶ Join Interview Session</span>
        </a>
      )}
    </div>
  );
}

/* ── Editable field ── */
function EditRow({ label, value, onChange, type="text", multiline, icon }) {
  const focusStyle = { borderColor:`rgba(246,56,220,0.65)`, boxShadow:`0 0 0 3px rgba(246,56,220,0.12)` };
  const blurStyle  = { borderColor:`rgba(246,56,220,0.25)`, boxShadow:"none" };
  const inputBase  = {
    background:`rgba(56,32,57,0.35)`, border:`1px solid rgba(246,56,220,0.25)`, borderRadius:"8px",
    color:"#fff", fontFamily:"'Sora',sans-serif", fontSize:"13px", padding:"9px 12px",
    outline:"none", transition:"border-color 0.2s, box-shadow 0.2s",
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
      <label style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", fontWeight:"700", letterSpacing:"0.12em", textTransform:"uppercase", color:`rgba(246,56,220,0.7)`, display:"flex", alignItems:"center", gap:"6px" }}>
        {icon && <span>{icon}</span>}{label}
      </label>
      {multiline ? (
        <textarea value={value} onChange={e=>onChange(e.target.value)} rows={3} style={{ ...inputBase, resize:"vertical", lineHeight:"1.6" }}
          onFocus={e=>{Object.assign(e.target.style,focusStyle);}}
          onBlur={e=>{Object.assign(e.target.style,blurStyle);}}
        />
      ) : (
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} style={{ ...inputBase, width:"100%" }}
          onFocus={e=>{Object.assign(e.target.style,focusStyle);}}
          onBlur={e=>{Object.assign(e.target.style,blurStyle);}}
        />
      )}
    </div>
  );
}

/* ── Info display row ── */
function InfoRow({ icon, label, value, link }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:"10px", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize:"14px", marginTop:"1px", flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:`rgba(246,56,220,0.65)`, letterSpacing:"0.10em", textTransform:"uppercase", marginBottom:"2px" }}>{label}</div>
        {link && value ? (
          <a href={value} target="_blank" rel="noreferrer" style={{ fontFamily:"'Sora',sans-serif", fontSize:"13px", color:`rgba(246,56,220,0.9)`, wordBreak:"break-all", textDecoration:"none", transition:"color 0.2s" }}
            onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color=`rgba(246,56,220,0.9)`}
          >{value}</a>
        ) : (
          <div style={{ fontFamily:"'Sora',sans-serif", fontSize:"13px", color: value ? C.text : C.textDim, wordBreak:"break-all", lineHeight:"1.55" }}>{value || "—"}</div>

        )}
      </div>
    </div>
  );
}

/* ── Section card ── */
function SectionCard({ title, tag, children, style={} }) {
  return (
    <div style={{
      background:C.card, border:`1px solid rgba(246,56,220,0.14)`,
      borderRadius:"18px", overflow:"hidden",
      backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)",
      boxShadow:"0 6px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
      position:"relative",
      ...style,
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"1.5px", background:`linear-gradient(90deg,transparent,${C.dark},${C.vivid},transparent)`, backgroundSize:"200% 100%", animation:"borderFlow 3s linear infinite" }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(246,56,220,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(246,56,220,0.018) 1px,transparent 1px)`, backgroundSize:"44px 44px", pointerEvents:"none", borderRadius:"inherit" }} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)", position:"relative", zIndex:1 }}>
        <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:"800", fontSize:"14px", color:"#fff", letterSpacing:"-0.02em", margin:0 }}>{title}</h3>
        {tag && <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:`rgba(246,56,220,0.7)`, letterSpacing:"0.12em", background:`rgba(56,32,57,0.5)`, border:`1px solid rgba(246,56,220,0.2)`, borderRadius:"4px", padding:"3px 8px" }}>{tag}</span>}
      </div>
      <div style={{ padding:"18px 24px", position:"relative", zIndex:1 }}>{children}</div>
    </div>
  );
}

/* ── Global CSS ── */
const GLOBAL = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
  html,body,#root { min-height:100vh; background:#200F21; }
  ::placeholder { color:rgba(255,255,255,0.18)!important; font-family:'Sora',sans-serif; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:#200F21; }
  ::-webkit-scrollbar-thumb { background:#5A3D5C; border-radius:4px; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes sweep     { 0%{left:-120%} 100%{left:160%} }
  @keyframes borderFlow{ 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
  @keyframes gradPulse { 0%,100%{background-position:0% 60%} 50%{background-position:100% 40%} }
  @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 14px rgba(246,56,220,0.22)} 50%{box-shadow:0 0 34px rgba(246,56,220,0.55),0 0 60px rgba(90,61,92,0.2)} }
  @keyframes floatA    { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.03)} }
  @keyframes floatB    { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(16px) scale(0.97)} }
  @keyframes ringRotate    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ringRotateRev { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
  @keyframes avatarPulse { 0%,100%{box-shadow:0 0 0 0 rgba(246,56,220,0.35),0 0 28px rgba(246,56,220,0.25)} 50%{box-shadow:0 0 0 8px rgba(246,56,220,0),0 0 48px rgba(246,56,220,0.45)} }
  @keyframes statusBlink { 0%,100%{opacity:1} 49%{opacity:1} 50%,80%{opacity:0.15} }

  .save-btn {
    padding:10px 26px; border-radius:9px; border:none;
    background:linear-gradient(135deg,#382039,#F638DC); background-size:220% 220%;
    animation:gradPulse 4s ease infinite;
    color:#fff; font-family:'Sora',sans-serif; font-size:13px; font-weight:700;
    cursor:pointer; position:relative; overflow:hidden;
    box-shadow:0 4px 22px rgba(246,56,220,0.40);
    transition:transform 0.2s,box-shadow 0.2s;
  }
  .save-btn::before { content:''; position:absolute; top:0; left:-120%; width:55%; height:100%; background:linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent); animation:sweep 2.6s ease-in-out infinite; pointer-events:none; }
  .save-btn:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(246,56,220,0.55); }

  .cancel-btn {
    padding:10px 20px; border-radius:9px;
    border:1px solid rgba(255,255,255,0.08); background:transparent;
    color:rgba(255,255,255,0.4); font-family:'Sora',sans-serif; font-size:13px; font-weight:500;
    cursor:pointer; transition:border-color 0.2s,color 0.2s,transform 0.15s;
  }
  .cancel-btn:hover { border-color:rgba(246,56,220,0.4); color:#F638DC; transform:translateY(-1px); }

  .edit-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 18px; border-radius:8px;
    border:1px solid rgba(246,56,220,0.35); background:rgba(56,32,57,0.30);
    color:rgba(246,56,220,0.9); font-family:'Sora',sans-serif; font-size:12px; font-weight:600;
    cursor:pointer; transition:background 0.2s,border-color 0.2s,transform 0.15s;
  }
  .edit-btn:hover { background:rgba(56,32,57,0.55); border-color:rgba(246,56,220,0.6); transform:translateY(-1px); }

  @keyframes verifyPulse {
    0%   { background-position:0%   50%; }
    50%  { background-position:100% 50%; }
    100% { background-position:0%   50%; }
  }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes scoreReveal { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }

  .add-skill-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:8px 18px; border-radius:8px;
    border:1px solid rgba(246,56,220,0.45);
    background:rgba(56,32,57,0.35);
    color:#F638DC; font-family:'Sora',sans-serif; font-size:13px; font-weight:600;
    cursor:pointer; transition:background 0.2s,border-color 0.2s,transform 0.15s,box-shadow 0.2s;
  }
  .add-skill-btn:hover { background:rgba(56,32,57,0.60); border-color:#F638DC; transform:translateY(-1px); box-shadow:0 0 16px rgba(246,56,220,0.25); }

  .verify-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 14px; border-radius:7px; border:none;
    background:linear-gradient(135deg,#382039,#5A3D5C,#F638DC);
    background-size:200% 200%; animation:verifyPulse 4s ease infinite;
    color:#fff; font-family:'Sora',sans-serif; font-size:11px; font-weight:600;
    cursor:pointer; box-shadow:0 2px 12px rgba(246,56,220,0.30);
    transition:transform 0.15s,box-shadow 0.2s;
  }
  .verify-btn:hover { transform:translateY(-1px); box-shadow:0 4px 18px rgba(246,56,220,0.50); }
  .verify-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }

  .skill-save-btn {
    padding:9px 22px; border-radius:8px; border:none;
    background:linear-gradient(135deg,#382039,#F638DC); background-size:200% 200%;
    animation:gradPulse 3s ease infinite;
    color:#fff; font-family:'Sora',sans-serif; font-size:13px; font-weight:700;
    cursor:pointer; box-shadow:0 3px 16px rgba(246,56,220,0.35);
    transition:transform 0.15s,box-shadow 0.2s;
  }
  .skill-save-btn:hover { transform:translateY(-1px); box-shadow:0 6px 24px rgba(246,56,220,0.50); }

  .skill-cancel-btn {
    padding:9px 18px; border-radius:8px;
    border:1px solid rgba(255,255,255,0.08); background:transparent;
    color:rgba(255,255,255,0.4); font-family:'Sora',sans-serif; font-size:13px; font-weight:500;
    cursor:pointer; transition:border-color 0.2s,color 0.2s;
  }
  .skill-cancel-btn:hover { border-color:rgba(246,56,220,0.4); color:#F638DC; }
`;

/* ── Add Skill Panel ── */
function AddSkillPanel({ onSave, onCancel }) {
  const [skillName, setSkillName] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const inputBase = {
    width:"100%", padding:"10px 13px", borderRadius:"8px",
    border:"1px solid rgba(246,56,220,0.22)", background:"rgba(32,15,33,0.70)",
    color:"#fff", fontFamily:"'Sora',sans-serif", fontSize:"13px",
    outline:"none", caretColor:"#F638DC", transition:"border-color 0.2s,box-shadow 0.2s",
    boxSizing:"border-box",
  };
  const focusFn = e => { e.target.style.borderColor="rgba(246,56,220,0.65)"; e.target.style.boxShadow="0 0 0 3px rgba(246,56,220,0.11)"; };
  const blurFn  = e => { e.target.style.borderColor="rgba(246,56,220,0.22)"; e.target.style.boxShadow="none"; };

  const handleSave = () => {
    if (!skillName.trim()) return;
    onSave({ id: Date.now(), name: skillName.trim(), githubUrl: githubUrl.trim(), verified: false, score: null, verifying: false });
  };

  return (
    <div style={{
      background:"rgba(20,8,21,0.90)", border:"1px solid rgba(246,56,220,0.28)",
      borderRadius:"14px", padding:"22px 24px", marginTop:"16px",
      backdropFilter:"blur(20px)", animation:"fadeUp 0.25s ease both",
      position:"relative", overflow:"hidden",
    }}>
      {/* shimmer top */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"1.5px", background:`linear-gradient(90deg,transparent,#382039,#F638DC,transparent)`, backgroundSize:"200% 100%", animation:"borderFlow 3s linear infinite" }} />

      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"#F638DC", boxShadow:"0 0 8px #F638DC", animation:"glowPulse 2s infinite", flexShrink:0 }} />
        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"rgba(246,56,220,0.8)", letterSpacing:"0.10em" }}>ADD NEW SKILL</span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"16px" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
          <label style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"rgba(246,56,220,0.7)", letterSpacing:"0.12em", textTransform:"uppercase" }}>Skill Name *</label>
          <input
            placeholder="e.g. React, Node.js, ML"
            value={skillName} onChange={e=>setSkillName(e.target.value)}
            style={inputBase} onFocus={focusFn} onBlur={blurFn}
          />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
          <label style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"rgba(246,56,220,0.7)", letterSpacing:"0.12em", textTransform:"uppercase" }}>GitHub Project URL</label>
          <input
            placeholder="https://github.com/you/project"
            value={githubUrl} onChange={e=>setGithubUrl(e.target.value)}
            style={inputBase} onFocus={focusFn} onBlur={blurFn}
          />
        </div>
      </div>

      <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
        <button className="skill-save-btn" onClick={handleSave} disabled={!skillName.trim()}>Save Skill ✦</button>
        <button className="skill-cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/* ── Skill Card ── */
function SkillCard({ skill, onVerify, onDelete }) {
  const verified = skill.verified;
  const verifying = skill.verifying;

  return (
    <div style={{
      background: verified ? "rgba(0,40,20,0.55)" : "rgba(20,8,21,0.75)",
      border: verified ? "1px solid rgba(0,220,120,0.35)" : "1px solid rgba(246,56,220,0.16)",
      borderRadius:"14px", padding:"16px 18px",
      backdropFilter:"blur(16px)",
      boxShadow: verified
        ? "0 4px 24px rgba(0,0,0,0.5), 0 0 20px rgba(0,200,100,0.10), inset 0 1px 0 rgba(0,220,120,0.08)"
        : "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
      position:"relative", overflow:"hidden",
      transition:"border-color 0.4s, box-shadow 0.4s, background 0.4s",
    }}>
      {/* shimmer */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:"1.5px",
        background: verified
          ? "linear-gradient(90deg,transparent,rgba(0,220,120,0.5),transparent)"
          : `linear-gradient(90deg,transparent,#382039,#F638DC,transparent)`,
        backgroundSize:"200% 100%", animation:"borderFlow 3s linear infinite",
      }} />

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px" }}>
        <div style={{ flex:1, minWidth:0 }}>
          {/* Skill name + verified badge */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px", flexWrap:"wrap" }}>
            <span style={{
              fontFamily:"'Sora',sans-serif", fontWeight:"700", fontSize:"15px",
              color: verified ? "#4ade80" : "#fff",
              letterSpacing:"-0.02em",
              transition:"color 0.4s",
            }}>{skill.name}</span>
            {verified && (
              <div style={{
                display:"inline-flex", alignItems:"center", gap:"5px",
                background:"rgba(0,220,120,0.15)", border:"1px solid rgba(0,220,120,0.40)",
                borderRadius:"100px", padding:"2px 9px",
              }}>
                <span style={{ fontSize:"9px" }}>✓</span>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"#4ade80", letterSpacing:"0.1em", fontWeight:"700" }}>VERIFIED</span>
              </div>
            )}
          </div>

          {/* GitHub link */}
          {skill.githubUrl && (
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"10px" }}>
              <span style={{ fontSize:"11px" }}>🐙</span>
              <a href={skill.githubUrl} target="_blank" rel="noreferrer" style={{
                fontFamily:"'Sora',sans-serif", fontSize:"11px",
                color: verified ? "rgba(74,222,128,0.75)" : "rgba(246,56,220,0.75)",
                textDecoration:"none", wordBreak:"break-all",
                transition:"color 0.2s",
              }}
                onMouseEnter={e => e.target.style.color="#fff"}
                onMouseLeave={e => e.target.style.color = verified ? "rgba(74,222,128,0.75)" : "rgba(246,56,220,0.75)"}
              >{skill.githubUrl}</a>
            </div>
          )}

          {/* Score bar (only when verified) */}
          {verified && skill.score !== null && (
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"4px" }}>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"rgba(74,222,128,0.7)", letterSpacing:"0.1em", whiteSpace:"nowrap" }}>SKILL SCORE</span>
              <div style={{ flex:1, height:"5px", borderRadius:"3px", background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
                <div style={{
                  height:"100%", width:`${skill.score}%`,
                  background:"linear-gradient(90deg,#16a34a,#4ade80)",
                  borderRadius:"3px", boxShadow:"0 0 8px rgba(74,222,128,0.45)",
                  transition:"width 1.2s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
              <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:"800", fontSize:"14px", color:"#4ade80", minWidth:"38px", textAlign:"right", animation:"scoreReveal 0.5s ease" }}>{skill.score}<span style={{ fontSize:"10px", fontWeight:"500", opacity:0.7 }}>/100</span></span>
            </div>
          )}

          {/* Verifying spinner */}
          {verifying && (
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginTop:"6px" }}>
              <div style={{ width:12, height:12, borderRadius:"50%", border:"2px solid rgba(246,56,220,0.25)", borderTopColor:"#F638DC", animation:"spin 0.7s linear infinite" }} />
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"rgba(246,56,220,0.7)", letterSpacing:"0.08em" }}>RUNNING AI VERIFICATION...</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display:"flex", flexDirection:"column", gap:"6px", flexShrink:0 }}>
          {!verified && !verifying && (
            <button className="verify-btn" onClick={() => onVerify(skill)}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 5.5L5 7L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Verify Skill
            </button>
          )}
          <button onClick={() => onDelete(skill.id)} style={{
            padding:"5px 12px", borderRadius:"6px", border:"1px solid rgba(255,255,255,0.07)",
            background:"transparent", color:"rgba(255,255,255,0.25)",
            fontFamily:"'Sora',sans-serif", fontSize:"11px", cursor:"pointer",
            transition:"border-color 0.2s,color 0.2s",
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,80,80,0.4)";e.currentTarget.style.color="rgba(255,100,100,0.8)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";e.currentTarget.style.color="rgba(255,255,255,0.25)";}}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function Profile() {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [draft, setDraft]         = useState(null);
  const [saved, setSaved]         = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [interviews, setInterviews] = useState([]);
  const [skills, setSkills]           = useState([]);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillError, setSkillError] = useState("");

  useEffect(() => {
    getMyCandidateProfile()
      .then(res => {
        const mapped = {
          id:             res.id             || "",
          name:           res.name           || "",
          email:          res.email          || "",
          organisation:   res.organisation   || "",
          location:       res.location       || "",
          mobile_no:      res.mobile_no      || "",
          dob:            res.dob            || "",
          experience_years: res.experience_years || 0,
          github_url:     res.github_link    || "",
          linkedin_url:   res.linkedin_link  || "",
          resume_url:     res.resume_url     || "",
        };
        setData(mapped);
        setDraft(mapped);

        if (res?.id) {
          listSkills(res.id)
            .then((rows) => {
              const normalized = Array.isArray(rows)
                ? rows.map((item) => ({
                  id: item.id,
                  name: item.skill_name,
                  githubUrl: item.github_url || "",
                  verified: Number(item.score || 0) > 0,
                  score: Number.isFinite(Number(item.score)) ? Math.round(Number(item.score)) : null,
                  verifying: false,
                }))
                : [];
              setSkills(normalized);
            })
            .catch(() => setSkills([]));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    getMyInterviews()
      .then(res => setInterviews(Array.isArray(res) ? res : []))
      .catch(() => setInterviews([]));
  }, []);

  const handleAddSkill = async (skill) => {
    if (!skill?.name || !skill?.name.trim() || !data?.id) {
      return;
    }

    setSkillError("");

    try {
      const created = await addSkill({
        candidate_id: data.id,
        skill_name: skill.name.trim(),
        github_url: skill.githubUrl?.trim() || "",
      });

      const mapped = {
        id: created?.id,
        name: created?.skill_name || skill.name.trim(),
        githubUrl: created?.github_url || skill.githubUrl?.trim() || "",
        verified: Number(created?.score || 0) > 0,
        score: Number.isFinite(Number(created?.score)) ? Math.round(Number(created.score)) : null,
        verifying: false,
      };

      setSkills((prev) => [...prev, mapped]);
      setShowAddSkill(false);
    } catch (error) {
      setSkillError(error?.message || "Failed to add skill. Please try again.");
    }
  };

  const handleDeleteSkill = async (id) => {
    try {
      await deleteSkill(id);
    } catch {}
    setSkills((prev) => prev.filter((s) => s.id !== id));
  };

  const handleVerifySkill = (skill) => {
    if (!skill?.id) {
      return;
    }

    window.location.href = `/skill-verify?skill=${encodeURIComponent(skill.name || "Skill")}&skillId=${encodeURIComponent(skill.id)}`;
  };

  const upcoming   = interviews.filter(i=>i.status==="UPCOMING");
  const completed  = interviews.filter(i=>i.status==="COMPLETED");
  const filtered   = activeTab==="all" ? interviews : activeTab==="upcoming" ? upcoming : completed;

  const startEdit = () => { setDraft({...data}); setEditing(true); setSaved(false); };
  const cancelEdit= () => { setEditing(false); };
  const saveEdit  = async () => {
    try {
      await updateMyCandidateProfile({
        mobile_no:        data.mobile_no || "",
        dob:              data.dob || new Date().toISOString().split("T")[0],
        experience_years: parseInt(draft.experience_years) || 0,
        organisation:     draft.organisation || "",
        location:         draft.location || data.location || "",
        github_link:      draft.github_url || "",
        linkedin_link:    draft.linkedin_url || "",
        resume_url:       draft.resume_url || "",
      });

      setData({ ...data, ...draft });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setEditing(false);
    }
  };
  const d = f => v => setDraft(prev=>({...prev,[f]:v}));

  if (loading) return (
    <>
      <style>{GLOBAL}</style>
      <Header />
      <div style={{ minHeight:"calc(100vh - 68px)", background:"#200F21", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"16px" }}>
          <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid rgba(246,56,220,0.25)", borderTopColor:"#F638DC", animation:"spin 0.8s linear infinite" }} />
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"11px", color:"rgba(246,56,220,0.7)", letterSpacing:"0.1em" }}>LOADING PROFILE...</span>
        </div>
      </div>
    </>
  );

  if (!data) return (
    <>
      <style>{GLOBAL}</style>
      <Header />
      <div style={{ minHeight:"calc(100vh - 68px)", background:"#200F21", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", padding:"0 24px" }}>
          <div style={{ fontSize:"40px", marginBottom:"16px" }}>📎</div>
          <p style={{ fontFamily:"'Sora',sans-serif", fontSize:"16px", color:"rgba(255,255,255,0.5)", marginBottom:"16px" }}>Profile not found. Please complete registration first.</p>
          <a href="/register" style={{ color:"#F638DC", fontFamily:"'Sora',sans-serif", fontWeight:"600" }}>Go to Registration →</a>
        </div>
      </div>
    </>
  );

  const initials = data.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  return (
    <>
      <style>{GLOBAL}</style>
      <Header />

      <div style={{ minHeight:"calc(100vh - 68px)", background:C.bg, fontFamily:"'Sora',sans-serif", position:"relative", overflow:"hidden", paddingBottom:"80px" }}>
        <NeuralCanvas />

        {/* blobs */}
        <div style={{ position:"fixed", top:"-180px", right:"-160px", width:"500px", height:"500px", borderRadius:"50%", background:`radial-gradient(circle,rgba(90,61,92,0.28) 0%,transparent 70%)`, animation:"floatA 18s ease-in-out infinite", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"fixed", bottom:"-140px", left:"-140px", width:"440px", height:"440px", borderRadius:"50%", background:`radial-gradient(circle,rgba(246,56,220,0.09) 0%,transparent 70%)`, animation:"floatB 22s ease-in-out infinite", pointerEvents:"none", zIndex:0 }} />

        {/* rings */}
        <div style={{ position:"fixed", top:"5%", left:"-220px", width:"500px", height:"500px", borderRadius:"50%", border:`1px solid rgba(246,56,220,0.06)`, animation:"ringRotate 45s linear infinite", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"fixed", bottom:"3%", right:"-130px", width:"340px", height:"340px", borderRadius:"50%", border:`1px solid rgba(90,61,92,0.07)`, animation:"ringRotateRev 32s linear infinite", pointerEvents:"none", zIndex:0 }} />

        {/* left accent */}
        <div style={{ position:"fixed", left:0, top:0, bottom:0, width:"2px", background:`linear-gradient(to bottom,transparent,${C.dark},${C.mid},${C.vivid},${C.mid},transparent)`, backgroundSize:"100% 300%", animation:"borderFlow 6s ease infinite", opacity:0.55, pointerEvents:"none", zIndex:1 }} />

        {/* ── Page content ── */}
        <div style={{ maxWidth:"1160px", margin:"0 auto", padding:"44px 28px 0", position:"relative", zIndex:2 }}>

          {/* Breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"28px", animation:"fadeIn 0.4s ease both" }}>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"rgba(255,255,255,0.25)", letterSpacing:"0.08em" }}>DASHBOARD</span>
            <span style={{ color:`rgba(246,56,220,0.5)`, fontSize:"12px" }}>›</span>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:`rgba(246,56,220,0.8)`, letterSpacing:"0.08em" }}>MY PROFILE</span>
          </div>

          {/* ── Profile hero ── */}
          <div style={{
            background:C.card, border:`1px solid rgba(246,56,220,0.16)`,
            borderRadius:"22px", padding:"32px 36px",
            backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
            boxShadow:"0 8px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
            position:"relative", overflow:"hidden", marginBottom:"24px",
            animation:"fadeUp 0.5s ease both",
          }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:"2px", background:`linear-gradient(90deg,transparent,${C.dark},${C.mid},${C.vivid},${C.mid},${C.dark},transparent)`, backgroundSize:"300% 100%", animation:"borderFlow 3s linear infinite" }} />
            <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(246,56,220,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(246,56,220,0.018) 1px,transparent 1px)`, backgroundSize:"44px 44px", pointerEvents:"none" }} />

            <div style={{ display:"flex", alignItems:"flex-start", gap:"28px", flexWrap:"wrap", position:"relative", zIndex:1 }}>
              {/* Avatar */}
              <div style={{ flexShrink:0 }}>
                <div style={{
                  width:"84px", height:"84px", borderRadius:"50%",
                  background:`linear-gradient(135deg,${C.dark},${C.vivid})`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"28px", fontWeight:"800", color:"#fff",
                  fontFamily:"'Sora',sans-serif", letterSpacing:"-0.02em",
                  animation:"avatarPulse 3s ease-in-out infinite",
                  position:"relative", overflow:"hidden",
                  boxShadow:`0 0 30px rgba(246,56,220,0.35)`,
                }}>
                  <div style={{ position:"absolute", top:0, left:"-80%", width:"55%", height:"100%", background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)", animation:"sweep 3s ease-in-out infinite" }} />
                  {initials}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"5px", marginTop:"8px", justifyContent:"center" }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:C.vivid, boxShadow:`0 0 8px ${C.vivid}`, animation:"statusBlink 2s ease-in-out infinite" }} />
                  <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:`rgba(246,56,220,0.8)`, letterSpacing:"0.1em" }}>ACTIVE</span>
                </div>
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap", marginBottom:"6px" }}>
                  <h1 style={{ fontFamily:"'Sora',sans-serif", fontWeight:"800", fontSize:"clamp(22px,3vw,30px)", color:"#fff", letterSpacing:"-0.04em", margin:0 }}>
                    {data.name}
                  </h1>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px", background:`rgba(246,56,220,0.10)`, border:`1px solid rgba(246,56,220,0.25)`, borderRadius:"100px", padding:"3px 10px" }}>
                    <span style={{ fontSize:"10px" }}>🤖</span>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:`rgba(246,56,220,0.9)`, letterSpacing:"0.08em" }}>AI INTERVIEW CANDIDATE</span>
                  </div>
                </div>
                <div style={{ fontFamily:"'Sora',sans-serif", fontSize:"13px", color:"rgba(255,255,255,0.45)", marginBottom:"16px" }}>
                  {data.email} · {data.organisation || "No organisation"}
                </div>
                <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
                  <StatChip label="Interviews" value={interviews.length} />
                  <StatChip label="Upcoming"   value={upcoming.length} glow />
                  <StatChip label="Completed"  value={completed.length} />
                  <StatChip label="Avg Score"  value={completed.length ? Math.round(completed.reduce((a,i)=>a+(i.score||0),0)/completed.length)+"%" : "—"} />
                </div>
              </div>

              {/* Edit btn */}
              <div style={{ flexShrink:0 }}>
                {!editing ? (
                  <button className="edit-btn" onClick={startEdit}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Edit Profile
                  </button>
                ) : (
                  <div style={{ display:"flex", gap:"8px" }}>
                    <button className="save-btn" onClick={saveEdit}>Save Changes</button>
                    <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                  </div>
                )}
                {saved && (
                  <div style={{ marginTop:"8px", fontFamily:"'Space Mono',monospace", fontSize:"10px", color:"#40d080", letterSpacing:"0.08em", textAlign:"right", animation:"fadeIn 0.3s ease" }}>
                    ✓ PROFILE UPDATED
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Two-col layout ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.3fr", gap:"20px", marginBottom:"24px", animation:"fadeUp 0.5s 0.1s ease both" }}>

            <SectionCard title="Profile Details" tag="IDENTITY">
              {!editing ? (
                <div>
                  <InfoRow icon="👤" label="Full Name"    value={data.name} />
                  <InfoRow icon="📧" label="Email"        value={data.email} />
                  <InfoRow icon="🏢" label="Organisation" value={data.organisation} />
                  <InfoRow icon="🧮" label="Experience (Years)" value={String(data.experience_years ?? "")} />
                  <InfoRow icon="🔗" label="LinkedIn"     value={data.linkedin_url}    link />
                  <InfoRow icon="📄" label="Resume URL" value={data.resume_url} link />
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  <EditRow label="Full Name"          icon="👤" value={draft.name}           onChange={d("name")} />
                  <EditRow label="Email"              icon="📧" value={draft.email}          onChange={d("email")}          type="email" />
                  <EditRow label="Organisation"       icon="🏢" value={draft.organisation}   onChange={d("organisation")} />
                  <EditRow label="Experience (Years)" icon="🧮" value={String(draft.experience_years ?? "")} onChange={d("experience_years")} type="number" />
                  <EditRow label="LinkedIn URL"       icon="🔗" value={draft.linkedin_url}   onChange={d("linkedin_url")} />
                  <EditRow label="Resume URL"         icon="📄" value={draft.resume_url} onChange={d("resume_url")} />
                </div>
              )}
            </SectionCard>

            <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
              <SectionCard title="GitHub Activity" tag="CONTRIBUTIONS">
                {!editing ? (
                  <div>
                    <div style={{ marginBottom:"10px" }}><InfoRow icon="🐙" label="GitHub URL" value={data.github_url} link /></div>
                    <GithubHeatmap url={data.github_url} />
                  </div>
                ) : (
                  <EditRow label="GitHub URL" icon="🐙" value={draft.github_url} onChange={d("github_url")} />
                )}
              </SectionCard>

            </div>
          </div>

          {/* ── Interviews ── */}
          <div style={{ animation:"fadeUp 0.5s 0.2s ease both" }}>
            <div style={{
              background:C.card, border:`1px solid rgba(246,56,220,0.14)`,
              borderRadius:"22px", overflow:"hidden",
              backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)",
              boxShadow:"0 6px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
              position:"relative",
            }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:"1.5px", background:`linear-gradient(90deg,transparent,${C.dark},${C.vivid},transparent)`, backgroundSize:"200% 100%", animation:"borderFlow 3s linear infinite" }} />
              <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(246,56,220,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(246,56,220,0.018) 1px,transparent 1px)`, backgroundSize:"44px 44px", pointerEvents:"none" }} />

              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 28px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)", position:"relative", zIndex:1, flexWrap:"wrap", gap:"12px" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"3px" }}>
                    <h2 style={{ fontFamily:"'Sora',sans-serif", fontWeight:"800", fontSize:"17px", color:"#fff", letterSpacing:"-0.03em", margin:0 }}>My Interview Sessions</h2>
                    <div style={{ display:"flex", alignItems:"center", gap:"5px", background:`rgba(246,56,220,0.10)`, border:`1px solid rgba(246,56,220,0.22)`, borderRadius:"100px", padding:"2px 9px" }}>
                      <div style={{ width:5, height:5, borderRadius:"50%", background:C.vivid, animation:"blink 2s ease-in-out infinite" }} />
                      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:`rgba(246,56,220,0.8)`, letterSpacing:"0.1em" }}>{interviews.length} TOTAL</span>
                    </div>
                  </div>
                  <p style={{ fontFamily:"'Sora',sans-serif", fontSize:"12px", color:"rgba(255,255,255,0.35)", margin:0 }}>Interviews you accepted appear here — AI evaluated, human reviewed</p>
                </div>

                {/* Tab switcher */}
                <div style={{ display:"flex", gap:"6px", background:"rgba(255,255,255,0.04)", padding:"4px", borderRadius:"9px", border:"1px solid rgba(255,255,255,0.06)" }}>
                  {[["all","All",interviews.length],["upcoming","Upcoming",upcoming.length],["completed","Completed",completed.length]].map(([key,label,count])=>(
                    <button key={key} onClick={()=>setActiveTab(key)} style={{
                      padding:"6px 14px", borderRadius:"6px", border:"none", cursor:"pointer",
                      fontFamily:"'Sora',sans-serif", fontSize:"12px", fontWeight:"600",
                      background: activeTab===key ? `linear-gradient(135deg,${C.dark},${C.vivid})` : "transparent",
                      color: activeTab===key ? "#fff" : "rgba(255,255,255,0.4)",
                      boxShadow: activeTab===key ? `0 2px 12px rgba(246,56,220,0.30)` : "none",
                      transition:"all 0.2s",
                    }}>
                      {label} <span style={{ opacity:0.7 }}>({count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards grid */}
              <div style={{ padding:"22px 28px", position:"relative", zIndex:1 }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"48px 20px" }}>
                    <div style={{ fontSize:"36px", marginBottom:"12px" }}>📭</div>
                    <p style={{ fontFamily:"'Sora',sans-serif", fontSize:"14px", color:"rgba(255,255,255,0.3)" }}>No interviews in this category yet.</p>
                    <p style={{ fontFamily:"'Space Mono',monospace", fontSize:"11px", color:`rgba(246,56,220,0.5)`, marginTop:"6px", letterSpacing:"0.06em" }}>PENDING INVITATIONS FROM RECRUITERS</p>
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:"16px" }}>
                    {filtered.map(iv => <InterviewCard key={iv.id} iv={iv} />)}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", padding:"12px 28px", display:"flex", alignItems:"center", gap:"10px", position:"relative", zIndex:1 }}>
                <span style={{ fontSize:"12px" }}>ℹ️</span>
                <span style={{ fontFamily:"'Sora',sans-serif", fontSize:"11px", color:"rgba(255,255,255,0.25)" }}>
                  Only interviews you accepted via email are displayed here. Pending invitations are in your inbox.
                </span>
              </div>
            </div>
          </div>

          {/* ── Skills Dashboard ── */}
          <div style={{ animation:"fadeUp 0.5s 0.3s ease both", marginTop:"24px" }}>
            <div style={{
              background:C.card, border:`1px solid rgba(246,56,220,0.14)`,
              borderRadius:"22px", overflow:"visible",
              backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)",
              boxShadow:"0 6px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
              position:"relative",
            }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:"1.5px", borderRadius:"22px 22px 0 0", background:`linear-gradient(90deg,transparent,${C.dark},${C.vivid},transparent)`, backgroundSize:"200% 100%", animation:"borderFlow 3s linear infinite" }} />
              <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(rgba(246,56,220,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(246,56,220,0.018) 1px,transparent 1px)`, backgroundSize:"44px 44px", pointerEvents:"none", borderRadius:"22px" }} />

              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 28px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)", position:"relative", zIndex:1, flexWrap:"wrap", gap:"12px" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"3px" }}>
                    <h2 style={{ fontFamily:"'Sora',sans-serif", fontWeight:"800", fontSize:"17px", color:"#fff", letterSpacing:"-0.03em", margin:0 }}>Skills & Verification</h2>
                    <div style={{ display:"flex", alignItems:"center", gap:"5px", background:`rgba(246,56,220,0.10)`, border:`1px solid rgba(246,56,220,0.22)`, borderRadius:"100px", padding:"2px 9px" }}>
                      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:`rgba(246,56,220,0.8)`, letterSpacing:"0.1em" }}>{skills.length} ADDED · {skills.filter(s=>s.verified).length} VERIFIED</span>
                    </div>
                  </div>
                  <p style={{ fontFamily:"'Sora',sans-serif", fontSize:"12px", color:"rgba(255,255,255,0.35)", margin:0 }}>Add skills with supporting projects — verify them via AI to display a score</p>
                </div>
                <button className="add-skill-btn" onClick={() => setShowAddSkill(v => !v)}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  {showAddSkill ? "Cancel" : "Add Skill"}
                </button>
              </div>

              {/* Add Skill Panel */}
              {showAddSkill && (
                <div style={{ padding:"0 28px", position:"relative", zIndex:2 }}>
                  <AddSkillPanel onSave={handleAddSkill} onCancel={() => setShowAddSkill(false)} />
                  {skillError && (
                    <div style={{ marginTop:"10px", fontFamily:"'Sora',sans-serif", fontSize:"12px", color:"#fca5a5" }}>
                      {skillError}
                    </div>
                  )}
                </div>
              )}

              {/* Skills grid */}
              <div style={{ padding:"20px 28px 24px", position:"relative", zIndex:1 }}>
                {skills.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"40px 20px" }}>
                    <div style={{ fontSize:"34px", marginBottom:"10px" }}>🧠</div>
                    <p style={{ fontFamily:"'Sora',sans-serif", fontSize:"14px", color:"rgba(255,255,255,0.28)" }}>No skills added yet.</p>
                    <p style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:`rgba(246,56,220,0.45)`, marginTop:"5px", letterSpacing:"0.06em" }}>CLICK "ADD SKILL" TO GET STARTED</p>
                  </div>
                ) : (
                  <>
                    {/* Unverified first, then verified */}
                    {[...skills.filter(s=>!s.verified), ...skills.filter(s=>s.verified)].length > 0 && (
                      <>
                        {skills.filter(s=>!s.verified).length > 0 && (
                          <>
                            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"rgba(255,255,255,0.3)", letterSpacing:"0.12em", marginBottom:"10px" }}>PENDING VERIFICATION</div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:"12px", marginBottom: skills.filter(s=>s.verified).length > 0 ? "20px" : 0 }}>
                              {skills.filter(s=>!s.verified).map(skill => (
                                <SkillCard key={skill.id} skill={skill} onVerify={handleVerifySkill} onDelete={handleDeleteSkill} />
                              ))}
                            </div>
                          </>
                        )}
                        {skills.filter(s=>s.verified).length > 0 && (
                          <>
                            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:"rgba(74,222,128,0.55)", letterSpacing:"0.12em", marginBottom:"10px" }}>✓ VERIFIED SKILLS</div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:"12px" }}>
                              {skills.filter(s=>s.verified).map(skill => (
                                <SkillCard key={skill.id} skill={skill} onVerify={handleVerifySkill} onDelete={handleDeleteSkill} />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
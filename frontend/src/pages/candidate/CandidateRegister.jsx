// src/pages/candidate/CandidateRegister.jsx
import { useState, useEffect, useRef } from "react";
import Header from "../../components/Header";

/* ── New Palette ── */
const C = {
  bg:     "#200F21",
  dark:   "#382039",
  mid:    "#5A3D5C",
  vivid:  "#F638DC",
  text:   "#FFFFFF",
  textMid:"rgba(255,255,255,0.78)",
  textDim:"rgba(255,255,255,0.52)",
  border: "rgba(246,56,220,0.18)",
  inputBg:"rgba(32,15,33,0.70)",
};

/* ── Neural network canvas background ── */
function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, W, H;

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const N = 38;
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 2.5 + 1, pulse: Math.random() * Math.PI * 2,
    }));
    const packets = Array.from({ length: 12 }, () => ({ t: Math.random(), from: 0, to: 1, speed: 0.003 + Math.random() * 0.003 }));
    const DIST = 160;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.pulse += 0.018;
      });

      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < DIST) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(246,56,220,${(1 - d / DIST) * 0.16})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      packets.forEach(p => {
        p.t += p.speed;
        if (p.t >= 1) { p.t = 0; p.from = Math.floor(Math.random() * N); p.to = Math.floor(Math.random() * N); }
        const a = nodes[p.from], b = nodes[p.to];
        ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * p.t, a.y + (b.y - a.y) * p.t, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(246,56,220,0.75)`;
        ctx.shadowColor = C.vivid; ctx.shadowBlur = 8;
        ctx.fill(); ctx.shadowBlur = 0;
      });

      nodes.forEach(n => {
        const pulse = 0.5 + 0.5 * Math.sin(n.pulse);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + pulse * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(246,56,220,${0.20 + pulse * 0.30})`;
        ctx.shadowColor = C.vivid; ctx.shadowBlur = 6 + pulse * 8;
        ctx.fill(); ctx.shadowBlur = 0;
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", opacity:0.5 }} />;
}

/* ── Typing animation ── */
function TypedTag({ texts }) {
  const [idx, setIdx] = useState(0);
  const [disp, setDisp] = useState("");
  const [del, setDel] = useState(false);

  useEffect(() => {
    const str = texts[idx];
    let timeout;
    if (!del && disp.length < str.length)         timeout = setTimeout(() => setDisp(str.slice(0, disp.length + 1)), 65);
    else if (!del && disp.length === str.length)   timeout = setTimeout(() => setDel(true), 1800);
    else if (del && disp.length > 0)               timeout = setTimeout(() => setDisp(disp.slice(0, -1)), 38);
    else if (del && disp.length === 0)             { setDel(false); setIdx((idx + 1) % texts.length); }
    return () => clearTimeout(timeout);
  }, [disp, del, idx, texts]);

  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"13px", color:C.vivid, letterSpacing:"0.04em" }}>
      {disp}<span style={{ borderRight:`2px solid ${C.vivid}`, marginLeft:"1px", animation:"blink 1s step-end infinite" }}>&nbsp;</span>
    </span>
  );
}

/* ── Stat badge ── */
function StatBadge({ icon, value, label }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", gap:"4px",
      padding:"14px 20px", borderRadius:"12px",
      background:`rgba(56,32,57,0.55)`,
      border:`1px solid rgba(246,56,220,0.20)`,
      backdropFilter:"blur(10px)", minWidth:"90px",
    }}>
      <span style={{ fontSize:"18px" }}>{icon}</span>
      <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:"800", fontSize:"18px", color:"#fff", letterSpacing:"-0.03em", lineHeight:1 }}>{value}</span>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", color:`rgba(246,56,220,0.7)`, letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</span>
    </div>
  );
}

/* ── Step badge ── */
function StepBadge({ n, active, done }) {
  return (
    <div style={{
      width:30, height:30, borderRadius:"50%", flexShrink:0,
      background: done ? `linear-gradient(135deg,${C.dark},${C.vivid})` : "transparent",
      border: active ? `1.5px solid ${C.vivid}` : done ? "none" : "1px solid rgba(255,255,255,0.12)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:"12px", fontWeight:"600", fontFamily:"'Plus Jakarta Sans',sans-serif",
      color: done ? "#fff" : active ? C.vivid : C.textDim,
      transition:"all 0.35s",
      boxShadow: active ? `0 0 0 4px rgba(246,56,220,0.15),0 0 18px rgba(246,56,220,0.45)` : done ? `0 2px 12px rgba(246,56,220,0.45)` : "none",
      animation: active ? "glowPulse 2.5s ease-in-out infinite" : "none",
    }}>
      {done ? "✓" : n}
    </div>
  );
}

/* ── Field ── */
function Field({ label, type="text", placeholder, value, onChange, required, colSpan }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="field-wrap" style={{ gridColumn:colSpan?"1/-1":undefined, display:"flex", flexDirection:"column", gap:"6px" }}>
      <label className="field-label" style={{
        fontSize:"10px", fontWeight:"700", letterSpacing:"0.10em", textTransform:"uppercase",
        color: focused ? C.vivid : "rgba(255,255,255,0.38)",
        fontFamily:"'JetBrains Mono',monospace", transition:"color 0.2s",
      }}>
        {label}{required && <span style={{ color:C.vivid, marginLeft:3 }}>*</span>}
      </label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        required={required} className="reg-input"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
    </div>
  );
}

/* ── TextArea ── */
function TextArea({ label, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="field-wrap" style={{ gridColumn:"1/-1", display:"flex", flexDirection:"column", gap:"6px" }}>
      <label className="field-label" style={{
        fontSize:"10px", fontWeight:"700", letterSpacing:"0.10em", textTransform:"uppercase",
        color: focused ? C.vivid : "rgba(255,255,255,0.38)",
        fontFamily:"'JetBrains Mono',monospace", transition:"color 0.2s",
      }}>
        {label}
      </label>
      <textarea placeholder={placeholder} value={value} onChange={onChange} className="reg-textarea"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
    </div>
  );
}

/* ── Select ── */
function Select({ label, options, value, onChange, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="field-wrap" style={{ gridColumn:"1/-1", display:"flex", flexDirection:"column", gap:"6px" }}>
      <label className="field-label" style={{
        fontSize:"10px", fontWeight:"700", letterSpacing:"0.10em", textTransform:"uppercase",
        color: focused ? C.vivid : "rgba(255,255,255,0.38)",
        fontFamily:"'JetBrains Mono',monospace", transition:"color 0.2s",
      }}>
        {label}{required && <span style={{ color:C.vivid, marginLeft:3 }}>*</span>}
      </label>
      <select value={value} onChange={onChange} required={required} className="reg-select"
        style={{ color: value ? C.text : C.textDim }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      >
        {options.map(o => <option key={o.value} value={o.value} style={{ background:C.bg, color:"#fff" }}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ── Card heading ── */
function CardHead({ step, title, icon, subtitle }) {
  return (
    <>
      <div style={{ display:"flex", alignItems:"flex-start", gap:"14px", marginBottom:"8px", position:"relative", zIndex:1 }}>
        <div style={{
          width:"48px", height:"48px", borderRadius:"13px", flexShrink:0,
          background:`linear-gradient(135deg,${C.dark},${C.vivid})`,
          backgroundSize:"200% 200%", animation:"gradPulse 4s ease infinite",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:"21px",
          boxShadow:`0 0 28px rgba(246,56,220,0.50),inset 0 1px 0 rgba(255,255,255,0.12)`,
          position:"relative", overflow:"hidden",
        }}>
          <div style={{ position:"absolute", top:0, left:"-80%", width:"50%", height:"100%", background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.3),transparent)", animation:"sweep 2.5s ease-in-out infinite", pointerEvents:"none" }} />
          {icon}
        </div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"3px" }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", fontWeight:"500", letterSpacing:"0.14em", textTransform:"uppercase", color:C.vivid }}>STEP {step} / 2</span>
            <div style={{ width:1, height:10, background:`rgba(246,56,220,0.4)` }} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em" }}>{step===1 ? "IDENTITY" : "CREDENTIALS"}</span>
          </div>
          <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:"20px", fontWeight:"800", color:"#fff", letterSpacing:"-0.03em", marginBottom:"2px" }}>{title}</h2>
          <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:"12px", color:"rgba(255,255,255,0.35)", letterSpacing:"-0.01em" }}>{subtitle}</p>
        </div>
      </div>
      <div style={{
        height:"1px", marginBottom:"28px",
        background:`linear-gradient(90deg,transparent,${C.dark},${C.mid},${C.vivid},${C.mid},transparent)`,
        backgroundSize:"300% 100%", animation:"borderFlow 3s linear infinite", opacity:0.7,
        position:"relative", zIndex:1,
      }} />
    </>
  );
}

/* ── Global CSS ── */
const GLOBAL = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
  html,body,#root { min-height:100vh; background:${C.bg}; }

  ::placeholder { color:rgba(255,255,255,0.16)!important; font-family:'Sora',sans-serif; font-size:13px; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:${C.bg}; }
  ::-webkit-scrollbar-thumb { background:${C.mid}; border-radius:4px; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes floatA    { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.03)} }
  @keyframes floatB    { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(16px) scale(0.97)} }
  @keyframes sweep     { 0%{left:-120%} 100%{left:160%} }
  @keyframes borderFlow{ 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
  @keyframes gradPulse { 0%,100%{background-position:0% 60%} 50%{background-position:100% 40%} }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 16px rgba(246,56,220,0.28)} 50%{box-shadow:0 0 38px rgba(246,56,220,0.65),0 0 70px rgba(90,61,92,0.25)} }
  @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes ringRotate    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ringRotateRev { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
  @keyframes scanline  { 0%{top:-4%} 100%{top:104%} }
  @keyframes dataFlow  { 0%{transform:translateY(0px);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(-120px);opacity:0} }

  /* ── Inputs ── */
  .reg-input,.reg-textarea,.reg-select {
    width:100%; padding:11px 14px; border-radius:8px;
    border:1px solid rgba(246,56,220,0.18);
    background:rgba(32,15,33,0.70);
    color:#fff; font-size:14px;
    font-family:'Sora',sans-serif; font-weight:400; letter-spacing:-0.01em;
    outline:none;
    transition:border-color 0.2s,box-shadow 0.2s,background 0.2s;
    box-sizing:border-box; caret-color:#F638DC;
  }
  .reg-input:focus,.reg-textarea:focus,.reg-select:focus {
    border-color:rgba(246,56,220,0.70);
    box-shadow:0 0 0 3px rgba(246,56,220,0.12),0 0 18px rgba(246,56,220,0.10);
    background:rgba(56,32,57,0.55);
  }
  .reg-select {
    appearance:none; cursor:pointer;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23F638DC' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 13px center; padding-right:36px;
  }
  .reg-textarea { resize:vertical; min-height:108px; line-height:1.65; }
  .field-wrap:focus-within .field-label { color:#F638DC!important; }

  /* ── Buttons ── */
  .btn-primary {
    width:100%; padding:14px 20px; border-radius:9px; border:none;
    font-family:'Sora',sans-serif; font-size:14px; font-weight:700; letter-spacing:0.01em;
    color:#fff; cursor:pointer; position:relative; overflow:hidden;
    background:linear-gradient(135deg,#382039 0%,#5A3D5C 45%,#F638DC 80%,#ff6ae6 100%);
    background-size:220% 220%; animation:gradPulse 4s ease infinite;
    box-shadow:0 4px 26px rgba(246,56,220,0.40),inset 0 1px 0 rgba(255,255,255,0.1);
    transition:transform 0.2s,box-shadow 0.2s;
  }
  .btn-primary::before {
    content:''; position:absolute; top:0; left:-120%; width:55%; height:100%;
    background:linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent);
    animation:sweep 2.6s ease-in-out infinite; pointer-events:none;
  }
  .btn-primary:hover { transform:translateY(-2px); box-shadow:0 10px 38px rgba(246,56,220,0.55),0 0 48px rgba(90,61,92,0.22); }

  .btn-back {
    flex:0 0 auto; padding:14px 22px; border-radius:9px;
    border:1px solid rgba(246,56,220,0.22); background:transparent;
    color:rgba(255,255,255,0.45); font-family:'Sora',sans-serif; font-size:14px; font-weight:500;
    cursor:pointer; transition:border-color 0.2s,color 0.2s,transform 0.15s;
  }
  .btn-back:hover { border-color:rgba(246,56,220,0.60); color:#F638DC; transform:translateY(-1px); }

  .signin-link { color:#F638DC; font-weight:500; cursor:pointer; font-family:'Sora',sans-serif; text-decoration:underline; text-underline-offset:3px; transition:opacity 0.2s; }
  .signin-link:hover { opacity:0.65; }

  .feat-pill {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(56,32,57,0.50); border:1px solid rgba(246,56,220,0.22);
    border-radius:6px; padding:5px 11px;
    font-family:'Space Mono',monospace; font-size:10px; font-weight:500;
    color:rgba(246,56,220,0.85); letter-spacing:0.04em; white-space:nowrap;
  }
`;

/* ── Floating binary particles ── */
function DataParticle({ x, delay }) {
  return (
    <div style={{
      position:"fixed", left:x, bottom:"0%",
      fontFamily:"'JetBrains Mono',monospace", fontSize:"10px",
      color:`rgba(246,56,220,0.35)`, letterSpacing:"0.1em",
      animation:`dataFlow ${6 + Math.random() * 4}s linear ${delay}s infinite`,
      pointerEvents:"none", zIndex:0, userSelect:"none",
    }}>
      {Math.random() > 0.5 ? "01" : "10"}
    </div>
  );
}

/* ── Main ── */
export default function CandidateRegister() {
  const [step, setStep]           = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [personal, setPersonal] = useState({ name:"", email:"", phone:"", dob:"", organisation:"", location:"", gender:"" });
  const [professional, setProfessional] = useState({ github_url:"", linkedin_url:"", leetcode_url:"", additional_urls:"", previous_exp:"" });

  const p  = f => e => setPersonal({ ...personal, [f]: e.target.value });
  const pr = f => e => setProfessional({ ...professional, [f]: e.target.value });

  const next   = e => { e.preventDefault(); setStep(2); window.scrollTo({ top:0, behavior:"smooth" }); };
  const back   = ()  => { setStep(1); window.scrollTo({ top:0, behavior:"smooth" }); };
  const submit = e => { e.preventDefault(); setSubmitted(true); };

  return (
    <>
      <style>{GLOBAL}</style>
      <Header />

      <div style={{
        minHeight:"calc(100vh - 68px)",
        background:C.bg,
        display:"flex", flexDirection:"column", alignItems:"center",
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        position:"relative", overflow:"hidden",
        paddingBottom:"90px",
      }}>

        {/* Neural canvas */}
        <NeuralCanvas />

        {/* Floating binary particles */}
        {["8%","18%","32%","47%","61%","74%","85%","93%"].map((x, i) => (
          <DataParticle key={i} x={x} delay={i * 1.1} />
        ))}

        {/* ── Ambient blobs ── */}
        <div style={{ position:"fixed", top:"-200px", right:"-180px", width:"550px", height:"550px", borderRadius:"50%", background:`radial-gradient(circle,rgba(90,61,92,0.32) 0%,transparent 70%)`, animation:"floatA 18s ease-in-out infinite", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"fixed", bottom:"-150px", left:"-150px", width:"480px", height:"480px", borderRadius:"50%", background:`radial-gradient(circle,rgba(246,56,220,0.10) 0%,transparent 70%)`, animation:"floatB 22s ease-in-out infinite", pointerEvents:"none", zIndex:0 }} />

        {/* Rings */}
        <div style={{ position:"fixed", top:"8%", left:"-220px", width:"500px", height:"500px", borderRadius:"50%", border:`1px solid rgba(246,56,220,0.07)`, animation:"ringRotate 40s linear infinite", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"fixed", bottom:"5%", right:"-140px", width:"360px", height:"360px", borderRadius:"50%", border:`1px solid rgba(90,61,92,0.08)`, animation:"ringRotateRev 30s linear infinite", pointerEvents:"none", zIndex:0 }} />

        {/* Left edge */}
        <div style={{ position:"fixed", left:0, top:0, bottom:0, width:"2px", background:`linear-gradient(to bottom,transparent,${C.dark},${C.mid},${C.vivid},${C.mid},transparent)`, backgroundSize:"100% 300%", animation:"borderFlow 6s ease infinite", opacity:0.7, pointerEvents:"none", zIndex:1 }} />

        {/* Scanline */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:3, overflow:"hidden" }}>
          <div style={{ position:"absolute", left:0, right:0, height:"1px", background:`linear-gradient(90deg,transparent,rgba(246,56,220,0.06),transparent)`, animation:"scanline 12s linear infinite" }} />
        </div>

        {/* ── Content ── */}
        <div style={{ width:"100%", maxWidth:"940px", padding:"52px 32px 0", position:"relative", zIndex:2, animation:"fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both" }}>

          {!submitted ? (
            <>
              {/* ── Hero ── */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:"44px" }}>

                {/* typed system tag */}
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:"10px",
                  background:`rgba(32,15,33,0.75)`, border:`1px solid rgba(246,56,220,0.28)`,
                  borderRadius:"8px", padding:"8px 16px", marginBottom:"22px",
                  backdropFilter:"blur(10px)",
                }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:C.vivid, boxShadow:`0 0 8px ${C.vivid}`, animation:"glowPulse 2s infinite", flexShrink:0 }} />
                  <TypedTag texts={["AI-POWERED ASSESSMENTS", "HUMAN EVALUATORS", "REAL-TIME FEEDBACK", "SMART MATCHING ENGINE"]} />
                </div>

                {/* headline */}
                <h1 style={{
                  fontFamily:"'Plus Jakarta Sans',sans-serif",
                  fontSize:"clamp(34px,5.5vw,60px)",
                  fontWeight:"800",
                  color:"#fff",
                  lineHeight:"1.06",
                  letterSpacing:"-0.04em",
                  textAlign:"center",
                  marginBottom:"16px",
                  maxWidth:"720px",
                }}>
                  Where AI Precision Meets{" "}
                  <span style={{
                    background:`linear-gradient(135deg,${C.mid},${C.vivid},#ff6ae6,${C.vivid})`,
                    backgroundSize:"300% 300%",
                    WebkitBackgroundClip:"text",
                    WebkitTextFillColor:"transparent",
                    animation:"gradPulse 3.5s ease infinite",
                  }}>
                    Human Insight.
                  </span>
                </h1>

                <p style={{ fontSize:"15px", color:C.textMid, lineHeight:"1.75", maxWidth:"460px", textAlign:"center", fontWeight:"400", letterSpacing:"-0.01em", marginBottom:"28px" }}>
                  Register once. Get interviewed by AI, reviewed by experts, and matched to roles that fit you — not just your keywords.
                </p>

                {/* feature pills */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", justifyContent:"center", marginBottom:"32px" }}>
                  {[
                    { icon:"🤖", label:"AI INTERVIEWER" },
                    { icon:"👁️", label:"HUMAN REVIEW" },
                    { icon:"⚡", label:"INSTANT FEEDBACK" },
                    { icon:"🎯", label:"SMART MATCHING" },
                    { icon:"🔒", label:"PRIVACY FIRST" },
                  ].map(f => (
                    <div key={f.label} className="feat-pill">
                      <span style={{ fontSize:"12px" }}>{f.icon}</span>
                      {f.label}
                    </div>
                  ))}
                </div>

                {/* stats row */}
                <div style={{ display:"flex", gap:"12px", flexWrap:"wrap", justifyContent:"center" }}>
                  <StatBadge icon="🧠" value="50K+"  label="Candidates" />
                  <StatBadge icon="🏢" value="1.2K+"  label="Companies" />
                  <StatBadge icon="✅" value="94%"   label="Match Rate" />
                  <StatBadge icon="⏱️" value="48h"   label="Avg Response" />
                </div>
              </div>

              {/* ── Stepper ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", maxWidth:"320px", margin:"0 auto 40px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <StepBadge n={1} active={step===1} done={step>1} />
                  <span style={{ fontSize:"13px", fontWeight:step===1?"700":"400", color:step===1?"#fff":step>1?C.textMid:C.textDim, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.01em", transition:"color 0.3s" }}>Personal</span>
                </div>
                <div style={{ flex:1, height:"1px", margin:"0 14px", background:"rgba(255,255,255,0.06)", overflow:"hidden", maxWidth:"70px", borderRadius:"2px" }}>
                  <div style={{ height:"100%", width:step>1?"100%":"0%", background:`linear-gradient(90deg,${C.dark},${C.vivid})`, transition:"width 0.55s cubic-bezier(0.4,0,0.2,1)", boxShadow:step>1?`0 0 8px ${C.vivid}`:"none" }} />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <StepBadge n={2} active={step===2} done={step>2} />
                  <span style={{ fontSize:"13px", fontWeight:step===2?"700":"400", color:step===2?"#fff":C.textDim, fontFamily:"'Plus Jakarta Sans',sans-serif", letterSpacing:"-0.01em", transition:"color 0.3s" }}>Professional</span>
                </div>
              </div>

              {/* ── Form card ── */}
              <div style={{
                background:`rgba(20,8,21,0.80)`,
                border:`1px solid rgba(246,56,220,0.18)`,
                borderRadius:"20px",
                padding:"clamp(28px,5vw,50px) clamp(26px,5vw,58px)",
                backdropFilter:"blur(28px)",
                WebkitBackdropFilter:"blur(28px)",
                boxShadow:`0 8px 64px rgba(0,0,0,0.65),0 0 0 1px rgba(246,56,220,0.05),inset 0 1px 0 rgba(255,255,255,0.04)`,
                position:"relative", overflow:"hidden",
              }}>

                {/* shimmer stripe */}
                <div style={{ position:"absolute", top:0, left:0, right:0, height:"1.5px", background:`linear-gradient(90deg,transparent,${C.dark},${C.mid},${C.vivid},${C.mid},${C.dark},transparent)`, backgroundSize:"300% 100%", animation:"borderFlow 3s linear infinite" }} />

                {/* corner glows */}
                <div style={{ position:"absolute", top:"-60px", right:"-60px", width:"180px", height:"180px", borderRadius:"50%", background:`radial-gradient(circle,rgba(90,61,92,0.25) 0%,transparent 70%)`, pointerEvents:"none" }} />
                <div style={{ position:"absolute", bottom:"-50px", left:"-50px", width:"150px", height:"150px", borderRadius:"50%", background:`radial-gradient(circle,rgba(246,56,220,0.08) 0%,transparent 70%)`, pointerEvents:"none" }} />

                {/* grid texture */}
                <div style={{ position:"absolute", inset:0, borderRadius:"inherit", backgroundImage:`linear-gradient(rgba(246,56,220,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(246,56,220,0.025) 1px,transparent 1px)`, backgroundSize:"44px 44px", pointerEvents:"none" }} />

                {/* session info bar */}
                <div style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  background:`rgba(56,32,57,0.35)`, border:`1px solid rgba(246,56,220,0.14)`,
                  borderRadius:"8px", padding:"9px 16px", marginBottom:"24px",
                  position:"relative", zIndex:1,
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:C.vivid, boxShadow:`0 0 6px ${C.vivid}`, animation:"glowPulse 2s infinite" }} />
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"10px", color:`rgba(246,56,220,0.7)`, letterSpacing:"0.08em" }}>REGISTRATION SESSION ACTIVE</span>
                  </div>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"10px", color:"rgba(255,255,255,0.25)", letterSpacing:"0.06em" }}>STEP {step} / 2</span>
                </div>

                {/* STEP 1 */}
                {step===1 && (
                  <form onSubmit={next} key="personal" style={{ animation:"fadeUp 0.32s ease both" }}>
                    <CardHead step={1} title="Personal Details" icon="👤" subtitle="Your identity layer — seen only by verified evaluators." />
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px 26px", position:"relative", zIndex:1 }}>
                      <Field label="Full Name"       placeholder="e.g. Rohan Sharma"     value={personal.name}         onChange={p("name")}         required colSpan />
                      <Field label="Email"      type="email" placeholder="you@example.com"      value={personal.email}        onChange={p("email")}        required />
                      <Field label="Phone"      type="tel"   placeholder="+91 98765 43210"       value={personal.phone}        onChange={p("phone")}        required />
                      <Field label="Date of Birth" type="date"                                    value={personal.dob}          onChange={p("dob")}          required />
                      <Field label="Organisation"   placeholder="Company / College"        value={personal.organisation} onChange={p("organisation")} />
                      <Field label="Location"        placeholder="City, State"             value={personal.location}     onChange={p("location")}     required />
                      <Select label="Gender" required value={personal.gender} onChange={p("gender")}
                        options={[
                          { value:"",           label:"Select gender" },
                          { value:"male",       label:"Male" },
                          { value:"female",     label:"Female" },
                          { value:"non-binary", label:"Non-binary" },
                          { value:"prefer-not", label:"Prefer not to say" },
                        ]}
                      />
                    </div>
                    <div style={{ position:"relative", zIndex:1, marginTop:"22px" }}>
                      <button type="submit" className="btn-primary">Continue to Professional Details →</button>
                    </div>
                  </form>
                )}

                {/* STEP 2 */}
                {step===2 && (
                  <form onSubmit={submit} key="professional" style={{ animation:"fadeUp 0.32s ease both" }}>
                    <CardHead step={2} title="Professional Details" icon="💼" subtitle="Your work signal — how the AI evaluator reads your background." />
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px 26px", position:"relative", zIndex:1 }}>
                      <Field label="GitHub URL"      placeholder="https://github.com/username"      value={professional.github_url}      onChange={pr("github_url")} />
                      <Field label="LinkedIn URL"    placeholder="https://linkedin.com/in/username" value={professional.linkedin_url}    onChange={pr("linkedin_url")} />
                      <Field label="LeetCode URL"    placeholder="https://leetcode.com/username"    value={professional.leetcode_url}    onChange={pr("leetcode_url")} />
                      <Field label="Additional URLs" placeholder="Portfolio, Dribbble, etc."        value={professional.additional_urls} onChange={pr("additional_urls")} />
                      <TextArea
                        label="Previous Experience"
                        placeholder="Briefly describe your roles, projects, or any relevant work experience..."
                        value={professional.previous_exp}
                        onChange={pr("previous_exp")}
                      />
                    </div>
                    <div style={{ display:"flex", gap:"10px", marginTop:"22px", position:"relative", zIndex:1 }}>
                      <button type="button" className="btn-back" onClick={back}>← Back</button>
                      <button type="submit" className="btn-primary" style={{ marginTop:0 }}>Launch My Profile ✦</button>
                    </div>
                  </form>
                )}
              </div>

              <p style={{ textAlign:"center", marginTop:"22px", fontSize:"13px", color:C.textDim, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Already registered?{" "}
                <span className="signin-link">Sign in here</span>
              </p>
            </>
          ) : (
            /* ── Success ── */
            <div style={{ textAlign:"center", padding:"70px 20px", animation:"fadeUp 0.55s ease both" }}>
              <div style={{
                width:100, height:100, borderRadius:"50%",
                background:`linear-gradient(135deg,${C.dark},${C.vivid})`,
                backgroundSize:"200% 200%",
                animation:"gradPulse 3s ease infinite, glowPulse 2.5s ease-in-out infinite",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"44px", margin:"0 auto 10px",
                boxShadow:`0 0 0 14px rgba(56,32,57,0.28),0 0 0 28px rgba(56,32,57,0.10),0 16px 48px rgba(246,56,220,0.45)`,
                position:"relative", overflow:"hidden",
              }}>
                <div style={{ position:"absolute", top:0, left:"-80%", width:"50%", height:"100%", background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.28),transparent)", animation:"sweep 2s ease-in-out infinite" }} />
                ✓
              </div>

              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"10px", color:C.vivid, letterSpacing:"0.14em", marginBottom:"14px", animation:"fadeIn 0.5s 0.3s both" }}>
                PROFILE COMPILED · SYSTEM READY
              </div>

              <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:"36px", fontWeight:"800", color:"#fff", marginBottom:"12px", letterSpacing:"-0.04em" }}>
                You're in the system.
              </h2>
              <p style={{ fontSize:"15px", color:C.textMid, lineHeight:"1.8", maxWidth:"360px", margin:"0 auto 12px", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Welcome,{" "}
                <strong style={{ color:"#fff", fontWeight:"700" }}>{personal.name || "Candidate"}</strong>.
                Your AI interview session is being prepared.
              </p>

              <div style={{ display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap", margin:"20px 0 32px" }}>
                {["PROFILE ACTIVE","AI QUEUE: READY","EVALUATORS NOTIFIED"].map(t => (
                  <div key={t} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", color:`rgba(246,56,220,0.85)`, letterSpacing:"0.1em", background:`rgba(56,32,57,0.50)`, border:`1px solid rgba(246,56,220,0.22)`, borderRadius:"4px", padding:"4px 10px" }}>
                    {t}
                  </div>
                ))}
              </div>

              <button className="btn-primary" style={{ width:"auto", padding:"14px 48px" }}>
                Enter Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
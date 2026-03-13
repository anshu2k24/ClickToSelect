// src/components/Header.jsx — DARK MODE
const C = { vivid:"#F638DC", lite:"#F990F0", dark:"#382039", bg:"#200F21", border:"rgba(246,56,220,0.18)" };

export default function Header() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        @keyframes hdrFlow { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
        @keyframes hdrSweep{ 0%{left:-120%} 100%{left:160%} }
        @keyframes hdrBlink{ 0%,100%{opacity:1} 50%{opacity:0.2} }
        .hdr-link {
          font-family:'Sora',sans-serif; font-size:13px; font-weight:500;
          color:rgba(255,255,255,0.68); cursor:pointer; background:none; border:none; padding:0;
          transition:color 0.22s; position:relative; text-decoration:none;
        }
        .hdr-link::after {
          content:''; position:absolute; bottom:-4px; left:0; right:100%; height:1.5px;
          background:linear-gradient(90deg,${C.vivid},${C.lite});
          transition:right 0.28s ease; box-shadow:0 0 6px ${C.vivid};
        }
        .hdr-link:hover { color:#fff; }
        .hdr-link:hover::after { right:0; }
        .hdr-btn {
          font-family:'Sora',sans-serif; font-size:13px; font-weight:600;
          color:#fff; background:transparent;
          border:1.5px solid rgba(246,56,220,0.38); border-radius:8px; padding:8px 22px;
          cursor:pointer; position:relative; overflow:hidden;
          transition:border-color 0.25s,box-shadow 0.25s,transform 0.2s;
        }
        .hdr-btn::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,${C.dark},${C.vivid});
          opacity:0; transition:opacity 0.25s;
        }
        .hdr-btn:hover { transform:translateY(-1px); border-color:${C.vivid}; box-shadow:0 4px 16px rgba(246,56,220,0.30); }
        .hdr-btn:hover::before { opacity:1; }
        .hdr-btn span { position:relative; z-index:1; }
      `}</style>

      <header style={{
        width:"100%", position:"sticky", top:0, zIndex:200,
        background:"rgba(28,10,28,0.90)",
        backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        borderBottom:`1px solid rgba(246,56,220,0.10)`,
        boxShadow:"0 1px 24px rgba(0,0,0,0.40)",
      }}>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"1.5px", background:`linear-gradient(90deg,transparent,rgba(246,56,220,0.25),${C.vivid},rgba(246,56,220,0.25),transparent)`, backgroundSize:"300% 100%", animation:"hdrFlow 4s linear infinite" }} />

        <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"0 44px", height:"68px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{
              width:38, height:38, borderRadius:"10px", flexShrink:0,
              background:`linear-gradient(135deg,${C.dark},${C.vivid})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:`0 4px 14px rgba(246,56,220,0.38)`, position:"relative", overflow:"hidden",
            }}>
              <div style={{ position:"absolute", top:0, left:"-80%", width:"55%", height:"100%", background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.28),transparent)", animation:"hdrSweep 2.8s ease-in-out infinite" }} />
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
                <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:"800", fontSize:"16px", color:"#fff", letterSpacing:"-0.03em", lineHeight:1 }}>InterviewAI</div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:`rgba(246,56,220,0.75)`, letterSpacing:"0.12em", marginTop:"2px" }}>CANDIDATE · PORTAL</div>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:"32px" }}>
            <nav style={{ display:"flex", alignItems:"center", gap:"28px" }}>
              <a href="/profile"      className="hdr-link">Profile</a>
              <a href="/register"     className="hdr-link">Register</a>
              <a href="/skill-verify" className="hdr-link">Skill Verify</a>
            </nav>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", padding:"5px 12px", borderRadius:"100px", background:`rgba(246,56,220,0.08)`, border:`1px solid rgba(246,56,220,0.18)` }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:C.vivid, boxShadow:`0 0 6px ${C.vivid}`, animation:"hdrBlink 2s ease-in-out infinite" }} />
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:`rgba(246,56,220,0.90)`, letterSpacing:"0.08em" }}>CANDIDATE</span>
            </div>
            <button className="hdr-btn"><span>Sign In</span></button>
          </div>
        </div>
      </header>
    </>
  );
}
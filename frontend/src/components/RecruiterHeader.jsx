// src/components/RecruiterHeader.jsx — DARK MODE
const C = { vivid:"#A855F7", lite:"#C084FC", dark:"#2D0059", bg:"#1A0033", border:"rgba(168,85,247,0.18)" };

export default function RecruiterHeader() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        @keyframes rHdrFlow { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
        @keyframes rHdrSweep{ 0%{left:-120%} 100%{left:160%} }
        @keyframes rHdrBlink{ 0%,100%{opacity:1} 50%{opacity:0.2} }
        .r-hdr-link {
          font-family:'Sora',sans-serif; font-size:13px; font-weight:500;
          color:rgba(255,255,255,0.68); cursor:pointer; background:none; border:none; padding:0;
          transition:color 0.22s; position:relative; text-decoration:none;
        }
        .r-hdr-link::after {
          content:''; position:absolute; bottom:-4px; left:0; right:100%; height:1.5px;
          background:linear-gradient(90deg,${C.vivid},${C.lite});
          transition:right 0.28s ease; box-shadow:0 0 6px ${C.vivid};
        }
        .r-hdr-link:hover { color:#fff; }
        .r-hdr-link:hover::after { right:0; }
        .r-hdr-btn {
          font-family:'Sora',sans-serif; font-size:13px; font-weight:600;
          color:#fff; background:transparent;
          border:1.5px solid rgba(168,85,247,0.38); border-radius:8px; padding:8px 22px;
          cursor:pointer; position:relative; overflow:hidden;
          transition:border-color 0.25s,box-shadow 0.25s,transform 0.2s;
        }
        .r-hdr-btn::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,${C.dark},${C.vivid});
          opacity:0; transition:opacity 0.25s;
        }
        .r-hdr-btn:hover { transform:translateY(-1px); border-color:${C.vivid}; box-shadow:0 4px 16px rgba(168,85,247,0.30); }
        .r-hdr-btn:hover::before { opacity:1; }
        .r-hdr-btn span { position:relative; z-index:1; }
      `}</style>

      <header style={{
        width:"100%", position:"sticky", top:0, zIndex:200,
        background:"rgba(15,0,30,0.92)",
        backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        borderBottom:`1px solid rgba(168,85,247,0.10)`,
        boxShadow:"0 1px 24px rgba(0,0,0,0.45)",
      }}>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"1.5px", background:`linear-gradient(90deg,transparent,rgba(168,85,247,0.25),${C.vivid},rgba(168,85,247,0.25),transparent)`, backgroundSize:"300% 100%", animation:"rHdrFlow 4s linear infinite" }} />

        <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"0 44px", height:"68px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{
              width:38, height:38, borderRadius:"10px", flexShrink:0,
              background:`linear-gradient(135deg,${C.dark},${C.vivid})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:`0 4px 14px rgba(168,85,247,0.38)`, position:"relative", overflow:"hidden",
            }}>
              <div style={{ position:"absolute", top:0, left:"-80%", width:"55%", height:"100%", background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.28),transparent)", animation:"rHdrSweep 2.8s ease-in-out infinite" }} />
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="7" width="14" height="10" rx="2" stroke="white" strokeWidth="1.3" fill="none"/>
                <path d="M7 7V5C7 3.9 7.9 3 9 3H11C12.1 3 13 3.9 13 5V7" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="3" y1="11" x2="17" y2="11" stroke="white" strokeWidth="1"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:"800", fontSize:"16px", color:"#fff", letterSpacing:"-0.03em", lineHeight:1 }}>InterviewAI</div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"9px", color:`rgba(168,85,247,0.80)`, letterSpacing:"0.12em", marginTop:"2px" }}>RECRUITER · PORTAL</div>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:"32px" }}>
            <nav style={{ display:"flex", alignItems:"center", gap:"28px" }}>
              <a href="/recruiter/profile"  className="r-hdr-link">Dashboard</a>
              <a href="/recruiter/profile"  className="r-hdr-link">Job Roles</a>
              <a href="/recruiter/register" className="r-hdr-link">Register</a>
            </nav>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", padding:"5px 12px", borderRadius:"100px", background:`rgba(168,85,247,0.09)`, border:`1px solid rgba(168,85,247,0.20)` }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:C.vivid, boxShadow:`0 0 6px ${C.vivid}`, animation:"rHdrBlink 2s ease-in-out infinite" }} />
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"10px", color:`rgba(168,85,247,0.92)`, letterSpacing:"0.08em" }}>RECRUITER</span>
            </div>
            <button className="r-hdr-btn"><span>Sign In</span></button>
          </div>
        </div>
      </header>
    </>
  );
}

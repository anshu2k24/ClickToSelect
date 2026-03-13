// src/pages/recruiter/RecruiterProfile.jsx — DARK MODE
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJob, getMyJobs } from "../../api/job";
import { getMyRecruiterProfile, updateMyRecruiterProfile } from "../../api/recruiter";
import RecruiterHeader from "../../components/RecruiterHeader";

const C = { bg:"#0F0020",card:"rgba(20,0,45,0.90)",vivid:"#A855F7",lite:"#C084FC",dark:"#1A0033",mid:"#2D0059",border:"rgba(168,85,247,0.18)",text:"#FFFFFF",textMid:"rgba(255,255,255,0.78)",textDim:"rgba(255,255,255,0.52)" };
const EMPTY_PROFILE = { id:"", company_name:"", company_description:"", company_website:"", location:"" };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const focusOn=e=>{e.target.style.borderColor="rgba(168,85,247,0.60)";e.target.style.boxShadow="0 0 0 3px rgba(168,85,247,0.12)";};
const focusOff=e=>{e.target.style.borderColor="rgba(168,85,247,0.22)";e.target.style.boxShadow="none";};
const iB={width:"100%",padding:"11px 14px",borderRadius:"9px",border:"1.5px solid rgba(168,85,247,0.22)",background:"rgba(15,0,32,0.70)",color:"#fff",fontFamily:"'Sora',sans-serif",fontSize:"13px",fontWeight:"500",outline:"none",caretColor:"#A855F7",transition:"border-color 0.2s,box-shadow 0.2s",boxSizing:"border-box"};
const LL={fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(168,85,247,0.80)`,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:"700"};

const GLOBAL=`
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{min-height:100vh;background:#0F0020;}
  ::placeholder{color:rgba(255,255,255,0.20)!important;font-family:'Sora',sans-serif;}
  ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:#0F0020;} ::-webkit-scrollbar-thumb{background:#2D0059;border-radius:4px;}
  @keyframes rFU{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes rSweep{0%{left:-120%}100%{left:160%}}
  @keyframes rBF{0%{background-position:0% 50%}100%{background-position:300% 50%}}
  @keyframes rGP{0%,100%{background-position:0% 60%}50%{background-position:100% 40%}}
  @keyframes rGlow{0%,100%{box-shadow:0 0 16px rgba(168,85,247,0.28)}50%{box-shadow:0 0 36px rgba(168,85,247,0.55)}}
  @keyframes rBl{0%,100%{opacity:1}50%{opacity:0.2}}
  .r-edit-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:8px;border:1.5px solid rgba(168,85,247,0.32);background:rgba(168,85,247,0.08);color:#C084FC;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;}
  .r-edit-btn:hover{background:rgba(168,85,247,0.16);border-color:rgba(168,85,247,0.60);transform:translateY(-1px);}
  .r-save-btn{padding:10px 24px;border-radius:9px;border:none;background:linear-gradient(135deg,#4C1D95,#7C3AED,#A855F7);background-size:200% 200%;animation:rGP 4s ease infinite;color:#fff;font-family:'Sora',sans-serif;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 18px rgba(168,85,247,0.40);transition:transform 0.15s,box-shadow 0.2s;}
  .r-save-btn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(168,85,247,0.55);}
  .r-save-btn:disabled{opacity:0.55;cursor:not-allowed;transform:none;box-shadow:none;animation:none;}
  .r-cancel-btn{padding:10px 20px;border-radius:9px;border:1.5px solid rgba(168,85,247,0.22);background:transparent;color:rgba(255,255,255,0.55);font-family:'Sora',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;}
  .r-cancel-btn:hover{border-color:rgba(168,85,247,0.50);color:#C084FC;}
  .r-add-job-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border-radius:9px;border:1.5px solid rgba(168,85,247,0.35);background:rgba(168,85,247,0.08);color:#C084FC;font-family:'Sora',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;}
  .r-add-job-btn:hover{background:rgba(168,85,247,0.16);border-color:#A855F7;transform:translateY(-1px);}
  .r-add-job-btn:disabled{opacity:0.55;cursor:not-allowed;transform:none;}
`;

const Bar=({bg,children,style={}})=><div style={{background:bg||C.card,border:`1px solid ${C.border}`,borderRadius:"18px",overflow:"hidden",boxShadow:"0 4px 30px rgba(0,0,0,0.50)",position:"relative",...style}}><div style={{position:"absolute",top:0,left:0,right:0,height:"2.5px",background:`linear-gradient(90deg,transparent,${C.vivid},${C.lite},transparent)`,backgroundSize:"200% 100%",animation:"rBF 3s linear infinite"}}/>{children}</div>;

function Card({title,tag,children}){return(
  <Bar><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px 12px",borderBottom:`1px solid rgba(168,85,247,0.10)`}}><h3 style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"14px",color:"#fff",letterSpacing:"-0.02em",margin:0}}>{title}</h3>{tag&&<span style={{...LL,background:`rgba(168,85,247,0.10)`,border:`1px solid rgba(168,85,247,0.22)`,borderRadius:"4px",padding:"3px 8px"}}>{tag}</span>}</div><div style={{padding:"16px 20px"}}>{children}</div></Bar>
);}
function InfoRow({icon,label,value,link}){return(
  <div style={{display:"flex",gap:"10px",padding:"9px 0",borderBottom:`1px solid rgba(168,85,247,0.08)`}}><span style={{fontSize:"13px",flexShrink:0}}>{icon}</span><div style={{flex:1}}><div style={{...LL,marginBottom:"2px"}}>{label}</div>{link&&value?<a href={value} target="_blank" rel="noreferrer" style={{fontFamily:"'Sora',sans-serif",fontSize:"13px",color:C.lite,textDecoration:"none",fontWeight:"500"}}>{value}</a>:<div style={{fontFamily:"'Sora',sans-serif",fontSize:"13px",color:value?C.text:C.textDim,lineHeight:"1.55",fontWeight:"500"}}>{value||"—"}</div>}</div></div>
);}
function EF({label,icon,value,onChange,multiline}){return(
  <div style={{display:"flex",flexDirection:"column",gap:"5px"}}><label style={LL}>{icon&&<span style={{marginRight:6}}>{icon}</span>}{label}</label>{multiline?<textarea value={value} onChange={e=>onChange(e.target.value)} rows={3} style={{...iB,resize:"vertical",lineHeight:"1.6"}} onFocus={focusOn} onBlur={focusOff}/>:<input value={value} onChange={e=>onChange(e.target.value)} style={iB} onFocus={focusOn} onBlur={focusOff}/>}</div>
);}
function StatChip({label,value}){return(
  <div style={{display:"flex",flexDirection:"column",gap:"2px",padding:"10px 14px",borderRadius:"10px",background:`rgba(168,85,247,0.09)`,border:`1px solid rgba(168,85,247,0.18)`}}><span style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"20px",color:C.lite,letterSpacing:"-0.03em"}}>{value}</span><span style={LL}>{label}</span></div>
);}
function JobCard({job,onClick}){const synced=UUID_RE.test(String(job.id||""));return(
  <div onClick={onClick} style={{background:"rgba(25,0,55,0.80)",border:`1px solid rgba(168,85,247,0.18)`,borderRadius:"14px",padding:"18px 20px",cursor:"pointer",boxShadow:"0 4px 20px rgba(0,0,0,0.45)",transition:"transform 0.2s,box-shadow 0.2s,border-color 0.2s",position:"relative",overflow:"hidden"}}
    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 36px rgba(168,85,247,0.22)";e.currentTarget.style.borderColor="rgba(168,85,247,0.42)";}}
    onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.45)";e.currentTarget.style.borderColor="rgba(168,85,247,0.18)";}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:"2.5px",background:`linear-gradient(90deg,transparent,${C.vivid},${C.lite},transparent)`,backgroundSize:"200% 100%",animation:"rBF 3s linear infinite"}}/>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",marginBottom:"3px"}}>
      <div style={{fontFamily:"'Sora',sans-serif",fontWeight:"700",fontSize:"15px",color:"#fff"}}>{job.title}</div>
      <div style={{padding:"3px 8px",borderRadius:"999px",border:synced?"1px solid rgba(74,222,128,0.30)":"1px solid rgba(251,191,36,0.30)",background:synced?"rgba(74,222,128,0.10)":"rgba(251,191,36,0.10)",fontFamily:"'Space Mono',monospace",fontSize:"9px",color:synced?"#86efac":"#fcd34d",letterSpacing:"0.05em",fontWeight:"700"}}>{synced?"SYNCED":"PENDING"}</div>
    </div>
    <div style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:`rgba(168,85,247,0.85)`,letterSpacing:"0.04em",marginBottom:"10px",fontWeight:"700"}}>{job.role}</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"10px"}}>{[["📍",job.location||"Remote"],["🕐",`${job.experience_required||0}+ yrs`]].map(m=><div key={`${job.id}-${m[0]}-${m[1]}`} style={{display:"flex",alignItems:"center",gap:"5px",padding:"3px 9px",background:`rgba(168,85,247,0.08)`,border:`1px solid rgba(168,85,247,0.18)`,borderRadius:"6px"}}><span style={{fontSize:"10px"}}>{m[0]}</span><span style={{fontFamily:"'Sora',sans-serif",fontSize:"11px",color:C.textMid,fontWeight:"500"}}>{m[1]}</span></div>)}</div>
    <p style={{fontFamily:"'Sora',sans-serif",fontSize:"12px",color:C.textDim,lineHeight:"1.6",margin:"0 0 10px",fontWeight:"500",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{job.description||"No description."}</p>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px"}}>
      <span style={{...LL,color:synced?"rgba(74,222,128,0.70)":"rgba(251,191,36,0.70)"}}>{synced?"READY FOR INTERVIEWS":"CHECK BACKEND LINK"}</span>
      <span style={{...LL,color:`rgba(168,85,247,0.65)`}}>VIEW DETAILS →</span>
    </div>
  </div>
);}
function AddJobPanel({onSave,onCancel,isSaving}){
  const [form,setForm]=useState({title:"",role:"",description:"",experience_required:"",location:""});
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const valid=form.title.trim()&&form.role.trim();
  return(
    <div style={{background:`rgba(168,85,247,0.06)`,border:`1.5px solid rgba(168,85,247,0.22)`,borderRadius:"14px",padding:"20px 22px",marginTop:"12px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px"}}><div style={{width:7,height:7,borderRadius:"50%",background:C.vivid}}/><span style={LL}>NEW JOB ROLE</span></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 18px",marginBottom:"14px"}}>
        <div style={{gridColumn:"1/-1",display:"flex",flexDirection:"column",gap:"4px"}}><label style={LL}>Job Title *</label><input placeholder="e.g. Senior Frontend Engineer" value={form.title} onChange={f("title")} style={iB} onFocus={focusOn} onBlur={focusOff}/></div>
        {[["Role Name *","role","e.g. SDE-2"],["Location","location","Bengaluru / Remote"]].map(([l,k,p])=>(<div key={k} style={{display:"flex",flexDirection:"column",gap:"4px"}}><label style={LL}>{l}</label><input placeholder={p} value={form[k]} onChange={f(k)} style={iB} onFocus={focusOn} onBlur={focusOff}/></div>))}
        <div style={{display:"flex",flexDirection:"column",gap:"4px"}}><label style={LL}>Min Experience (Years)</label><input type="number" placeholder="e.g. 2" value={form.experience_required} onChange={f("experience_required")} style={iB} onFocus={focusOn} onBlur={focusOff}/></div>
        <div style={{gridColumn:"1/-1",display:"flex",flexDirection:"column",gap:"4px"}}><label style={LL}>Job Description</label><textarea placeholder="Describe responsibilities..." value={form.description} onChange={f("description")} rows={3} style={{...iB,resize:"vertical",lineHeight:"1.65"}} onFocus={focusOn} onBlur={focusOff}/></div>
      </div>
      <div style={{display:"flex",gap:"10px"}}>
        <button onClick={()=>valid&&onSave({...form,experience_required:parseInt(form.experience_required,10)||0})} disabled={!valid||isSaving}
          style={{padding:"10px 22px",borderRadius:"9px",border:"none",background:`linear-gradient(135deg,#4C1D95,#A855F7)`,color:"#fff",fontFamily:"'Sora',sans-serif",fontSize:"13px",fontWeight:"700",cursor:valid&&!isSaving?"pointer":"not-allowed",opacity:valid&&!isSaving?1:.40,boxShadow:`0 3px 14px rgba(168,85,247,0.35)`,transition:"transform 0.15s"}}
          onMouseEnter={e=>valid&&!isSaving&&(e.currentTarget.style.transform="translateY(-1px)")} onMouseLeave={e=>e.currentTarget.style.transform=""}>{isSaving?"Saving...":"Save Job Role ✦"}</button>
        <button onClick={onCancel} className="r-cancel-btn" disabled={isSaving}>Cancel</button>
      </div>
    </div>
  );
}

export default function RecruiterProfile(){
  const navigate=useNavigate();
  const [data,setData]=useState(EMPTY_PROFILE);
  const [editing,setEdit]=useState(false);
  const [draft,setDraft]=useState(EMPTY_PROFILE);
  const [saved,setSaved]=useState(false);
  const [jobs,setJobs]=useState([]);
  const [showAdd,setShowAdd]=useState(false);
  const [isLoading,setIsLoading]=useState(true);
  const [isSavingProfile,setIsSavingProfile]=useState(false);
  const [isSavingJob,setIsSavingJob]=useState(false);
  const [loadError,setLoadError]=useState("");
  const [saveError,setSaveError]=useState("");

  useEffect(()=>{
    let cancelled=false;

    async function loadPage(){
      setIsLoading(true);
      setLoadError("");

      const [profileResult,jobsResult]=await Promise.allSettled([
        getMyRecruiterProfile(),
        getMyJobs(),
      ]);

      if(cancelled){
        return;
      }

      if(profileResult.status==="fulfilled"){
        const profile={...EMPTY_PROFILE,...profileResult.value};
        setData(profile);
        setDraft(profile);
      }else{
        setLoadError(profileResult.reason?.message||"Failed to load recruiter profile.");
      }

      if(jobsResult.status==="fulfilled"){
        setJobs(Array.isArray(jobsResult.value)?jobsResult.value:[]);
      }else{
        setLoadError(current=>current||jobsResult.reason?.message||"Failed to load recruiter jobs.");
      }

      setIsLoading(false);
    }

    loadPage();
    return()=>{cancelled=true;};
  },[]);

  const d=k=>v=>setDraft(p=>({...p,[k]:v}));
  const initials=(data.company_name||"RC").split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase()||"RC";
  const syncedJobs=jobs.filter(job=>UUID_RE.test(String(job.id||""))).length;
  const profileFieldsFilled=[data.company_name,data.company_website,data.location,data.company_description].filter(value=>String(value||"").trim()).length;

  const handleSaveProfile=async()=>{
    setSaveError("");
    setSaved(false);
    setIsSavingProfile(true);
    try{
      const updated=await updateMyRecruiterProfile({
        company_name:draft.company_name,
        company_description:draft.company_description,
        company_website:draft.company_website,
        location:draft.location,
      });
      const profile={...EMPTY_PROFILE,...updated};
      setData(profile);
      setDraft(profile);
      setEdit(false);
      setSaved(true);
      setTimeout(()=>setSaved(false),3000);
    }catch(error){
      setSaveError(error.message||"Failed to save recruiter profile.");
    }finally{
      setIsSavingProfile(false);
    }
  };

  const handleAddJob=async(jobForm)=>{
    if(!data.id){
      setSaveError("Recruiter profile is not loaded yet, so a backend job cannot be created.");
      return;
    }

    setSaveError("");
    setIsSavingJob(true);
    try{
      const createdJob=await createJob({
        recruiter_id:data.id,
        title:jobForm.title,
        role:jobForm.role,
        description:jobForm.description||"",
        experience_required:jobForm.experience_required||0,
        location:jobForm.location||"Remote",
      });
      setJobs(prev=>[createdJob,...prev]);
      setShowAdd(false);
    }catch(error){
      setSaveError(error.message||"Failed to create recruiter job.");
    }finally{
      setIsSavingJob(false);
    }
  };

  return(<>
    <style>{GLOBAL}</style><RecruiterHeader/>
    <div style={{minHeight:"calc(100vh - 68px)",background:C.bg,fontFamily:"'Sora',sans-serif",paddingBottom:"80px"}}>
      <div style={{maxWidth:"1160px",margin:"0 auto",padding:"44px 28px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"26px"}}>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:C.textDim,letterSpacing:"0.08em",fontWeight:"700"}}>RECRUITER</span>
          <span style={{color:`rgba(168,85,247,0.40)`,fontSize:"12px"}}>›</span>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:`rgba(168,85,247,0.88)`,letterSpacing:"0.08em",fontWeight:"700"}}>COMPANY PROFILE</span>
        </div>
        {loadError&&<div style={{marginBottom:"18px",padding:"12px 14px",borderRadius:"12px",background:"rgba(248,113,113,0.10)",border:`1px solid rgba(248,113,113,0.30)`,fontFamily:"'Sora',sans-serif",fontSize:"12px",color:"#fecaca"}}>{loadError}</div>}
        {saveError&&<div style={{marginBottom:"18px",padding:"12px 14px",borderRadius:"12px",background:"rgba(248,113,113,0.10)",border:`1px solid rgba(248,113,113,0.30)`,fontFamily:"'Sora',sans-serif",fontSize:"12px",color:"#fecaca"}}>{saveError}</div>}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"22px",padding:"28px 32px",boxShadow:"0 8px 50px rgba(0,0,0,0.60)",position:"relative",overflow:"hidden",marginBottom:"20px",animation:"rFU 0.5s ease both"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:"3px",background:`linear-gradient(90deg,transparent,${C.vivid},${C.lite},transparent)`,backgroundSize:"300% 100%",animation:"rBF 3s linear infinite"}}/>
          <div style={{display:"flex",alignItems:"flex-start",gap:"22px",flexWrap:"wrap"}}>
            <div style={{flexShrink:0}}>
              <div style={{width:76,height:76,borderRadius:"18px",background:`linear-gradient(135deg,${C.dark},${C.vivid})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px",fontWeight:"800",color:"#fff",fontFamily:"'Sora',sans-serif",animation:"rGlow 3s ease-in-out infinite",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:"-80%",width:"55%",height:"100%",background:"linear-gradient(120deg,transparent,rgba(255,255,255,0.28),transparent)",animation:"rSweep 3s ease-in-out infinite"}}/>{initials}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"5px",marginTop:"8px",justifyContent:"center"}}><div style={{width:6,height:6,borderRadius:"50%",background:C.vivid,animation:"rBl 2s ease-in-out infinite"}}/><span style={{...LL,color:`rgba(168,85,247,0.88)`}}>{data.id?"SYNCED":"PENDING"}</span></div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap",marginBottom:"5px"}}>
                <h1 style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"clamp(18px,3vw,26px)",color:"#fff",letterSpacing:"-0.04em",margin:0}}>{data.company_name||"Recruiter Profile"}</h1>
                <div style={{display:"inline-flex",alignItems:"center",gap:"5px",background:`rgba(168,85,247,0.10)`,border:`1px solid rgba(168,85,247,0.24)`,borderRadius:"100px",padding:"3px 10px"}}><span style={{fontSize:"10px"}}>🏢</span><span style={{fontFamily:"'Space Mono',monospace",fontSize:"9px",color:`rgba(168,85,247,0.92)`,letterSpacing:"0.08em",fontWeight:"700"}}>RECRUITER ACCOUNT</span></div>
              </div>
              <div style={{fontFamily:"'Sora',sans-serif",fontSize:"13px",color:C.textMid,marginBottom:"14px",fontWeight:"500"}}>{data.location||"Add company location"}{data.company_website?<> · <a href={data.company_website} style={{color:C.lite,textDecoration:"none"}}>{data.company_website}</a></>:null}</div>
              <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}><StatChip label="Job Roles" value={jobs.length}/><StatChip label="Synced Jobs" value={syncedJobs}/><StatChip label="Profile Fields" value={`${profileFieldsFilled}/4`}/></div>
            </div>
            <div style={{flexShrink:0}}>
              {!editing?<button className="r-edit-btn" onClick={()=>{setDraft({...data});setEdit(true);setSaved(false);setSaveError("");}} disabled={isLoading}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>Edit Profile</button>
                :<div style={{display:"flex",gap:"8px"}}><button className="r-save-btn" onClick={handleSaveProfile} disabled={isSavingProfile}>{isSavingProfile?"Saving...":"Save Changes"}</button><button className="r-cancel-btn" onClick={()=>{setDraft({...data});setEdit(false);setSaveError("");}} disabled={isSavingProfile}>Cancel</button></div>}
              {saved&&<div style={{marginTop:"8px",fontFamily:"'Space Mono',monospace",fontSize:"10px",color:"#4ade80",letterSpacing:"0.08em",textAlign:"right",fontWeight:"700"}}>✓ SAVED</div>}
            </div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:"18px",marginBottom:"20px",animation:"rFU 0.5s 0.08s ease both"}}>
          <Card title="Company Details" tag="IDENTITY">
            {!editing?<><InfoRow icon="🏢" label="Company" value={data.company_name}/><InfoRow icon="🌐" label="Website" value={data.company_website} link/><InfoRow icon="📍" label="Location" value={data.location}/><div style={{marginTop:"10px"}}><div style={{...LL,marginBottom:"6px"}}>📝 About</div><p style={{fontFamily:"'Sora',sans-serif",fontSize:"13px",color:C.textMid,lineHeight:"1.65",margin:0,fontWeight:"500"}}>{data.company_description||"—"}</p></div></>:<div style={{display:"flex",flexDirection:"column",gap:"12px"}}><EF label="Company Name" icon="🏢" value={draft.company_name} onChange={d("company_name")}/><EF label="Website" icon="🌐" value={draft.company_website} onChange={d("company_website")}/><EF label="Location" icon="📍" value={draft.location} onChange={d("location")}/><EF label="Description" icon="📝" value={draft.company_description} onChange={d("company_description")} multiline/></div>}
          </Card>
          <Card title="Recruitment Overview" tag="ANALYTICS">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
              {[["📋","Roles Posted",jobs.length],["🟢","Interview Ready",syncedJobs],["🧩","Profile Completed",`${profileFieldsFilled}/4`],["🔐","Backend Source",data.id?"Live":"Pending"]].map(([icon,label,val])=>(
                <div key={label} style={{background:`rgba(168,85,247,0.07)`,border:`1px solid rgba(168,85,247,0.15)`,borderRadius:"10px",padding:"12px 14px",display:"flex",gap:"10px",alignItems:"center"}}><span style={{fontSize:"18px"}}>{icon}</span><div><div style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"18px",color:C.lite,letterSpacing:"-0.03em"}}>{val}</div><div style={LL}>{label}</div></div></div>
              ))}
            </div>
            <div style={{background:`rgba(168,85,247,0.07)`,border:`1px solid rgba(168,85,247,0.15)`,borderRadius:"10px",padding:"12px 16px"}}><div style={{...LL,marginBottom:"6px"}}>🤖 LIVE INTERVIEW PIPELINE</div><p style={{fontFamily:"'Sora',sans-serif",fontSize:"12px",color:C.textMid,lineHeight:"1.65",margin:0,fontWeight:"500"}}>Jobs created here now come from the backend, so recruiter interview launches create real tracked interview IDs instead of local-only placeholders.</p></div>
          </Card>
        </div>
        <div style={{animation:"rFU 0.5s 0.16s ease both"}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:"20px",boxShadow:"0 6px 40px rgba(0,0,0,0.55)",position:"relative"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:"2.5px",borderRadius:"20px 20px 0 0",background:`linear-gradient(90deg,transparent,${C.vivid},${C.lite},transparent)`,backgroundSize:"200% 100%",animation:"rBF 3s linear infinite"}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 26px 14px",borderBottom:`1px solid rgba(168,85,247,0.10)`,flexWrap:"wrap",gap:"12px"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"3px"}}><h2 style={{fontFamily:"'Sora',sans-serif",fontWeight:"800",fontSize:"16px",color:"#fff",letterSpacing:"-0.03em",margin:0}}>Job Roles</h2><div style={{background:`rgba(168,85,247,0.10)`,border:`1px solid rgba(168,85,247,0.22)`,borderRadius:"100px",padding:"2px 10px"}}><span style={{...LL,color:`rgba(168,85,247,0.88)`}}>{jobs.length} TOTAL</span></div></div>
                <p style={{fontFamily:"'Sora',sans-serif",fontSize:"12px",color:C.textDim,margin:0,fontWeight:"500"}}>Create backend listings and open a synced job to launch tracked interviews</p>
              </div>
              <button className="r-add-job-btn" onClick={()=>setShowAdd(v=>!v)} disabled={!data.id||isLoading||isSavingJob}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>{showAdd?"Cancel":"Add Job Role"}</button>
            </div>
            {showAdd&&<div style={{padding:"0 26px"}}><AddJobPanel onSave={handleAddJob} onCancel={()=>setShowAdd(false)} isSaving={isSavingJob}/></div>}
            <div style={{padding:"18px 26px 24px"}}>
              {isLoading?<div style={{textAlign:"center",padding:"44px 20px",fontFamily:"'Sora',sans-serif",fontSize:"14px",color:C.textDim,fontWeight:"500"}}>Loading recruiter profile...</div>
                :jobs.length===0?<div style={{textAlign:"center",padding:"44px 20px"}}><div style={{fontSize:"34px",marginBottom:"10px"}}>💼</div><p style={{fontFamily:"'Sora',sans-serif",fontSize:"14px",color:C.textDim,fontWeight:"500"}}>No backend job roles posted yet.</p><p style={{fontFamily:"'Space Mono',monospace",fontSize:"10px",color:`rgba(168,85,247,0.55)`,marginTop:"6px",letterSpacing:"0.06em",fontWeight:"700"}}>CLICK "ADD JOB ROLE" TO CREATE A TRACKED LISTING</p></div>
                :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:"14px"}}>{jobs.map(job=><JobCard key={job.id} job={job} onClick={()=>navigate(`/recruiter/job/${job.id}`,{state:{job}})}/>)}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  </>);
}

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CandidateRegister from "./pages/candidate/CandidateRegister";
import CandidateProfile  from "./pages/candidate/Profile";
import SkillVerify       from "./pages/candidate/SkillVerify";
import RecruiterRegister from "./pages/recruiter/RecruiterRegister";
import RecruiterProfile  from "./pages/recruiter/RecruiterProfile";
import JobRole           from "./pages/recruiter/JobRole";

function Home() {
  return (
    <div style={{ minHeight:"100vh", background:"#200F21", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:"2rem", color:"#fff" }}>InterviewAI</h1>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                    element={<Home />} />
        <Route path="/register"            element={<CandidateRegister />} />
        <Route path="/profile"             element={<CandidateProfile />} />
        <Route path="/skill-verify"        element={<SkillVerify />} />
        <Route path="/recruiter/register"  element={<RecruiterRegister />} />
        <Route path="/recruiter/profile"   element={<RecruiterProfile />} />
        <Route path="/recruiter/job/:id"   element={<JobRole />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


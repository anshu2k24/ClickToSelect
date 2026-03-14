import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthRegister      from "./pages/AuthRegister";
import AuthLogin         from "./pages/AuthLogin";
import CandidateProfile  from "./pages/candidate/Profile";
import SkillVerify       from "./pages/candidate/SkillVerify";
import CandidateInterview from "./pages/candidate/candidate";
import RecruiterProfile  from "./pages/recruiter/RecruiterProfile";
import JobRole           from "./pages/recruiter/JobRole";
import ParallelInterview from "./pages/recruiter/ParallelInterview";
import LLMSetup          from "./pages/recruiter/LLMSetup";
import ProtectedRoute    from "./components/ProtectedRoute";

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

        {/* Shared public auth */}
        <Route path="/register"            element={<AuthRegister />} />
        <Route path="/login"               element={<AuthLogin />} />
        <Route path="/recruiter/register"  element={<Navigate to="/register" replace />} />
        <Route path="/recruiter/login"     element={<Navigate to="/login" replace />} />

        {/* Candidate protected */}
        <Route path="/profile"             element={<ProtectedRoute role="candidate"><CandidateProfile /></ProtectedRoute>} />
        <Route path="/skill-verify"        element={<ProtectedRoute role="candidate"><SkillVerify /></ProtectedRoute>} />
        <Route path="/candidate/interview" element={<ProtectedRoute role="candidate"><CandidateInterview /></ProtectedRoute>} />

        {/* Recruiter protected */}
        <Route path="/recruiter/profile"   element={<ProtectedRoute role="recruiter"><RecruiterProfile /></ProtectedRoute>} />
        <Route path="/recruiter/job/:id"   element={<ProtectedRoute role="recruiter"><JobRole /></ProtectedRoute>} />
        <Route path="/recruiter/parallel/:interviewId" element={<ProtectedRoute role="recruiter"><ParallelInterview /></ProtectedRoute>} />
        <Route path="/recruiter/parallel"  element={<ProtectedRoute role="recruiter"><ParallelInterview /></ProtectedRoute>} />
        <Route path="/recruiter/llm-setup" element={<ProtectedRoute role="recruiter"><LLMSetup /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


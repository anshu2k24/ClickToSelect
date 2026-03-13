import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { authenticate } from "../api/auth";
import { createCandidateProfile } from "../api/candidate";
import { createRecruiterProfile } from "../api/recruiter";

const C = {
  bg: "#200F21",
  card: "rgba(20,8,21,0.88)",
  border: "rgba(246,56,220,0.20)",
  vivid: "#F638DC",
};

export default function AuthRegister() {
  const navigate = useNavigate();
  const [role, setRole] = useState("candidate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const [common, setCommon] = useState({ name: "", email: "", password: "123456" });
  const [candidate, setCandidate] = useState({
    mobile_no: "",
    dob: "",
    experience_years: "0",
    organisation: "",
    location: "",
    gender: "",
    github_link: "",
    linkedin_link: "",
    resume_url: "",
  });
  const [recruiter, setRecruiter] = useState({
    company_name: "",
    company_description: "",
    company_website: "",
    location: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authenticate({
        name: common.name,
        email: common.email,
        password: common.password,
        role,
      });

      if (role === "candidate") {
        await createCandidateProfile({
          mobile_no: candidate.mobile_no,
          dob: candidate.dob,
          experience_years: parseInt(candidate.experience_years) || 0,
          organisation: candidate.organisation || "",
          location: candidate.location,
          github_link: candidate.github_link || "",
          linkedin_link: candidate.linkedin_link || "",
          resume_url: candidate.resume_url || "",
        });

        navigate("/profile");
      } else {
        await createRecruiterProfile({
          company_name: recruiter.company_name,
          company_description: recruiter.company_description,
          company_website: recruiter.company_website,
          location: recruiter.location,
        });
        navigate("/recruiter/profile");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please check fields.");
    } finally {
      setLoading(false);
    }
  };

  const nextCandidateStep = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const previousCandidateStep = () => {
    setStep(1);
  };

  const inputStyle = {
    padding: "10px 12px",
    borderRadius: 8,
    background: "rgba(32,15,33,0.7)",
    color: "#fff",
    border: "1px solid rgba(246,56,220,0.25)",
  };

  const sectionTitleStyle = {
    color: "#fff",
    fontFamily: "Sora,sans-serif",
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 12,
  };

  return (
    <>
      <Header />
      <div style={{ minHeight: "calc(100vh - 68px)", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 620, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <h1 style={{ color: "#fff", marginBottom: 8, fontFamily: "Sora,sans-serif" }}>Register</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: 18, fontFamily: "Sora,sans-serif", fontSize: 13 }}>Choose your role to show the correct registration phase.</p>

          <label style={{ color: "#fff", display: "block", marginBottom: 8, fontSize: 13 }}>Role</label>
          <select value={role} onChange={(e) => { setRole(e.target.value); setStep(1); }} style={{ width: "100%", marginBottom: 14, ...inputStyle }}>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <input placeholder="Full Name" value={common.name} onChange={(e) => setCommon({ ...common, name: e.target.value })} required style={inputStyle} />
            <input placeholder="Email" type="email" value={common.email} onChange={(e) => setCommon({ ...common, email: e.target.value })} required style={inputStyle} />
            <input placeholder="Password" type="password" value={common.password} readOnly required style={{ gridColumn: "1 / -1", ...inputStyle, opacity: 0.7 }} />
          </div>
          <div style={{ marginBottom: 14, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(246,56,220,0.25)", background: "rgba(246,56,220,0.07)", color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
            Temporary dev setup: all accounts are created with password <strong>123456</strong>.
          </div>

          {role === "candidate" ? (
            <>
              {step === 1 ? (
                <div style={{ marginBottom: 14 }}>
                  <div style={sectionTitleStyle}>Candidate Personal Details</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <input placeholder="Mobile Number" value={candidate.mobile_no} onChange={(e) => setCandidate({ ...candidate, mobile_no: e.target.value })} required style={inputStyle} />
                    <input placeholder="Date of Birth" type="date" value={candidate.dob} onChange={(e) => setCandidate({ ...candidate, dob: e.target.value })} required style={inputStyle} />
                    <input placeholder="Organisation" value={candidate.organisation} onChange={(e) => setCandidate({ ...candidate, organisation: e.target.value })} style={inputStyle} />
                    <input placeholder="Location" value={candidate.location} onChange={(e) => setCandidate({ ...candidate, location: e.target.value })} required style={inputStyle} />
                    <select value={candidate.gender} onChange={(e) => setCandidate({ ...candidate, gender: e.target.value })} style={{ gridColumn: "1 / -1", ...inputStyle }}>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not">Prefer not to say</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                    <button type="button" onClick={nextCandidateStep} style={{ border: "none", borderRadius: 8, padding: "10px 16px", color: "#fff", cursor: "pointer", background: "linear-gradient(135deg,#382039,#F638DC)", fontWeight: 700 }}>
                      Continue to Professional Details
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  <div style={sectionTitleStyle}>Candidate Professional Details</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <input placeholder="Experience (years)" type="number" value={candidate.experience_years} onChange={(e) => setCandidate({ ...candidate, experience_years: e.target.value })} required style={inputStyle} />
                    <input placeholder="GitHub URL" value={candidate.github_link} onChange={(e) => setCandidate({ ...candidate, github_link: e.target.value })} style={inputStyle} />
                    <input placeholder="LinkedIn URL" value={candidate.linkedin_link} onChange={(e) => setCandidate({ ...candidate, linkedin_link: e.target.value })} style={inputStyle} />
                    <input placeholder="Resume URL" value={candidate.resume_url} onChange={(e) => setCandidate({ ...candidate, resume_url: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
                    <button type="button" onClick={previousCandidateStep} style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 16px", color: "rgba(255,255,255,0.75)", cursor: "pointer", background: "transparent", fontWeight: 600 }}>
                      Back
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <div style={sectionTitleStyle}>Recruiter Company Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input placeholder="Company Name" value={recruiter.company_name} onChange={(e) => setRecruiter({ ...recruiter, company_name: e.target.value })} required style={{ gridColumn: "1 / -1", ...inputStyle }} />
                <input placeholder="Location" value={recruiter.location} onChange={(e) => setRecruiter({ ...recruiter, location: e.target.value })} required style={inputStyle} />
                <input placeholder="Company Website" value={recruiter.company_website} onChange={(e) => setRecruiter({ ...recruiter, company_website: e.target.value })} style={inputStyle} />
                <textarea placeholder="Company Description" value={recruiter.company_description} onChange={(e) => setRecruiter({ ...recruiter, company_description: e.target.value })} style={{ gridColumn: "1 / -1", minHeight: 90, ...inputStyle }} />
              </div>
            </div>
          )}

          {error && <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,80,80,0.35)", background: "rgba(255,80,80,0.12)", color: "#ff9a9a", fontSize: 13 }}>{error}</div>}

          {(role === "recruiter" || step === 2) && (
            <button disabled={loading} type="submit" style={{ width: "100%", border: "none", borderRadius: 8, padding: "11px 14px", color: "#fff", cursor: "pointer", background: "linear-gradient(135deg,#382039,#F638DC)", fontWeight: 700 }}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          )}

          <p style={{ color: "rgba(255,255,255,0.55)", marginTop: 14, fontSize: 13 }}>
            Already have account? <span onClick={() => navigate("/login")} style={{ color: C.vivid, cursor: "pointer", textDecoration: "underline" }}>Sign in</span>
          </p>
        </form>
      </div>
    </>
  );
}

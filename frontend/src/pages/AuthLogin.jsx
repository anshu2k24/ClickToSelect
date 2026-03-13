import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { loginUser } from "../api/auth";
import { clearStoredSession, saveStoredSession } from "../api/client";
import { getMyCandidateProfile } from "../api/candidate";
import { getMyRecruiterProfile } from "../api/recruiter";

const C = {
  bg: "#200F21",
  card: "rgba(20,8,21,0.88)",
  border: "rgba(246,56,220,0.20)",
  vivid: "#F638DC",
};

export default function AuthLogin() {
  const navigate = useNavigate();
  const [role, setRole] = useState("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const login = await loginUser({ email, password });

      saveStoredSession({
        accessToken: login.access_token,
        tokenType: login.token_type,
        role,
        email,
        name: "",
      });

      let profile = null;
      if (role === "candidate") {
        profile = await getMyCandidateProfile();
      } else {
        profile = await getMyRecruiterProfile();
      }

      saveStoredSession({
        accessToken: login.access_token,
        tokenType: login.token_type,
        role,
        email,
        name: profile?.name || "",
      });

      navigate(role === "candidate" ? "/profile" : "/recruiter/profile");
    } catch (err) {
      clearStoredSession();
      setError(err.message || "Login failed. Check credentials and selected role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div style={{ minHeight: "calc(100vh - 68px)", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 460, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <h1 style={{ color: "#fff", marginBottom: 8, fontFamily: "Sora,sans-serif" }}>Sign In</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: 18, fontFamily: "Sora,sans-serif", fontSize: 13 }}>Select role and login with your credentials (temporary default password: 123456).</p>

          <label style={{ color: "#fff", display: "block", marginBottom: 8, fontSize: 13 }}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%", marginBottom: 14, padding: "10px 12px", borderRadius: 8, background: "rgba(32,15,33,0.7)", color: "#fff", border: "1px solid rgba(246,56,220,0.25)" }}>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>

          <label style={{ color: "#fff", display: "block", marginBottom: 8, fontSize: 13 }}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={{ width: "100%", marginBottom: 14, padding: "10px 12px", borderRadius: 8, background: "rgba(32,15,33,0.7)", color: "#fff", border: "1px solid rgba(246,56,220,0.25)" }} />

          <label style={{ color: "#fff", display: "block", marginBottom: 8, fontSize: 13 }}>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={{ width: "100%", marginBottom: 14, padding: "10px 12px", borderRadius: 8, background: "rgba(32,15,33,0.7)", color: "#fff", border: "1px solid rgba(246,56,220,0.25)" }} />

          {error && <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,80,80,0.35)", background: "rgba(255,80,80,0.12)", color: "#ff9a9a", fontSize: 13 }}>{error}</div>}

          <button disabled={loading} type="submit" style={{ width: "100%", border: "none", borderRadius: 8, padding: "11px 14px", color: "#fff", cursor: "pointer", background: "linear-gradient(135deg,#382039,#F638DC)", fontWeight: 700 }}>
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <p style={{ color: "rgba(255,255,255,0.55)", marginTop: 14, fontSize: 13 }}>
            New user? <span onClick={() => navigate("/register")} style={{ color: C.vivid, cursor: "pointer", textDecoration: "underline" }}>Create account</span>
          </p>
        </form>
      </div>
    </>
  );
}

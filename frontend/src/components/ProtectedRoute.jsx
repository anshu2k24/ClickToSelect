// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { getSession } from "../api/auth";

export default function ProtectedRoute({ children, role }) {
  const session = getSession();

  if (!session || !session.accessToken) {
    return <Navigate to={role === "recruiter" ? "/recruiter/login" : "/login"} replace />;
  }

  if (role && session.role !== role) {
    return <Navigate to={role === "recruiter" ? "/recruiter/login" : "/login"} replace />;
  }

  return children;
}

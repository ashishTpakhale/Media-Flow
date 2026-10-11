import { Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

const getTokenExpiryMs = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return null;
    return payload.exp * 1000 - Date.now();
  } catch {
    return null;
  }
};

const AuthWrapper = ({ children }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Check expiry on mount and auto-logout when token expires
  useEffect(() => {
    if (!token) return;

    const msUntilExpiry = getTokenExpiryMs(token);
    if (msUntilExpiry === null) return;

    if (msUntilExpiry <= 0) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/signin", { replace: true });
      return;
    }

    // Auto logout exactly when token expires
    const timer = setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/signin", { replace: true });
    }, msUntilExpiry);

    return () => clearTimeout(timer);
  }, [token]);

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default AuthWrapper;
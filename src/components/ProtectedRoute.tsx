import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/reduxHooks";
import { useUserProfile } from "@/hooks/useUserProfile";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Restrict the route to platform admins ("admin") or regular tenant users ("user"). */
  role?: "admin" | "user";
}

/**
 * Role check is a UX guard only (it avoids rendering admin screens to tenants and vice
 * versa). The backend enforces the real authorization on every API call.
 */
const RoleGate: React.FC<{ role: "admin" | "user"; children: React.ReactNode }> = ({ role, children }) => {
  const { loading, is_admin } = useUserProfile();
  if (loading) return null;
  if (role === "admin" && !is_admin) return <Navigate to="/user-dashboard" replace />;
  if (role === "user" && is_admin) return <Navigate to="/admin-dashboard" replace />;
  return <>{children}</>;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }
  return role ? <RoleGate role={role}>{children}</RoleGate> : <>{children}</>;
};

export default ProtectedRoute;

import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

interface AuthGateProps {
  children: React.ReactNode;
  require?: "auth" | "guest";
  redirectTo?: string;
}

export function AuthGate({ children, require = "auth", redirectTo }: AuthGateProps) {
  const session = useAuth();

  if (session === undefined) return null;

  if (require === "auth" && !session) {
    return <Navigate to={redirectTo ?? "/login"} replace />;
  }

  if (require === "guest" && session) {
    return <Navigate to={redirectTo ?? "/home"} replace />;
  }

  return <>{children}</>;
}
import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { getCurrentUser } from "@/services/authService";

/**
 * Gate for signed-in routes.
 * The session is validated once per token — not on every navigation — so moving between
 * screens never blanks the app. A 401 clears the session (see httpConfig) and this redirects;
 * a network failure keeps the local session so the app still opens offline.
 */
export default function RequireAuth() {
  const location = useLocation();
  const session = useSession();
  const token = session?.token;
  const verified = useRef<string | null>(null);

  useEffect(() => {
    if (!token || verified.current === token) return;
    verified.current = token;
    getCurrentUser().catch(() => {
      /* 401 is handled centrally; transient errors must not log the user out */
    });
  }, [token]);

  if (!session) {
    return <Navigate to="/login" replace state={{ from: { pathname: location.pathname + location.search } }} />;
  }
  return <Outlet />;
}

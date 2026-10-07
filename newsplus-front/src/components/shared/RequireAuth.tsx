import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentUser } from "@/services/authService";
import { getSession } from "@/services/sessionStore";
import { useSession } from "@/hooks/useSession";

export default function RequireAuth() {
  const location = useLocation();
  const session = useSession();
  const token = session?.token;
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(Boolean(getSession()));

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    async function verify() {
      if (!getSession()) {
        if (!cancelled) {
          setAllowed(false);
          setReady(true);
        }
        return;
      }

      try {
        await getCurrentUser();
        if (!cancelled) setAllowed(true);
      } catch {
        // HTTP 401 clears the matching session. A network/server failure should
        // leave a valid local session available for reconnecting and offline use.
        if (!cancelled) setAllowed(Boolean(getSession()));
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, token]);

  if (!session || (ready && !allowed)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!ready) return null;

  return <Outlet />;
}

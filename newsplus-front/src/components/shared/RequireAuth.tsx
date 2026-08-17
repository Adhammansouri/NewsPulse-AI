import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentUser, logout } from "@/services/authService";
import { getSession } from "@/services/sessionStore";

export default function RequireAuth() {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(Boolean(getSession()));

  useEffect(() => {
    let cancelled = false;

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
        await logout();
        if (!cancelled) setAllowed(false);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (!ready) return null;
  if (!allowed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
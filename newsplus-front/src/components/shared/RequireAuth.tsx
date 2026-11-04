import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Splash } from "@/components/shell/Splash";
import { getCurrentUser } from "@/services/authService";
import { getSession } from "@/services/sessionStore";
import { useSession } from "@/hooks/useSession";

/** Once the splash is up it stays at least this long, so a fast `/auth/me` doesn't flash it (S02 §6). */
const SPLASH_MIN_MS = 300;

/**
 * The splash belongs to the first session check after the app loads. Later checks — on navigation,
 * on a token change, or when this guard mounts again after signing in — run in the background and
 * keep the current page rendered.
 */
let initialCheckSettled = false;

export default function RequireAuth() {
  const location = useLocation();
  const session = useSession();
  const token = session?.token;
  const [startedAt] = useState(() => performance.now());
  const [checking, setChecking] = useState(() => !initialCheckSettled && Boolean(getSession()));
  const [allowed, setAllowed] = useState(() => Boolean(getSession()));

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    function settle(nextAllowed: boolean) {
      if (cancelled) return;
      initialCheckSettled = true;
      setAllowed(nextAllowed);
      const remaining = SPLASH_MIN_MS - (performance.now() - startedAt);
      if (remaining > 0) timer = window.setTimeout(() => setChecking(false), remaining);
      else setChecking(false);
    }

    async function verify() {
      if (!getSession()) {
        settle(false);
        return;
      }

      try {
        await getCurrentUser();
        settle(true);
      } catch {
        // HTTP 401 clears the matching session. A network/server failure should
        // leave a valid local session available for reconnecting and offline use.
        settle(Boolean(getSession()));
      }
    }

    void verify();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.pathname, token, startedAt]);

  if (checking) return <Splash state="checking" />;
  if (!session || !allowed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

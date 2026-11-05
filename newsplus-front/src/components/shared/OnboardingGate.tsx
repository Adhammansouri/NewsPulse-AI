import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Splash } from "@/components/shell/Splash";
import { usePreferences } from "@/hooks/usePreferences";
import { WELCOME_ROUTE } from "@/modules/Onboarding/onboardingModel";

/**
 * S16: onboarding shows once after login. Sits inside RequireAuth around the app shell — never around `/welcome`
 * itself, so it can't send an editor there twice in a row:
 * - while the editor's preferences load, the session-check splash stays up;
 * - `onboardedAt` empty → `/welcome`, carrying the page that was asked for (a deep link opens once onboarding ends);
 * - anything else — onboarded, or the read failed (offline, a server error, a 401 that S10's «الجلسة انتهت» dialog
 *   handles) — renders the app: the gate never locks an editor out. Once a read has failed, the gate stays open for
 *   the session: the refetches that follow (a page mounting, window focus) neither bring the splash back (a refetch
 *   with no data is `pending` again) nor pull the editor out of their work; the next sign-in or reload asks again.
 * Onboarding writes the saved preferences (with `onboardedAt`) into the same query before it navigates back.
 */
export default function OnboardingGate() {
  const location = useLocation();
  const preferences = usePreferences();
  const failed = preferences.errorUpdateCount > 0;

  if (failed) return <Outlet />;
  if (preferences.isPending && preferences.fetchStatus !== "idle") return <Splash state="checking" />;
  if (preferences.data && !preferences.data.onboardedAt) {
    return <Navigate to={WELCOME_ROUTE} replace state={{ from: location }} />;
  }
  return <Outlet />;
}

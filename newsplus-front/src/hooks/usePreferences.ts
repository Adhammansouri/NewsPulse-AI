import { useQuery } from "@tanstack/react-query";
import { isApiError } from "@/services/apiError";
import { getMyPreferences } from "@/services/preferencesService";
import { useSession } from "./useSession";

/** The query key of the signed-in editor's preferences (per user: another sign-in reads its own). */
export function preferencesKey(userId: string | undefined) {
  return ["me-preferences", userId ?? ""] as const;
}

/**
 * S16: the editor's onboarding choices (`GET /me/preferences`) — read by the onboarding gate, the wire's default
 * source filter and the publish screen's platform order. Kept for the session; onboarding writes the saved copy back.
 * A refusal (4xx) is not retried: the gate lets the app through instead of waiting.
 */
export function usePreferences() {
  const userId = useSession()?.user.id;
  return useQuery({
    queryKey: preferencesKey(userId),
    queryFn: ({ signal }) => getMyPreferences(signal),
    enabled: Boolean(userId),
    staleTime: Infinity,
    retry: (failures, error) => failures < 1 && !(isApiError(error) && error.status < 500),
  });
}

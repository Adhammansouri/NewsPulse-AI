// S15 presence, read side: `GET /presence` under the shared ["presence"] key (the workflow board polls the same
// key), every 20s and only while the workflow feature is on.
import { useQuery } from "@tanstack/react-query";
import type { PresenceEntry } from "@newsplus/shared";
import { features } from "@/config/features";
import { useSession } from "@/hooks/useSession";
import { getPresence } from "@/services/presenceService";
import { PRESENCE_HEARTBEAT_MS } from "./usePresenceHeartbeat";

/** Teammates (never the signed-in editor) writing about `itemId`, in the API's order (newest heartbeat first). */
export function useTeammatesWriting(itemId: string | null | undefined): PresenceEntry[] {
  const session = useSession();
  const presence = useQuery({
    queryKey: ["presence"],
    queryFn: ({ signal }) => getPresence(signal),
    refetchInterval: PRESENCE_HEARTBEAT_MS,
    staleTime: 0,
    retry: false,
    enabled: features.workflow && Boolean(itemId),
  });
  if (!itemId) return [];
  const me = session?.user.id;
  return (presence.data?.entries ?? []).filter(
    (entry) => entry.itemId === itemId && entry.activity === "writing" && entry.user.id !== me,
  );
}

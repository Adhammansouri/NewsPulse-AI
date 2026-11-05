// S15 presence, sent by the studio (desktop DeskStudio, mobile NewsStoryPage): «viewing» the open story, «writing»
// while the editor generates or a draft is open (with that draft's conversation). The briefing is about no single
// story, so it beats without one. Breaking mode sends its own heartbeat (useBreaking).
import type { NewsFeedItem } from "@newsplus/shared";
import { features } from "@/config/features";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import type { EditorialDesk } from "./useEditorialDesk";

export function useStudioPresence(desk: EditorialDesk, selected: NewsFeedItem | null) {
  const writing = desk.showEditorial || desk.generating;
  const itemId = writing && desk.resultFormat === "briefing" ? undefined : selected?.id;
  const conversationId = desk.showEditorial ? (desk.conversationId ?? undefined) : undefined;
  usePresenceHeartbeat({
    itemId,
    conversationId,
    activity: writing ? "writing" : "viewing",
    enabled: features.workflow && Boolean(itemId || conversationId),
  });
}

// «حدّث المسودة» (NewTimeline): open the editor's draft of the story and send one revision carrying the new update,
// once the draft is loaded. The draft view then shows the request and «يعدّل النص…» like any other revision.
// Lives in the studio (DeskStudio), which stays mounted while the timeline gives way to the draft.
import { useEffect, useState } from "react";
import type { EditorialDesk } from "../studio/useEditorialDesk";

type Pending = { conversationId: string; text: string };

export function usePendingRevision(desk: EditorialDesk) {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    if (!pending) return;
    // The draft did not open (the studio was busy) or another one replaced it: drop the request.
    if (desk.conversationId !== pending.conversationId) {
      setPending(null);
      return;
    }
    if (desk.detail?.id !== pending.conversationId || desk.busy) return;
    setPending(null);
    desk.revise(pending.text);
  }, [pending, desk]);

  return function updateDraft(conversationId: string, text: string) {
    if (desk.busy) return;
    setPending({ conversationId, text });
    desk.openConversation(conversationId);
  };
}

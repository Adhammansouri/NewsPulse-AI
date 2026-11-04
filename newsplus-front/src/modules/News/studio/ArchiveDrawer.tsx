// TRANSITIONAL (S05 → S06): «الأرشيف» opens the pre-Pulse conversations drawer until S06 rebuilds it
// (DeskArchive / MobArchive). The drawer is a modal <dialog> (top layer), so its legacy roots — the
// `.np-legacy` cascade, the `theme-tools` tokens and `.newsroom` — wrap it without a box of their own and
// never shift the Pulse layout around it.
import { toolErrorMessage } from "@/services/toolErrors";
import { ConversationDrawer } from "../components/editorial/ConversationDrawer";
import type { EditorialDesk } from "./useEditorialDesk";

const NO_BOX = { display: "contents" } as const;

export function ArchiveDrawer({ desk }: { desk: EditorialDesk }) {
  if (!desk.drawerOpen) return null;
  return (
    <div className="np-legacy np-legacy--tools theme-tools" style={NO_BOX}>
      <div className="newsroom" style={NO_BOX}>
        <ConversationDrawer
          busy={desk.busy}
          open={desk.drawerOpen}
          search={desk.conversationQuery}
          conversations={desk.conversations}
          memory={desk.memory}
          activeId={desk.conversationId}
          listLoading={desk.conversationsLoading}
          error={desk.drawerError ? toolErrorMessage(desk.drawerError) : undefined}
          onSearch={desk.setConversationQuery}
          onClose={desk.closeDrawer}
          onSelect={desk.openConversation}
          onDisableMemory={desk.disableMemory}
        />
      </div>
    </div>
  );
}

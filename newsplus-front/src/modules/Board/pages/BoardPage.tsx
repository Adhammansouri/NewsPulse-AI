// «سير العمل» (S15): NewBoard on desktop, MobNewQueue below 1024px. Data: the four workflow columns
// (`GET /editorial/conversations?scope=&status=`) and presence (`GET /presence`), both polled every 20s.
// This screen does not send heartbeats — the studio does (usePresenceHeartbeat).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { EditorialWorkflowStatus } from "@newsplus/shared";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNow } from "@/hooks/useNow";
import { useSession } from "@/hooks/useSession";
import { isApiError } from "@/services/apiError";
import { toolErrorMessage } from "@/services/toolErrors";
import type { BoardScope } from "../boardModel";
import { DeskBoard } from "../components/DeskBoard";
import { MobBoard } from "../components/MobBoard";
import { useBoard } from "../useBoard";

export default function BoardPage() {
  const isMobile = useIsMobile();
  const session = useSession();
  const navigate = useNavigate();
  const now = useNow();
  const [deskScope, setDeskScope] = useState<BoardScope>("team");
  // MobNewQueue has no «الفريق | مسوداتي» switch: the mobile queue is the team's.
  const scope: BoardScope = isMobile ? "team" : deskScope;
  const { board, presenceEntries, moveCard } = useBoard(scope);
  const [focusId, setFocusId] = useState<string | null>(null);

  const error = board.isError ? toolErrorMessage(isApiError(board.error) ? board.error : null) : null;
  const retry = () => void board.refetch();

  if (isMobile) {
    return (
      <MobBoard
        data={board.data}
        error={error}
        onRetry={retry}
        presence={presenceEntries}
        viewerId={session?.user.id}
        now={now}
      />
    );
  }

  return (
    <DeskBoard
      scope={deskScope}
      onScopeChange={setDeskScope}
      data={board.data}
      loading={board.isPending}
      error={error}
      onRetry={retry}
      presence={presenceEntries}
      now={now}
      focusId={focusId}
      onOpen={(conversationId) => navigate("/news", { state: { conversationId } })}
      onMove={(id: string, to: EditorialWorkflowStatus, viaKeyboard: boolean) => {
        // A keyboard move keeps focus on the card in its new column (and back, if the move rolls back).
        if (viaKeyboard) setFocusId(id);
        moveCard(id, to, () => setFocusId((current) => (current === id ? null : current)));
      }}
    />
  );
}

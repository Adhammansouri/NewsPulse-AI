// «سير العمل» data (S15): the four columns for a scope, presence, and the optimistic column move.
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EditorialConversationSummary, EditorialWorkflowStatus } from "@newsplus/shared";
import { isApiError } from "@/services/apiError";
import { listEditorialConversationsBy, updateEditorialConversation } from "@/services/editorialService";
import { getPresence } from "@/services/presenceService";
import { toolErrorMessage } from "@/services/toolErrors";
import { useToast } from "@/ui/Toast";
import { boardFromResponses, COLUMNS, moveCard, replaceCard, type BoardData, type BoardScope } from "./boardModel";

/** Presence refresh: «live presence updates within ~20s» (S15 acceptance); the columns follow at the same pace. */
export const BOARD_POLL_MS = 20_000;

const BOARD_KEY = "editorial-board";
const MOVE_KEY = ["editorial-board-move"] as const;

export const boardQueryKey = (scope: BoardScope) => [BOARD_KEY, scope] as const;

/** One list request per column, so a long «اتنشر» never pushes drafts out of the 50-item page. */
async function fetchBoard(scope: BoardScope, signal?: AbortSignal): Promise<BoardData> {
  const responses = await Promise.all(
    COLUMNS.map(({ status }) => listEditorialConversationsBy({ scope, status }, signal)),
  );
  return boardFromResponses(responses);
}

type MoveVars = { id: string; to: EditorialWorkflowStatus };
type MoveContext = { snapshots: Array<[readonly unknown[], BoardData | undefined]> };

export function useBoard(scope: BoardScope) {
  const queryClient = useQueryClient();
  const toast = useToast();
  // A poll landing mid-move would briefly put the card back; polls wait for the move to settle.
  const moving = useIsMutating({ mutationKey: MOVE_KEY }) > 0;

  const board = useQuery({
    queryKey: boardQueryKey(scope),
    queryFn: ({ signal }) => fetchBoard(scope, signal),
    refetchInterval: moving ? false : BOARD_POLL_MS,
    staleTime: 0,
  });

  const presence = useQuery({
    queryKey: ["presence"],
    queryFn: ({ signal }) => getPresence(signal),
    refetchInterval: BOARD_POLL_MS,
    staleTime: 0,
    retry: false,
  });

  const move = useMutation<EditorialConversationSummary, unknown, MoveVars, MoveContext>({
    mutationKey: MOVE_KEY,
    mutationFn: ({ id, to }) => updateEditorialConversation(id, { status: to }),
    onMutate: async ({ id, to }) => {
      await queryClient.cancelQueries({ queryKey: [BOARD_KEY] });
      const snapshots = queryClient.getQueriesData<BoardData>({ queryKey: [BOARD_KEY] });
      const at = new Date().toISOString();
      for (const [key, data] of snapshots) {
        if (data) queryClient.setQueryData<BoardData>(key, moveCard(data, id, to, at));
      }
      return { snapshots };
    },
    onError: (error, _vars, context) => {
      for (const [key, data] of context?.snapshots ?? []) queryClient.setQueryData(key, data);
      toast.show(toolErrorMessage(isApiError(error) ? error : null), { icon: "error-circle" });
    },
    onSuccess: (updated) => {
      for (const [key, data] of queryClient.getQueriesData<BoardData>({ queryKey: [BOARD_KEY] })) {
        if (data) queryClient.setQueryData<BoardData>(key, replaceCard(data, updated));
      }
    },
    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({ queryKey: [BOARD_KEY] });
      // Home «كمّل شغلك» and the archive order by updatedAt; the draft's thread gained the system line.
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversation", id] });
    },
  });

  return {
    board,
    presenceEntries: presence.data?.entries ?? [],
    /** Optimistic: the card moves at once and goes back (with a toast) if the API refuses. */
    moveCard: (id: string, to: EditorialWorkflowStatus, onSettled?: () => void) =>
      move.mutate({ id, to }, { onSettled }),
  };
}

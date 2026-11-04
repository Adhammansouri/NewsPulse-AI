// Archive data (S06 §7) for the DeskArchive drawer and the MobArchive screen alike.
// Drafts: the studio's own list request and cache key (`["editorial-conversations", q]`), the search held back
// 300ms (§8). Team memory: every status, under the archive's own key — the studio, home and «المزيد» read
// `["editorial-memory"]` (approved rules only); a change here refreshes both, and the open draft's suggestions.
import { useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EditorialMemoryListData, EditorialMemoryRule, EditorialMemoryUpdateRequest } from "@newsplus/shared";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { listEditorialConversations, listEditorialMemory, updateEditorialMemory } from "@/services/editorialService";
import { toolErrorMessage } from "@/services/toolErrors";
import { useToast } from "@/ui/Toast";
import { ARCHIVE_COPY, splitMemory } from "./archiveModel";

export const SEARCH_DEBOUNCE_MS = 300;

/** The archive's memory list: pending + approved + disabled (+ rejected, never shown). */
export const ARCHIVE_MEMORY_KEY = ["editorial-memory", "archive"] as const;
/** Prefix of every team-memory list (this one and the studio's approved-only `["editorial-memory"]`). */
const MEMORY_KEY = ["editorial-memory"] as const;
/** Prefix of the conversation details, whose `pendingMemory` the drafts show. */
const CONVERSATION_KEY = ["editorial-conversation"] as const;

function conversationsQuery(q: string) {
  return { queryKey: ["editorial-conversations", q] as const, queryFn: () => listEditorialConversations(q) };
}

/** The drafts list with its search box: typing waits 300ms before it reaches the request; clearing is immediate. */
export function useArchiveDrafts() {
  const [search, setSearch] = useState("");
  const typed = search.trim();
  const debounced = useDebouncedValue(typed, SEARCH_DEBOUNCE_MS);
  const q = typed === "" ? "" : debounced;
  const query = useQuery({ ...conversationsQuery(q), placeholderData: keepPreviousData });
  const items = query.data?.items ?? [];
  return {
    search,
    setSearch,
    /** The search the list shows. */
    q,
    items,
    /** No list yet (first load): the skeleton. */
    loading: query.isPending,
    /** The search still settling or loading: hold the «no results» state back. */
    searching: typed !== q || query.isPlaceholderData,
    error: query.isError && !query.data ? query.error : null,
    retry: () => void query.refetch(),
  };
}

/** The newest draft of the whole archive (the unfiltered list, shared with the studio's cache). */
export function useLatestDraftId(): string | null {
  const query = useQuery(conversationsQuery(""));
  return query.data?.items[0]?.id ?? null;
}

type MemoryPatch = { rule: EditorialMemoryRule; patch: EditorialMemoryUpdateRequest };

/** Toast glyph of «القاعدة اتحفظت لذاكرة الفريق»: the States board draws the memory bulb without its base. */
const SAVED_GLYPH = "M12 3a6 6 0 0 1 6 6c0 2.2-1.2 3.6-2.5 4.7-.7.6-1 1.3-1 2.1V17h-5v-1.2c0-.8-.3-1.5-1-2.1C7.2 12.6 6 11.2 6 9a6 6 0 0 1 6-6z";

export function useArchiveMemory() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const query = useQuery({ queryKey: ARCHIVE_MEMORY_KEY, queryFn: () => listEditorialMemory() });
  /** Rules with a request in flight: a second press waits for the first answer. */
  const inFlight = useRef(new Set<string>());
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());

  function track(id: string, busy: boolean) {
    if (busy) inFlight.current.add(id);
    else inFlight.current.delete(id);
    setBusyIds(new Set(inFlight.current));
  }

  const mutation = useMutation({
    mutationFn: ({ rule, patch }: MemoryPatch) => updateEditorialMemory(rule.id, patch),
    async onMutate({ rule, patch }) {
      track(rule.id, true);
      await queryClient.cancelQueries({ queryKey: ARCHIVE_MEMORY_KEY });
      const previous = queryClient.getQueryData<EditorialMemoryListData>(ARCHIVE_MEMORY_KEY);
      if (previous) {
        queryClient.setQueryData<EditorialMemoryListData>(ARCHIVE_MEMORY_KEY, {
          rules: previous.rules.map((entry) =>
            entry.id === rule.id
              ? { ...entry, status: patch.status ?? entry.status, instruction: patch.instruction ?? entry.instruction }
              : entry,
          ),
        });
      }
      return { previous };
    },
    onSuccess(_saved, { rule, patch }) {
      if (rule.status === "pending" && patch.status === "approved") {
        toast.show(ARCHIVE_COPY.ruleSaved, {
          icon: (
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#5eead4" }}>
              <path d={SAVED_GLYPH} />
            </svg>
          ),
        });
      }
    },
    onError(error, _vars, context) {
      if (context?.previous) queryClient.setQueryData(ARCHIVE_MEMORY_KEY, context.previous);
      toast.show(toolErrorMessage(error), { icon: "error-circle" });
    },
    onSettled(_data, _error, { rule }) {
      track(rule.id, false);
      void queryClient.invalidateQueries({ queryKey: MEMORY_KEY });
      void queryClient.invalidateQueries({ queryKey: CONVERSATION_KEY });
    },
  });

  function update(rule: EditorialMemoryRule, patch: EditorialMemoryUpdateRequest) {
    if (inFlight.current.has(rule.id)) return;
    mutation.mutate({ rule, patch });
  }

  const memory = splitMemory(query.data?.rules ?? []);
  return {
    ...memory,
    loading: query.isPending,
    error: query.isError && !query.data ? query.error : null,
    retry: () => void query.refetch(),
    busyIds,
    /** A switch: approved ↔ disabled. */
    toggle: (rule: EditorialMemoryRule, on: boolean) => update(rule, { status: on ? "approved" : "disabled" }),
    /** «احفظ للفريق» on a suggestion, with the edited wording when it changed. */
    save: (rule: EditorialMemoryRule, instruction: string | undefined) =>
      update(rule, instruction === undefined ? { status: "approved" } : { status: "approved", instruction }),
  };
}

export type ArchiveDrafts = ReturnType<typeof useArchiveDrafts>;
export type ArchiveMemoryState = ReturnType<typeof useArchiveMemory>;

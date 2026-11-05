// Draft runs (S05 §2, §4): every «اكتب…» is a summarize request that outlives the screen that started it.
//
// A run is a TanStack mutation built straight into the QueryClient's MutationCache (`build` + `execute`), not
// a `useMutation` of the studio: the cache lives as long as the app, so the request keeps going when the
// studio unmounts (the mobile story route, leaving /news on desktop), and any screen can read a run by id
// (`useDraftRunState`). Its mutation-level `onSuccess` runs whether or not a studio is still mounted:
// - a studio on screen *watches* its run (`watchDraftRun`) and turns the result into the draft itself;
// - nobody watching → the global toast «المسودة جاهزة: {format}» with «افتح» (S05 §4), from any screen. The
//   toast API and the «افتح» navigation are captured from the starting screen: both belong to app-lifetime
//   providers (AppRoot's ToastProvider, the BrowserRouter), so they stay valid after it unmounts;
// - a run *abandoned* for another story in the desktop studio keeps S04's «المسودة السابقة جاهزة في الأرشيف».
// «إلغاء» aborts the request through an AbortController threaded into `summarizeNews`.
import { useCallback, useSyncExternalStore } from "react";
import type { Mutation, MutationState, QueryClient } from "@tanstack/react-query";
import type { NewsSummarizeData, NewsSummarizeRequest, NewsSummaryFormat } from "@newsplus/shared";
import { summarizeNews } from "@/services/newsService";
import type { ToastApi } from "@/ui/Toast";
import { unpinBriefingItems } from "../wire/briefingPins";
import { COPY } from "../wire/copy";
import { formatCopy, STUDIO_COPY } from "./formats";

export const DRAFT_RUN_KEY = ["news-summarize"] as const;

export type DraftRunState = MutationState<NewsSummarizeData, Error, NewsSummarizeRequest, unknown>;
type DraftRunMutation = Mutation<NewsSummarizeData, Error, NewsSummarizeRequest, unknown>;

export type DraftRunInfo = {
  format: NewsSummaryFormat;
  /** The story it was written from (none for the briefing). */
  itemId: string | null;
  /** Slide count of a carousel run (for its name in the steps). */
  slides: number;
};

export type DraftRunNotify = {
  toast: ToastApi;
  /** «افتح»: shows the finished run as a draft. */
  open: (runId: number) => void;
};

type Control = DraftRunInfo & {
  controller: AbortController;
  startedAt: number;
  notify: DraftRunNotify;
  /** Studios showing this run right now. */
  watchers: number;
  /** Left for another story in the same studio (S04 §8). */
  abandoned: boolean;
  cancelled: boolean;
};

const controls = new Map<number, Control>();
const cleaned = new WeakSet<QueryClient>();

/** Durations of the last finished runs: MobGenerating's «حوالي N ثوانٍ». */
const RECENT_DURATIONS = 5;
const durations: number[] = [];

function findRun(client: QueryClient, id: number): DraftRunMutation | undefined {
  return client.getMutationCache().find({ predicate: (mutation) => mutation.mutationId === id }) as
    | DraftRunMutation
    | undefined;
}

/** Forget a run's controls once TanStack garbage-collects the finished mutation. */
function ensureCleanup(client: QueryClient) {
  if (cleaned.has(client)) return;
  cleaned.add(client);
  client.getMutationCache().subscribe((event) => {
    if (event.type === "removed") controls.delete(event.mutation.mutationId);
  });
}

function onRunSuccess(client: QueryClient, id: number, data: NewsSummarizeData, body: NewsSummarizeRequest) {
  if (body.briefing && body.itemIds?.length) unpinBriefingItems(body.itemIds);
  void client.invalidateQueries({ queryKey: ["editorial-conversations"] });
  const control = controls.get(id);
  if (!control || control.cancelled) return;
  durations.push(Date.now() - control.startedAt);
  if (durations.length > RECENT_DURATIONS) durations.shift();
  if (control.watchers > 0) return;
  if (control.abandoned) {
    if (data.conversationId) control.notify.toast.show(COPY.previousDraftReady);
    return;
  }
  const name = formatCopy(data.format, control.slides).name;
  control.notify.toast.show(STUDIO_COPY.draftReady(name), {
    action: { label: STUDIO_COPY.open, onAction: () => control.notify.open(id) },
  });
}

export function startDraftRun(
  client: QueryClient,
  { body, info, notify }: { body: NewsSummarizeRequest; info: DraftRunInfo; notify: DraftRunNotify },
): number {
  ensureCleanup(client);
  const controller = new AbortController();
  let id = 0;
  const mutation: DraftRunMutation = client.getMutationCache().build(client, {
    mutationKey: DRAFT_RUN_KEY,
    mutationFn: (variables: NewsSummarizeRequest) => summarizeNews(variables, { signal: controller.signal }),
    onSuccess: (data, variables) => onRunSuccess(client, id, data, variables),
    onError: () => {
      // A cancelled run leaves no trace; a failed one stays readable by the studio that shows it.
      if (controls.get(id)?.cancelled) client.getMutationCache().remove(mutation);
    },
  });
  id = mutation.mutationId;
  controls.set(id, { ...info, controller, startedAt: Date.now(), notify, watchers: 0, abandoned: false, cancelled: false });
  mutation.execute(body).catch(() => undefined);
  return id;
}

/** A studio shows the run: no toast when it finishes. Returns the release. */
export function watchDraftRun(id: number): () => void {
  const control = controls.get(id);
  if (!control) return () => undefined;
  control.watchers += 1;
  return () => {
    control.watchers -= 1;
  };
}

/** Another story was opened in the same studio: the run finishes into the archive (S04 §8). */
export function abandonDraftRun(id: number) {
  const control = controls.get(id);
  if (control) control.abandoned = true;
}

/** «إلغاء»: abort the request; the run disappears. */
export function cancelDraftRun(id: number) {
  const control = controls.get(id);
  if (!control || control.cancelled) return;
  control.cancelled = true;
  control.controller.abort();
}

export function draftRunInfo(id: number): DraftRunInfo | null {
  return controls.get(id) ?? null;
}

export function readDraftRun(client: QueryClient, id: number): DraftRunState | null {
  return findRun(client, id)?.state ?? null;
}

/** «حوالي N ثوانٍ»: the mean of the last finished runs, in whole seconds; null before the first one. */
export function draftRunEstimate(): number | null {
  if (durations.length === 0) return null;
  const mean = durations.reduce((sum, ms) => sum + ms, 0) / durations.length;
  return Math.max(1, Math.round(mean / 1000));
}

/** Live state of run `id` (null: none, cancelled or collected). Reads the cache directly by id on every change. */
export function useDraftRunState(client: QueryClient, id: number | null): DraftRunState | null {
  const cache = client.getMutationCache();
  const subscribe = useCallback((onChange: () => void) => cache.subscribe(onChange), [cache]);
  const snapshot = () => (id === null ? null : readDraftRun(client, id));
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

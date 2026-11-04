// Small pieces shared by DeskDraft, MobDraft and the carousel: the file download (S06 §8: the object URL is
// revoked after 1s), the `typeset` reveal (a version types in once, the first time it is shown), and the
// 1024–1279px studio (GLOBAL-RULES §6: the editor aside collapses into the bottom revise dock).
import { useEffect, useState, useSyncExternalStore } from "react";

const REVOKE_AFTER_MS = 1000;

/** Saves `blob` as `name`; the object URL is released a second later, once the download has started. */
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}

/** «2026-11-04» for file names. */
export function fileStamp(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function downloadText(text: string, name: string) {
  downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), name);
}

const revealed = new Set<string>();

/**
 * `typeset` for the version on screen: true on its first render only (a new version types in; reopening or
 * restoring one already seen doesn't). Mount the draft with `key={versionKey}` so a new version remounts.
 */
export function useTypeset(versionKey: string): boolean {
  const [first] = useState(() => !revealed.has(versionKey));
  useEffect(() => {
    revealed.add(versionKey);
  }, [versionKey]);
  return first;
}

const COMPACT_QUERY = "(max-width: 1279.98px)";
let compactQuery: MediaQueryList | null = null;

function getCompactQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  compactQuery ??= window.matchMedia(COMPACT_QUERY);
  return compactQuery;
}

function subscribeCompact(onChange: () => void) {
  const query = getCompactQuery();
  if (!query) return () => {};
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Desktop 1024–1279px: no editor aside, the thread under the draft and the dock at the bottom. */
export function useCompactStudio(): boolean {
  return useSyncExternalStore(
    subscribeCompact,
    () => getCompactQuery()?.matches ?? false,
    () => false,
  );
}

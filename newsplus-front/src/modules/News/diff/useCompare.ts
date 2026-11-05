// «قارن»: the draft's compare view, in the URL (`?compare=<conversationId>`) so the browser's back leaves it, a
// reload opens it again, and the desktop page can give it the whole content area (NewDiff has no headlines
// column). Bound to one conversation, so it never opens on another draft. Same model as S12's `?publish=`.
import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { features } from "@/config/features";
import type { EditorialDesk } from "../studio/useEditorialDesk";

export const COMPARE_PARAM = "compare";

export function withCompareParam(search: string, conversationId: string | null): string {
  const params = new URLSearchParams(search);
  if (conversationId) params.set(COMPARE_PARAM, conversationId);
  else params.delete(COMPARE_PARAM);
  const next = params.toString();
  return next ? `?${next}` : "";
}

/** The compare view is open for this conversation. */
export function isCompareOpen(params: URLSearchParams, conversationId: string | null | undefined): boolean {
  return features.diff && Boolean(conversationId) && params.get(COMPARE_PARAM) === conversationId;
}

export function useCompare(desk: Pick<EditorialDesk, "conversationId" | "detail">) {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const conversationId = desk.conversationId;
  const available = features.diff && Boolean(conversationId) && (desk.detail?.versions.length ?? 0) >= 2;
  return {
    /** Two versions or more: «قارن» shows. */
    available,
    open: available && isCompareOpen(params, conversationId),
    /** DeskDraft's `a.btn` «قارن» (a link, as the board draws it). */
    to: `${location.pathname}${withCompareParam(location.search, conversationId)}`,
    enter() {
      if (!available || !conversationId) return;
      setParams((prev) => new URLSearchParams(withCompareParam(prev.toString(), conversationId)));
    },
    exit() {
      setParams((prev) => new URLSearchParams(withCompareParam(prev.toString(), null)), { replace: true });
    },
  };
}

/**
 * The page that owns the studio: a reload with `?compare=` opens that conversation again (once); when another
 * draft — or none — takes the studio, the param is dropped.
 */
export function useCompareFocus(desk: Pick<EditorialDesk, "conversationId" | "openConversation">) {
  const [params, setParams] = useSearchParams();
  const param = features.diff ? params.get(COMPARE_PARAM) : null;
  const [restore, setRestore] = useState(param);
  useEffect(() => {
    if (!restore) return;
    setRestore(null);
    if (desk.conversationId !== restore) desk.openConversation(restore);
  }, [restore, desk]);

  const stale = param !== null && restore === null && desk.conversationId !== param;
  useEffect(() => {
    if (stale) setParams((prev) => new URLSearchParams(withCompareParam(prev.toString(), null)), { replace: true });
  }, [stale, setParams]);
}

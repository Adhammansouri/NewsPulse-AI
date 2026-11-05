// S12 NewPublish is a focus view of the newsroom: `/news?item={id}&publish={conversationId}`. The conversation
// id in the URL lets a reload open the same draft again (the draft itself is not in the URL), the browser's back
// returns to the draft, and the link can be opened in a new tab. «فحص ونشر» and S11's `P` shortcut open it.
import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import type { NewsSummarizeData } from "@newsplus/shared";
import { features } from "@/config/features";
import type { EditorialDesk } from "../studio/useEditorialDesk";
import { publishable } from "./publishModel";

export const PUBLISH_PARAM = "publish";

export function withPublishParam(search: string, conversationId: string | null): string {
  const params = new URLSearchParams(search);
  if (conversationId) params.set(PUBLISH_PARAM, conversationId);
  else params.delete(PUBLISH_PARAM);
  const next = params.toString();
  return next ? `?${next}` : "";
}

export type PublishEntry = {
  /** The focus view's link (Main's `a.btn` «فحص ونشر»). */
  to: string;
  /** `openPublish()` — for S11's `P` shortcut. */
  open: () => void;
};

/** «فحص ونشر» for the draft on screen: null when the flag is off or the draft is not a social post. */
export function usePublishEntry(desk: EditorialDesk): PublishEntry | null {
  const location = useLocation();
  const [, setParams] = useSearchParams();
  const conversationId = desk.conversationId;
  if (!features.publishCheck || !conversationId || !publishable(desk.summary)) return null;
  return {
    to: `${location.pathname}${withPublishParam(location.search, conversationId)}`,
    open: () => setParams((prev) => new URLSearchParams(withPublishParam(prev.toString(), conversationId))),
  };
}

/**
 * The newsroom (desktop): the draft to show in the focus view, or null. A reload opens the conversation in
 * `publish` again (once); when another draft — or none — takes the studio, the param is dropped.
 */
export function usePublishFocus(desk: EditorialDesk, mobile: boolean): NewsSummarizeData | null {
  const [params, setParams] = useSearchParams();
  const param = features.publishCheck && !mobile ? params.get(PUBLISH_PARAM) : null;
  const [restore, setRestore] = useState(param);
  useEffect(() => {
    if (!restore) return;
    setRestore(null);
    if (desk.conversationId !== restore) desk.openConversation(restore);
  }, [restore, desk]);

  const stale = param !== null && restore === null && desk.conversationId !== param;
  useEffect(() => {
    if (stale) setParams((prev) => new URLSearchParams(withPublishParam(prev.toString(), null)), { replace: true });
  }, [stale, setParams]);

  return param !== null && restore === null && desk.conversationId === param && publishable(desk.summary) ? desk.summary : null;
}

// S11: the newsroom as the command palette and `B` reach it (desktop /news). A palette pick shows in the studio, so
// breaking mode (S13, `&breaking=1`, which covers the studio) gives way first: the param is dropped, and the pick
// runs once that render is in — with that render's handlers, whose URL updates no longer carry the param.
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { NewsFeedItem } from "@newsplus/shared";
import { useHotkeyActions, type NewsroomBridge, type PaletteFormat } from "@/hooks/hotkeyActions";
import { BREAKING_PARAM } from "../breaking/breakingModel";
import type { EditorialDesk } from "../studio/useEditorialDesk";

type Pick =
  | { type: "item"; item: NewsFeedItem }
  | { type: "draft"; id: string }
  | { type: "write"; item: NewsFeedItem; format: PaletteFormat }
  | { type: "briefing" };

export function useNewsroomHotkeys({
  desk,
  selected,
  mobile,
  openStory,
  startBriefing,
}: {
  desk: EditorialDesk;
  selected: NewsFeedItem | null;
  mobile: boolean;
  /** NewsPage's wire pick: the story in the studio, `?item=` in the URL. */
  openStory: (item: NewsFeedItem) => void;
  /** NewsPage's «موجز الساعة». */
  startBriefing: () => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const breaking = searchParams.has(BREAKING_PARAM);
  const waiting = useRef<Pick | null>(null);

  function perform(pick: Pick) {
    if (pick.type === "item") openStory(pick.item);
    else if (pick.type === "draft") desk.openConversation(pick.id);
    else if (pick.type === "write") desk.startStoryFormat(pick.item, pick.format);
    else startBriefing();
  }

  function request(pick: Pick) {
    // S10: AI actions wait for the rate-limit cooldown (the desk checks again).
    if ((pick.type === "write" || pick.type === "briefing") && desk.aiCooldown) return;
    if (!breaking) {
      perform(pick);
      return;
    }
    waiting.current = pick;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(BREAKING_PARAM);
        return next;
      },
      { replace: true },
    );
  }

  useEffect(() => {
    const pick = waiting.current;
    if (!pick || breaking) return;
    waiting.current = null;
    perform(pick);
  });

  const bridge: NewsroomBridge = {
    story: selected,
    openItem: (item) => request({ type: "item", item }),
    openDraft: (id) => request({ type: "draft", id }),
    writeStory: (item, format) => request({ type: "write", item, format }),
    briefing: () => request({ type: "briefing" }),
  };
  useHotkeyActions({ newsroom: mobile ? undefined : bridge });
}

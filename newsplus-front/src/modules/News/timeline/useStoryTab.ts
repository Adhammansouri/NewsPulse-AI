// The open story's tab («الخبر | تطور القصة | المصادر»), back to «الخبر» whenever another story opens.
import { useState } from "react";
import type { StoryTab } from "./timelineModel";

export function useStoryTab(itemId: string | null | undefined): [StoryTab, (tab: StoryTab) => void] {
  const [state, setState] = useState<{ itemId: string | null; tab: StoryTab }>({ itemId: itemId ?? null, tab: "story" });
  const tab = state.itemId === (itemId ?? null) ? state.tab : "story";
  return [tab, (next) => setState({ itemId: itemId ?? null, tab: next })];
}

// S11: the desktop shell's keyboard layer — the global shortcuts (useHotkeys), the command palette (Ctrl/⌘ K) and
// the shortcuts sheet (`?`, the rail's keyboard button). Mounted once by MainLayout on desktop. What a key does on
// a screen is that screen's registered handler (hooks/hotkeyActions.ts); the page-wide keys are carried out here.
import { useNavigate, useLocation } from "react-router-dom";
import { features } from "@/config/features";
import { awaitHotkeyHandler, getHotkeyHandler } from "@/hooks/hotkeyActions";
import type { GoPage } from "@/hooks/hotkeys";
import { useAiCooldown } from "@/hooks/useAiCooldown";
import { useHotkeys, type HotkeyRunner } from "@/hooks/useHotkeys";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSession } from "@/hooks/useSession";
import { useTheme } from "@/hooks/useTheme";
import { useSocialPost } from "@/modules/Generate/useSocialPost";
import type { DeskHandoffState } from "@/services/deskHandoff";
import { CommandPalette } from "./CommandPalette";
import { GO_ORDER, GO_PAGES, type PaletteRun } from "./commandModel";
import { closeShellOverlay, openPalette, openShortcuts, useShellOverlay } from "./shellOverlay";
import { ShortcutsSheet } from "./ShortcutsSheet";

const NEWS_ROUTE = GO_PAGES.news.route;

export function Hotkeys() {
  const overlay = useShellOverlay();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { toggleTheme } = useTheme();
  const session = useSession();
  const cooldown = useAiCooldown();
  const isMobile = useIsMobile();
  /** The palette's «… عن {query}» with no matching story: written from the text, then opened in the studio. */
  const fromText = useSocialPost();

  // The rail's pages: «سير العمل» with its flag, the usage page for admins (its API answers 403 to editors).
  const pages = GO_ORDER.filter((page) => (page === "workflow" ? features.workflow : page === "usage" ? session?.user.role === "admin" : true));

  function go(page: GoPage): boolean {
    if (!pages.includes(page)) return false;
    navigate(GO_PAGES[page].route);
    return true;
  }

  /** `/`: the wire's search; from another page, the newsroom first. */
  function search(): boolean {
    const focus = getHotkeyHandler("search");
    if (focus) {
      focus();
      return true;
    }
    if (pathname === NEWS_ROUTE) return false;
    awaitHotkeyHandler("search");
    navigate(NEWS_ROUTE);
    return true;
  }

  /** «موجز الساعة» (S10: not during the AI cooldown). From another page: the S13 hand-off that starts it on arrival. */
  function briefing(): boolean {
    if (cooldown.active) return false;
    const newsroom = getHotkeyHandler("newsroom");
    if (newsroom) newsroom.briefing();
    else navigate(NEWS_ROUTE, { state: { briefing: true } satisfies DeskHandoffState });
    return true;
  }

  const run: HotkeyRunner = (action) => {
    switch (action.type) {
      case "palette":
        openPalette();
        return true;
      case "shortcuts":
        openShortcuts();
        return true;
      case "theme":
        toggleTheme();
        return true;
      case "go":
        return go(action.page);
      case "search":
        return search();
      case "briefing":
        return briefing();
      case "time":
      case "format": {
        const handler = getHotkeyHandler(action.type);
        if (!handler) return false;
        handler(action.index);
        return true;
      }
      default: {
        const handler = getHotkeyHandler(action.type);
        if (!handler) return false;
        handler();
        return true;
      }
    }
  };
  useHotkeys({ enabled: !isMobile, run });

  function runPick(pick: PaletteRun) {
    closeShellOverlay();
    const newsroom = getHotkeyHandler("newsroom");
    switch (pick.type) {
      case "write":
        if (cooldown.active) return;
        if (pick.story && newsroom) newsroom.writeStory(pick.story, pick.format);
        else if (pick.text) fromText.start(pick.text, "ar", pick.format);
        return;
      case "briefing":
        briefing();
        return;
      case "item":
        if (newsroom) newsroom.openItem(pick.item);
        else navigate(`${NEWS_ROUTE}?item=${encodeURIComponent(pick.item.id)}`);
        return;
      case "draft":
        if (newsroom) newsroom.openDraft(pick.id);
        else navigate(NEWS_ROUTE, { state: { conversationId: pick.id } satisfies DeskHandoffState });
        return;
      case "go":
        go(pick.page);
        return;
    }
  }

  if (isMobile) return null;
  if (overlay === "shortcuts") return <ShortcutsSheet onClose={closeShellOverlay} />;
  if (overlay !== "palette") return null;
  return (
    <CommandPalette
      story={getHotkeyHandler("newsroom")?.story ?? null}
      pages={pages}
      aiBlocked={cooldown.active}
      onClose={closeShellOverlay}
      onRun={runPick}
    />
  );
}

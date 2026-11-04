// /news — the newsroom. Desktop: the headline wire (WireColumn) next to the studio (DeskStudio), the open story
// in `?item=`. Mobile: the wire (MobWire); a story opens as its own screen, /news/:itemId (NewsStoryPage), and a
// mobile `?item=` deep link goes there. The briefing and drafts without a story stay on this page.
// Arrivals: the generate/translate hand-off `{ conversationId }` opens that conversation; «افتح» on the
// «المسودة جاهزة» toast brings `{ draftRunId }` (a finished background run); the home digest's `{ briefing }`
// starts the briefing. The state is cleared once used. `&breaking=1` opens breaking mode (S13) on the story,
// over the whole content area on desktop, as /news/:itemId/breaking on mobile.
import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useNavigationType, useSearchParams } from "react-router-dom";
import type { NewsFeedItem } from "@newsplus/shared";
import { useIsMobile } from "@/hooks/useIsMobile";
import { readDeskHandoff } from "@/services/deskHandoff";
import { IconButton } from "@/ui/IconButton";
import { DeskBreaking } from "../breaking/DeskBreaking";
import { BREAKING_PARAM, breakingPath, isBreakingMode } from "../breaking/breakingModel";
import { ArchiveDrawer } from "../studio/ArchiveDrawer";
import { DeskStudio } from "../studio/DeskStudio";
import { draftRunEstimate, draftRunInfo } from "../studio/draftRuns";
import { DraftError } from "../studio/draft/Editor";
import { MobDraft } from "../studio/draft/MobDraft";
import { formatCopy, mobileSteps, STUDIO_COPY } from "../studio/formats";
import { MobGenerating } from "../studio/MobGenerating";
import { StudioError } from "../studio/StudioError";
import { readStudioLinkState, storyPath, type StudioLinkState } from "../studio/studioLink";
import { useEditorialDesk } from "../studio/useEditorialDesk";
import { pinForBriefing } from "../wire/briefingPins";
import { forgetList, peekListMemory, rememberList } from "../wire/listMemory";
import { MobWire } from "../wire/MobWire";
import { useWire } from "../wire/useWire";
import { WireColumn } from "../wire/WireColumn";

const ITEM_PARAM = "item";

/** The list's own query (filters), without the story deep link. */
function listSearchOf(params: URLSearchParams): string {
  const next = new URLSearchParams(params);
  next.delete(ITEM_PARAM);
  const search = next.toString();
  return search ? `?${search}` : "";
}

export default function NewsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mobile = useIsMobile();
  const navigationType = useNavigationType();
  /** Mobile, back from a story (history back): the list's search and scroll as they were. */
  const [listRestore] = useState(() => (mobile && navigationType === "POP" ? peekListMemory() : null));
  const wire = useWire({ mobile, initialQuery: listRestore?.query });
  const handoff = readDeskHandoff(location.state);
  const arrival = readStudioLinkState(location.state);
  const itemParam = searchParams.get(ITEM_PARAM);

  const [selectedId, setSelectedId] = useState<string | null>(() => handoff?.itemId ?? itemParam);
  /** The open story as last seen: it stays open when filters or a search drop it from the wire (S04 §8). */
  const [snapshot, setSnapshot] = useState<NewsFeedItem | null>(null);
  /** Mobile: the briefing / a draft without a story shows over the list. */
  const [mobilePane, setMobilePane] = useState<"feed" | "desk">("feed");
  const [autoSelectDone, setAutoSelectDone] = useState(false);

  const live = selectedId ? wire.allItems.find((item) => item.id === selectedId) : undefined;
  const selected = live ?? (snapshot?.id === selectedId ? snapshot : null);
  if (live && live !== snapshot) setSnapshot(live);

  // Only the very first desktop load opens the top headline by itself; later polls and filters never do.
  if (!autoSelectDone && !mobile && !wire.loading) {
    setAutoSelectDone(true);
    const first = wire.rows[0];
    if (!selectedId && first) {
      setSelectedId(first.id);
      setSnapshot(first.item);
    }
  }

  const syncItemParam = (id: string | null) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set(ITEM_PARAM, id);
        else next.delete(ITEM_PARAM);
        return next;
      },
      { replace: true },
    );

  const desk = useEditorialDesk({
    selected,
    onOpenItem: (itemId, conversationId) => {
      if (mobile) {
        // A story's draft lives on its own screen on mobile; «رجوع» comes back to this list.
        const state: StudioLinkState = { conversationId, fromList: true, listSearch: listSearchOf(searchParams) };
        navigate(storyPath(itemId), { state });
        return;
      }
      setSelectedId(itemId);
      syncItemParam(itemId);
    },
    onShowDesk: () => setMobilePane("desk"),
  });

  useEffect(() => {
    if (!handoff?.input) return;
    navigate("/generate", {
      replace: true,
      state: { prompt: handoff.input, source: "news", style: "brief" },
    });
  }, [handoff?.input, navigate]);

  useEffect(() => {
    if (listRestore) forgetList();
  }, [listRestore]);

  // Arrivals, once per history entry; the state is cleared so a reload doesn't reopen it.
  const arrivalKey = useRef<string | null>(null);
  const redirectToStory = mobile && itemParam !== null;
  useEffect(() => {
    if (redirectToStory || arrivalKey.current === location.key) return;
    arrivalKey.current = location.key;
    const conversationId = handoff?.conversationId;
    const briefing = handoff?.briefing === true;
    const { draftRunId } = arrival;
    if (draftRunId === undefined && !conversationId && !briefing) return;
    if (draftRunId !== undefined) {
      const itemId = draftRunInfo(draftRunId)?.itemId ?? null;
      if (desk.adoptRun(draftRunId)) {
        if (mobile) setMobilePane("desk");
        else if (itemId) {
          setSelectedId(itemId);
          const item = wire.allItems.find((entry) => entry.id === itemId);
          if (item) setSnapshot(item);
        }
      }
    } else if (conversationId) {
      desk.openConversation(conversationId);
    } else if (briefing) {
      // «حوّله لموجز صباحي» (S13 home digest): its stories are pinned first in the briefing.
      startBriefing();
    }
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  });

  /** A story picked in the wire. The wire stays usable while AI writes; a run in flight finishes in the archive. */
  function openStory(item: NewsFeedItem) {
    if (item.id === selectedId && !desk.showEditorial && desk.selectedFormat !== "briefing") return;
    desk.openStory();
    setSelectedId(item.id);
    setSnapshot(item);
    syncItemParam(item.id);
  }

  /** Mobile: the story screen, remembering how to come back to this list. */
  function openStoryScreen(item: NewsFeedItem, write?: "social") {
    rememberList({ query: wire.query, scrollTop: wire.listRef.current?.scrollTop ?? 0 });
    const state: StudioLinkState = { fromList: true, item, listSearch: listSearchOf(searchParams), write };
    navigate(storyPath(item.id), { state });
  }

  function startBriefing() {
    setMobilePane("desk");
    desk.startBriefing();
  }

  if (redirectToStory) {
    const state: StudioLinkState = { ...arrival, conversationId: arrival.conversationId ?? handoff?.conversationId, listSearch: listSearchOf(searchParams) };
    return <Navigate to={isBreakingMode(searchParams) ? breakingPath(itemParam) : storyPath(itemParam)} replace state={state} />;
  }

  if (mobile) {
    const showPane = mobilePane === "desk" && (desk.generating || desk.showEditorial || Boolean(desk.error));
    if (showPane && desk.generating && desk.runFormat) {
      const leave = () => {
        desk.detachRun();
        setMobilePane("feed");
      };
      return (
        <MobGenerating
          name={formatCopy(desk.runFormat, desk.runSlides).name}
          steps={mobileSteps(desk.runFormat, 0, desk.runSlides, desk.approvedRules)}
          startedAt={desk.runStartedAt ?? Date.now()}
          estimate={draftRunEstimate()}
          backHref="/news"
          listHref="/news"
          onBack={leave}
          onBrowse={leave}
          onCancel={() => {
            desk.cancelRun();
            setMobilePane("feed");
          }}
        />
      );
    }
    if (showPane && desk.showEditorial) {
      // The briefing, or a draft opened without its story: «رجوع» leaves it for the headlines.
      return (
        <>
          <MobDraft
            desk={desk}
            onBack={() => {
              desk.closeDraft();
              setMobilePane("feed");
            }}
          />
          <ArchiveDrawer desk={desk} />
        </>
      );
    }
    if (showPane) {
      // The briefing failed to generate (or a saved draft failed to open): the error, its retry, and the way back.
      return (
        <>
          <header className="m-bar">
            <IconButton label={STUDIO_COPY.back} icon="arrow-back" onClick={() => setMobilePane("feed")} />
          </header>
          <main className="m-scroll col" style={{ padding: "14px 18px 18px", gap: "12px" }}>
            {desk.generateError ? <StudioError error={desk.generateError} onRetry={desk.retry} /> : <DraftError error={desk.error} />}
          </main>
          <ArchiveDrawer desk={desk} />
        </>
      );
    }
    return (
      <>
        <MobWire
          wire={wire}
          onOpen={(item) => openStoryScreen(item)}
          onBriefing={startBriefing}
          onWrite={(item) => openStoryScreen(item, "social")}
          onPin={(item) => pinForBriefing(item.id)}
          restoreScrollTop={listRestore?.scrollTop ?? null}
        />
        <ArchiveDrawer desk={desk} />
      </>
    );
  }

  // DeskCarousel takes the whole content area (no headlines column).
  const carouselDraft = desk.showEditorial && desk.resultFormat === "carousel" && Boolean(desk.summary);
  // NewBreaking (S13, `?item=…&breaking=1`) also takes the whole content area.
  const breakingMode = isBreakingMode(searchParams) && selected !== null;

  /** «اكتب منشور مفصّل»: leave breaking mode for the story's normal social flow. */
  function leaveBreaking(item: NewsFeedItem) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(BREAKING_PARAM);
        return next;
      },
      { replace: true },
    );
    desk.openStory();
    desk.startSocial(item);
  }

  return (
    <div className="grow" style={{ display: "flex", minHeight: 0, overflow: "hidden" }}>
      {!carouselDraft && !breakingMode && (
        <WireColumn wire={wire} selectedId={selectedId} onSelect={openStory} onBriefing={startBriefing} />
      )}
      <div
        style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg)",
        }}
      >
        {breakingMode && selected ? (
          <DeskBreaking key={selected.id} item={selected} onExit={() => leaveBreaking(selected)} />
        ) : (
          <DeskStudio desk={desk} selected={selected} languages={wire.languages} wireLoading={wire.loading} />
        )}
        <ArchiveDrawer desk={desk} />
      </div>
    </div>
  );
}

// /news/:itemId — the story as its own mobile screen (S05 §3): MobStory (the article, «ماذا ننشر؟», the sticky
// CTA), the carousel settings sheet (MobStory-carousel), MobGenerating while the editor writes, then the draft
// (MobDraft, S06). Desktop has no such screen: it opens the story in the studio, `/news?item=`.
// Arrival state (studioLink.ts), used once then cleared: «افتح» adopts a finished run, an archived or handed-off
// conversation opens, swipe «اكتب منشور» starts the social post.
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import type { NewsFeedItem } from "@newsplus/shared";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { getNewsSources } from "@/services/newsService";
import { ArchiveDrawer } from "../studio/ArchiveDrawer";
import { draftRunEstimate } from "../studio/draftRuns";
import { formatCopy, mobileCtaHint, mobileSteps } from "../studio/formats";
import { MobDraft } from "../studio/draft/MobDraft";
import { MobCarouselSheet } from "../studio/MobCarouselSheet";
import { MobGenerating } from "../studio/MobGenerating";
import { MobStory, MobStoryBar } from "../studio/MobStory";
import { StudioError } from "../studio/StudioError";
import { storyModel } from "../studio/storyModel";
import { readStudioLinkState, storyPath, studioLink, type StudioLinkState } from "../studio/studioLink";
import { useEditorialDesk } from "../studio/useEditorialDesk";
import { sourceLanguages } from "../wire/filters";

export default function NewsStoryPage() {
  const { itemId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const link = readStudioLinkState(location.state);

  // Same queries (and cache) as the wire, so a story opened from the list is on screen at once.
  const feedQuery = useNewsFeed("all", "");
  const sourcesQuery = useQuery({ queryKey: ["news-sources"], queryFn: getNewsSources });
  const languages = useMemo(() => sourceLanguages(sourcesQuery.data?.sources ?? []), [sourcesQuery.data]);

  /** The story as last seen (or as tapped): it stays readable when the feed moves on or a search found it. */
  const [snapshot, setSnapshot] = useState<NewsFeedItem | null>(() => (link.item?.id === itemId ? link.item : null));
  const live = feedQuery.data?.items.find((entry) => entry.id === itemId);
  if (live && live !== snapshot) setSnapshot(live);
  const item = live ?? (snapshot?.id === itemId ? snapshot : null);

  const [sheetOpen, setSheetOpen] = useState(false);

  const listHref = `/news${link.listSearch ?? ""}`;
  /** «رجوع»: back in history to the list as it was (scroll, search, filters), or to the list when opened directly. */
  function backToList() {
    if (link.fromList) navigate(-1);
    else navigate(listHref, { replace: true });
  }

  const desk = useEditorialDesk({
    selected: item,
    onOpenItem: (openedId, conversationId) => {
      if (openedId === itemId) return;
      // A conversation of another story (archive): that story's screen opens it.
      const state: StudioLinkState = { conversationId, fromList: link.fromList, listSearch: link.listSearch };
      navigate(storyPath(openedId), { replace: true, state });
    },
    onShowDesk: () => undefined,
  });

  // Arrivals, once per history entry; the state is cleared so a reload doesn't repeat them.
  const arrivalKey = useRef<string | null>(null);
  useEffect(() => {
    if (!mobile || arrivalKey.current === location.key) return;
    arrivalKey.current = location.key;
    const { draftRunId, conversationId, write } = link;
    if (draftRunId === undefined && !conversationId && !write) return;
    if (draftRunId !== undefined) desk.adoptRun(draftRunId);
    else if (conversationId) desk.openConversation(conversationId);
    else if (write && item) desk.startSocial(item);
    const state: StudioLinkState = { fromList: link.fromList, listSearch: link.listSearch, item: link.item };
    navigate(location.pathname, { replace: true, state });
  });

  if (!mobile) return <Navigate to={studioLink(itemId)} replace state={location.state} />;

  if (desk.showEditorial) {
    // «رجوع إلى الخبر»: the story and its formats, the draft's format still chosen.
    return (
      <>
        <MobDraft desk={desk} onBack={desk.closeDraft} />
        <ArchiveDrawer desk={desk} />
      </>
    );
  }

  const story = item ? storyModel(item, languages, true) : null;

  if (desk.generating && desk.runFormat) {
    return (
      <MobGenerating
        name={formatCopy(desk.runFormat, desk.runSlides).name}
        steps={mobileSteps(desk.runFormat, story?.sourceCount ?? 0, desk.runSlides, desk.approvedRules)}
        startedAt={desk.runStartedAt ?? Date.now()}
        estimate={draftRunEstimate()}
        backHref={location.pathname}
        listHref={listHref}
        onBack={desk.detachRun}
        onBrowse={() => {
          desk.detachRun();
          backToList();
        }}
        onCancel={desk.cancelRun}
      />
    );
  }

  const source = story?.links[0];
  const bar = (
    <MobStoryBar
      backHref={listHref}
      onBack={backToList}
      onOpenSource={source ? () => window.open(source.url, "_blank", "noopener") : undefined}
    />
  );

  if (!story) {
    // Nothing to show: the feed is still loading or an arrival is opening a draft; otherwise the story is gone.
    const waiting = feedQuery.isPending || link.draftRunId !== undefined || Boolean(link.conversationId);
    if (!waiting) return <Navigate to={listHref} replace />;
    return (
      <>
        {bar}
        <main className="m-scroll" />
        <ArchiveDrawer desk={desk} />
      </>
    );
  }

  const copy = formatCopy(desk.selectedFormat, desk.carouselOptions.slides);
  return (
    <>
      {bar}
      <MobStory
        story={story}
        selected={desk.selectedFormat}
        hint={mobileCtaHint(desk.selectedFormat, copy, story.sourceCount)}
        action={copy.action}
        notice={desk.generateError && <StudioError error={desk.generateError} onRetry={desk.retry} />}
        onSelect={(format) => {
          desk.selectFormat(format);
          if (format === "carousel") setSheetOpen(true);
        }}
        onGenerate={desk.generateSummary}
      />
      <MobCarouselSheet
        open={sheetOpen}
        options={desk.carouselOptions}
        onChange={desk.setCarouselOptions}
        onClose={() => setSheetOpen(false)}
        onGenerate={() => {
          setSheetOpen(false);
          desk.generateSummary();
        }}
      />
      <ArchiveDrawer desk={desk} />
    </>
  );
}

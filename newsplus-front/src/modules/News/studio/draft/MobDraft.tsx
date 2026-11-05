// MobDraft (+ -video / -carousel / -briefing / -desk / -facts / -revising / -memory / -error): the draft on its own
// mobile screen — the m-bar (back, format, versions, «نسخ الكل»), the provenance line, the format's blocks, the
// revision thread inline, the memory suggestion floating above the dock, and the revise dock. No tab bar.
import { useEffect, useRef, useState } from "react";
import type { NewsSummarizeData } from "@newsplus/shared";
import { useHideTabBar } from "@/components/shell/tabBarVisibility";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { formatSummaryClipboard } from "../../newsFormat";
import { MobDraftSeg, MobPublish, mobPreviewAvailable, type MobDraftView } from "../../publish/MobPublish";
import { useCarouselPainter } from "../../useCarouselPainter";
import { slideViews } from "../carousel/carouselModel";
import { MobCarousel } from "../carousel/MobCarousel";
import { MobDraftSkeleton } from "../DraftSkeleton";
import { formatCopy } from "../formats";
import { M_CTA_STYLE } from "../MobStory";
import type { EditorialDesk } from "../useEditorialDesk";
import { DRAFT_COPY, formatNoun, MOB_FORMAT_NAME, offersToVideo, quickRevisions, redrawSlide, TO_VIDEO } from "./copy";
import { VersionChips } from "./DeskDraft";
import { DraftCopyProvider, selectText, useDraftCopy } from "./DraftBlock";
import { useTypeset } from "./draftHooks";
import { revision } from "./draftModel";
import { DraftError, MemoryFloat, ReviseDock, ReviseError, Thread, type QuickChip } from "./Editor";
import { MobFormat } from "./MobFormats";
import { threadTurns } from "./thread";

/** MobDraft's dock: `padding-bottom: 26px; flex: none`, plus the safe area (GLOBAL-RULES §6). */
const DOCK_STYLE = { ...M_CTA_STYLE, flex: "none" } as const;

export function MobDraft({ desk, onBack }: { desk: EditorialDesk; onBack: () => void }) {
  useHideTabBar(true);
  const data = desk.summary;
  if (!data) {
    return (
      <>
        <header className="m-bar">
          <IconButton label={DRAFT_COPY.backToStory} icon="arrow-back" onClick={onBack} />
        </header>
        <main className="m-scroll col" style={{ padding: "14px 18px 18px", gap: "12px" }} aria-busy="true">
          <MobDraftSkeleton />
        </main>
      </>
    );
  }
  return (
    <DraftCopyProvider>
      <DraftView desk={desk} data={data} onBack={onBack} />
    </DraftCopyProvider>
  );
}

function DraftView({ desk, data, onBack }: { desk: EditorialDesk; data: NewsSummarizeData; onBack: () => void }) {
  const { done, copy } = useDraftCopy();
  /** MobNewPreview (S12): «المسودة | المعاينة» at the top of a social draft. */
  const [view, setView] = useState<MobDraftView>("draft");
  const preview = mobPreviewAvailable(data);
  const scrollRef = useRef<HTMLElement>(null);
  const format = data.format;
  const carousel = format === "carousel";
  const name = MOB_FORMAT_NAME[format] ?? formatCopy(format, data.carousel?.slides.length ?? 0).name;
  const rev = revision(desk.detail, data);
  const turns = threadTurns(desk.detail, { format, rules: desk.approvedRules, opening: false });
  const rule = (desk.detail?.pendingMemory ?? []).find((item) => item.status === "pending");
  const painter = useCarouselPainter(carousel ? data : undefined);
  const views = carousel ? slideViews(painter.slides, painter.painting) : [];

  // A new message (or the editor starting to answer) shows at the bottom; a failed revision shows its notice at
  // the top. Opening the draft keeps it at the top.
  const lastTurn = turns.at(-1)?.key;
  const shownTurn = useRef(lastTurn);
  useEffect(() => {
    if (!desk.revising && lastTurn === shownTurn.current) return;
    shownTurn.current = lastTurn;
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lastTurn, desk.revising]);
  useEffect(() => {
    if (desk.failedInstruction && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [desk.failedInstruction]);

  const chips: QuickChip[] = quickRevisions(format, true).map((label) => ({ key: label, label, run: () => desk.revise(label) }));
  const toRedraw = views.find((view) => view.phase === "review" || view.phase === "failed");
  if (toRedraw) {
    const index = toRedraw.slide.index;
    chips.push({ key: "redraw", label: redrawSlide(toRedraw.n), run: () => void painter.redraw(index) });
  }
  if (offersToVideo(format, true)) chips.push({ key: "video", label: TO_VIDEO, run: () => desk.switchFormat("video") });

  function copyAll() {
    copy("all", formatSummaryClipboard(data), DRAFT_COPY.copiedAll(formatNoun(format)), () => selectText(scrollRef.current));
  }

  const versionKey = data.versionId ?? "draft";

  if (preview && view === "preview") return <MobPublish desk={desk} data={data} onDraft={() => setView("draft")} />;

  return (
    <>
      <header className="m-bar">
        <IconButton label={DRAFT_COPY.backToStory} icon="arrow-back" onClick={onBack} />
        <Badge variant="ai">{name}</Badge>
        <VersionChips desk={desk} data={data} />
        <Button variant="ink" size="sm" onClick={copyAll}>
          <Icon name="copy" size="sm" />
          {done === "all" ? DRAFT_COPY.copied : DRAFT_COPY.copyAll}
        </Button>
      </header>

      <main ref={scrollRef} className="m-scroll col" style={{ padding: "14px 18px 18px", gap: "12px" }}>
        {preview && <MobDraftSeg value="draft" onChange={setView} />}
        <p className="ai-mark" style={{ color: "var(--ink-3)" }}>
          <Icon name="sparkle" size="sm" />
          {DRAFT_COPY.provenance(data.sources.length, desk.approvedRules)}
        </p>
        {desk.reviseError && desk.failedInstruction && (
          <ReviseError error={desk.reviseError} instruction={desk.failedInstruction} onRetry={desk.retryRevision} conflict={desk.conflict} />
        )}
        {desk.draftError && <DraftError error={desk.draftError} />}
        {carousel ? (
          <CarouselVersion
            key={versionKey}
            versionKey={versionKey}
            data={data}
            views={views}
            painting={painter.painting}
            onRedraw={(index) => void painter.redraw(index)}
          />
        ) : (
          <FormatVersion key={versionKey} versionKey={versionKey} data={data} desk={desk} rev={rev} />
        )}
        <Thread turns={turns} pending={desk.pendingInstruction} revising={desk.revising} mobile />
      </main>

      {rule && <MemoryFloat key={rule.id} rule={rule} busy={desk.busy} onSave={desk.saveMemory} onDismiss={desk.dismissMemory} />}

      <ReviseDock
        value={desk.instruction}
        onChange={desk.setInstruction}
        onSubmit={desk.submitRevision}
        chips={chips}
        busy={desk.busy}
        mobile
        style={DOCK_STYLE}
      />
    </>
  );
}

function FormatVersion({
  versionKey,
  data,
  desk,
  rev,
}: {
  versionKey: string;
  data: NewsSummarizeData;
  desk: EditorialDesk;
  rev: ReturnType<typeof revision>;
}) {
  const typeset = useTypeset(versionKey);
  const createdAt =
    desk.detail?.versions.find((version) => version.id === data.versionId)?.createdAt ?? desk.detail?.createdAt ?? null;
  return <MobFormat data={data} rev={rev} typeset={typeset} busy={desk.busy || desk.aiCooldown} onRevise={desk.revise} createdAt={createdAt} />;
}

function CarouselVersion({
  versionKey,
  ...props
}: { versionKey: string } & Omit<Parameters<typeof MobCarousel>[0], "typeset">) {
  const typeset = useTypeset(versionKey);
  return <MobCarousel {...props} typeset={typeset} />;
}

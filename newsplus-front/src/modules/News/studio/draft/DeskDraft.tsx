// The desktop draft (Main-social / -briefing / -desk / -bulletin / -facts / -context, DeskDraft for video): the
// toolbar, the AI provenance line, the format's blocks, and the editor aside (344px) with its thread, memory
// suggestions and the revise dock. 1024–1279px (GLOBAL-RULES §6): no aside — the thread follows the draft and the
// dock sits at the bottom of the studio. «قارن» (S14) and «فحص ونشر» (S12) come with their feature flags.
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { EditorialVersion, NewsSummarizeData } from "@newsplus/shared";
import { Badge } from "@/ui/Badge";
import { Button, buttonClassName } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { VersionChip } from "@/ui/VersionChip";
import { formatSummaryClipboard } from "../../newsFormat";
import { PUBLISH_COPY } from "../../publish/publishCopy";
import { usePublishEntry } from "../../publish/publishLink";
import { DeskDraftSkeleton } from "../DraftSkeleton";
import { formatCopy } from "../formats";
import type { EditorialDesk } from "../useEditorialDesk";
import { DRAFT_COPY, formatNoun, quickRevisions, versionLabel } from "./copy";
import { DeskFormat } from "./DeskFormats";
import { DraftCopyProvider, selectText, useDraftCopy } from "./DraftBlock";
import { downloadText, fileStamp, useCompactStudio, useTypeset } from "./draftHooks";
import { revision } from "./draftModel";
import { DraftError, MemoryPanel, ReviseDock, ReviseError, Thread, type QuickChip } from "./Editor";
import { threadTurns } from "./thread";

/** A notice above the draft keeps the provenance line's gap (14px) to it. */
const NOTICE_GAP = { marginBottom: "14px" } as const;

export function DeskDraft({ desk }: { desk: EditorialDesk }) {
  const data = desk.summary;
  if (!data) {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "22px 34px 34px" }} aria-busy="true">
        <DeskDraftSkeleton format={desk.resultFormat} />
      </div>
    );
  }
  return (
    <DraftCopyProvider>
      <DraftView desk={desk} data={data} />
    </DraftCopyProvider>
  );
}

function draftVersions(desk: EditorialDesk, data: NewsSummarizeData): Array<Pick<EditorialVersion, "id" | "number">> {
  const versions = desk.detail?.versions;
  if (versions && versions.length > 0) return [...versions].sort((a, b) => a.number - b.number);
  return data.versionId ? [{ id: data.versionId, number: data.versionNumber ?? 1 }] : [];
}

/**
 * The version chips (Main-social / MobDraft): older ones restore (`POST …/restore`), the current one is
 * marked. The list is also the bar's `grow` spacer: every restore adds a version, so a long list takes only
 * the free space and scrolls sideways (`scroll-x`), keeping the current chip in view, instead of squeezing the
 * bar's buttons.
 */
export function VersionChips({ desk, data }: { desk: EditorialDesk; data: NewsSummarizeData }) {
  const listRef = useRef<HTMLSpanElement>(null);
  const versions = draftVersions(desk, data);
  const currentId = desk.detail?.currentVersionId ?? data.versionId;
  useEffect(() => {
    const list = listRef.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    list.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [currentId, versions.length]);
  if (versions.length === 0) return <span className="grow" />;
  return (
    <span ref={listRef} className="row scroll-x grow" style={{ gap: "4px" }} role="list" aria-label={DRAFT_COPY.versions}>
      {versions.map((version) => {
        const current = version.id === currentId;
        return (
          <span key={version.id} role="listitem">
            <VersionChip
              as="button"
              current={current}
              aria-label={current ? DRAFT_COPY.currentVersion(version.number) : DRAFT_COPY.restoreVersion(version.number)}
              onClick={() => {
                if (!current) desk.restore(version.id);
              }}
            >
              {versionLabel(version.number)}
            </VersionChip>
          </span>
        );
      })}
    </span>
  );
}

function DraftView({ desk, data }: { desk: EditorialDesk; data: NewsSummarizeData }) {
  const compact = useCompactStudio();
  const { done, copy } = useDraftCopy();
  const draftRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const format = data.format;
  const name = formatCopy(format, data.carousel?.slides.length ?? 0).name;
  const versions = draftVersions(desk, data);
  const rev = revision(desk.detail, data);
  const turns = threadTurns(desk.detail, { format, rules: desk.approvedRules, opening: true });
  const memory = (desk.detail?.pendingMemory ?? []).filter((rule) => rule.status === "pending");
  const video = format === "video";
  /** «فحص ونشر» (S12): the NewPublish focus view of a social draft. */
  const publish = usePublishEntry(desk);

  // The thread follows the latest message.
  const lastTurn = turns.at(-1)?.key;
  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lastTurn, desk.revising, memory.length]);
  useEffect(() => {
    if (desk.failedInstruction && draftRef.current) draftRef.current.scrollTop = 0;
  }, [desk.failedInstruction]);

  const chips: QuickChip[] = quickRevisions(format, false).map((label) => ({ key: label, label, run: () => desk.revise(label) }));

  function copyAll() {
    copy("all", formatSummaryClipboard(data), DRAFT_COPY.copiedAll(formatNoun(format)), () => selectText(draftRef.current));
  }

  const thread = (
    <>
      <Thread turns={turns} pending={desk.pendingInstruction} revising={desk.revising} mobile={false} />
      {memory.map((rule) => (
        <MemoryPanel key={rule.id} rule={rule} busy={desk.busy} onSave={desk.saveMemory} onDismiss={desk.dismissMemory} />
      ))}
    </>
  );

  const dock = (
    <ReviseDock
      value={desk.instruction}
      onChange={desk.setInstruction}
      onSubmit={desk.submitRevision}
      chips={chips}
      busy={desk.busy}
      mobile={false}
    />
  );

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
      <div className="grow col">
        <div className="row" style={{ padding: "12px 22px", background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
          <Button variant="ghost" size="sm" onClick={desk.closeDraft}>
            <Icon name="arrow-back" size="sm" />
            {DRAFT_COPY.story}
          </Button>
          <Badge variant="ai">{name}</Badge>
          <VersionChips desk={desk} data={data} />
          <IconButton label={DRAFT_COPY.switchFormat} title={DRAFT_COPY.switchFormat} icon="swap" onClick={desk.closeDraft} />
          {publish && (
            <Link className={buttonClassName({ variant: "quiet", size: "sm" })} to={publish.to}>
              <Icon name="check" size="sm" />
              {PUBLISH_COPY.entry}
            </Link>
          )}
          <IconButton
            label={DRAFT_COPY.download}
            icon="download"
            onClick={() => downloadText(formatSummaryClipboard(data), `newsplus-${format}-${fileStamp()}.txt`)}
          />
          <Button variant="ink" size="sm" onClick={copyAll}>
            <Icon name="copy" size="sm" />
            {done === "all" ? DRAFT_COPY.copied : DRAFT_COPY.copyAll}
          </Button>
        </div>
        <div ref={draftRef} style={{ flex: 1, overflowY: "auto", padding: video ? "22px 34px" : "22px 34px 34px" }}>
          <p className="ai-mark" style={{ marginBottom: video ? "16px" : "14px", color: "var(--ink-3)" }}>
            <Icon name="sparkle" size="sm" />
            {DRAFT_COPY.provenance(data.sources.length, desk.approvedRules)}
          </p>
          {desk.reviseError && desk.failedInstruction && (
            <ReviseError error={desk.reviseError} instruction={desk.failedInstruction} onRetry={desk.retryRevision} conflict={desk.conflict} style={NOTICE_GAP} />
          )}
          {desk.draftError && <DraftError error={desk.draftError} style={NOTICE_GAP} />}
          <VersionDraft key={data.versionId ?? "draft"} versionKey={data.versionId ?? "draft"} data={data} desk={desk} rev={rev} />
          {compact && (
            <div ref={threadRef} className="col" style={{ paddingTop: "16px", gap: "10px" }}>
              {thread}
            </div>
          )}
        </div>
        {compact && dock}
      </div>
      {!compact && (
        <aside
          aria-label={DRAFT_COPY.editor}
          style={{ width: "344px", flex: "none", display: "flex", flexDirection: "column", background: "var(--surface)", borderInlineEnd: "1px solid var(--line)" }}
        >
          <div className="row" style={{ justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
            <div className="row">
              <span className="ic-wrap ic-wrap--ai" style={{ width: "32px", height: "32px", borderRadius: "10px" }}>
                <Icon name="sparkle" size="sm" />
              </span>
              <h3 className="t-head">{DRAFT_COPY.editor}</h3>
            </div>
            <span className="t-meta">{versions.length > 1 ? DRAFT_COPY.versionsSaved(versions.length) : DRAFT_COPY.everyEdit}</span>
          </div>
          <div ref={threadRef} className="col" style={{ flex: 1, overflowY: "auto", padding: "16px 18px", gap: "10px" }}>
            {thread}
          </div>
          {dock}
        </aside>
      )}
    </div>
  );
}

/** One version's blocks; remounted per version so a new one types in (`typeset`) once. */
function VersionDraft({
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
  return <DeskFormat data={data} rev={rev} typeset={typeset} busy={desk.busy || desk.aiCooldown} onRevise={desk.revise} />;
}

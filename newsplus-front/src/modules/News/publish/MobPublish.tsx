// MobNewPreview + MobNewCheck (S12 §3) — ports of docs/redesign/design/reference/MobNewPreview.dc.html and
// MobNewCheck.dc.html. Inside the mobile draft, «المسودة | المعاينة» (`seg seg--block`) switches to the preview:
// platform chips, the frame, the main issue as a `notice--warn` with its fix, the ring row and «نسخ لـ{platform}».
// The first copy of a version that has notes opens «فحص قبل النشر» as a sheet; «انسخ زي ما هو» copies anyway.
import { useRef, useState } from "react";
import type { NewsSummarizeData } from "@newsplus/shared";
import { features } from "@/config/features";
import { useAiCooldown } from "@/hooks/useAiCooldown";
import { usePreferences } from "@/hooks/usePreferences";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { ErrorSurface } from "@/ui/ErrorSurface";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { Notice } from "@/ui/Notice";
import { Ring } from "@/ui/Ring";
import { Segmented } from "@/ui/Segmented";
import { Sheet } from "@/ui/Sheet";
import { M_CTA_STYLE } from "../studio/MobStory";
import { DRAFT_COPY, formatNoun, MOB_FORMAT_NAME } from "../studio/draft/copy";
import { selectText, useDraftCopy } from "../studio/draft/DraftBlock";
import { draftDir } from "../studio/draft/draftModel";
import { ReviseError } from "../studio/draft/Editor";
import { formatCopy } from "../studio/formats";
import type { EditorialDesk } from "../studio/useEditorialDesk";
import { CheckRows, CheckRowsSkeleton } from "./CheckRows";
import { InstagramFrame, PlatformFrame } from "./PlatformFrame";
import { PLATFORM_NAME, PUBLISH_COPY } from "./publishCopy";
import {
  arabicCount,
  openingPlatform,
  orderedPlatforms,
  platformView,
  publishable,
  publishParts,
  storyHeadline,
  type Platform,
} from "./publishModel";
import { usePublishCheck } from "./usePublishCheck";

export type MobDraftView = "draft" | "preview";

const VIEW_OPTIONS = [
  { value: "draft", label: PUBLISH_COPY.draft },
  { value: "preview", label: PUBLISH_COPY.preview },
] as const;

/** The preview exists for a social draft, behind `features.publishCheck`. */
export function mobPreviewAvailable(data: NewsSummarizeData): boolean {
  return features.publishCheck && publishable(data);
}

/** MobNewPreview's `seg seg--block` «المسودة | المعاينة», at the top of the draft's content. */
export function MobDraftSeg({ value, onChange }: { value: MobDraftView; onChange: (next: MobDraftView) => void }) {
  return <Segmented block options={VIEW_OPTIONS} value={value} onChange={onChange} />;
}

/** MobNewPreview shows Instagram (the platform its frame is drawn for). */
const MOB_DEFAULT_PLATFORM: Platform = "instagram";

/** Versions whose check sheet already opened on a copy (once per version, for the session). */
const sheetShownFor = new Set<string>();

const SCROLL_STYLE = { padding: "14px 16px", gap: "14px" } as const;
const CHIPS_STYLE = { marginInline: "-16px", paddingInline: "16px" } as const;
const NOTICE_STYLE = { fontSize: "13.5px", alignItems: "center" } as const;
const SHEET_STRIP_STYLE = { margin: "6px 20px 0", borderRadius: "3px" } as const;
const SHEET_HEAD_STYLE = { justifyContent: "space-between", padding: "12px 20px 4px" } as const;

export function MobPublish({
  desk,
  data,
  onDraft,
}: {
  desk: EditorialDesk;
  data: NewsSummarizeData;
  /** «المسودة» / back: the draft again. */
  onDraft: () => void;
}) {
  const cooldown = useAiCooldown();
  const { done, copy } = useDraftCopy();
  const frameRef = useRef<HTMLElement>(null);
  // S16: the editor's platforms first (onboarding); the chip picked here wins over the opening one.
  const preferred = usePreferences().data?.platforms;
  const [picked, setPlatform] = useState<Platform | null>(null);
  const platform = picked ?? openingPlatform(preferred, MOB_DEFAULT_PLATFORM);
  const [sheetOpen, setSheetOpen] = useState(false);
  const check = usePublishCheck(desk, platform);

  const name = MOB_FORMAT_NAME[data.format] ?? formatCopy(data.format, 0).name;
  const parts = publishParts(data);
  const view = platformView(platform, parts, true);
  const headline = storyHeadline(desk.detail, data);
  const dir = draftDir(data);
  const versionId = desk.detail?.currentVersionId ?? data.versionId ?? null;
  const canFix = check.canFix && !cooldown.active;
  const issue = check.mainIssue;

  function copyNow() {
    copy("publish", view.copy, DRAFT_COPY.copiedAll(formatNoun(data.format)), () => selectText(frameRef.current));
  }

  function copyForPlatform() {
    if (versionId && check.summary.notes > 0 && !check.stale && !sheetShownFor.has(versionId)) {
      sheetShownFor.add(versionId);
      setSheetOpen(true);
      return;
    }
    copyNow();
  }

  return (
    <>
      <header className="m-bar">
        <IconButton label={PUBLISH_COPY.mobBack} icon="arrow-back" onClick={onDraft} />
        <span className="m-bar__title">{PUBLISH_COPY.mobTitle}</span>
        <Badge variant="ai">{name}</Badge>
      </header>

      <main className="m-scroll col" style={SCROLL_STYLE}>
        <MobDraftSeg value="preview" onChange={(next) => next === "draft" && onDraft()} />
        <div className="scroll-x" role="tablist" style={CHIPS_STYLE}>
          {orderedPlatforms(preferred).map((item) => (
            <Chip key={item} pressed={item === platform} onClick={() => setPlatform(item)}>
              {PLATFORM_NAME[item]}
            </Chip>
          ))}
        </div>
        {platform === "instagram" ? (
          <InstagramFrame ref={frameRef} view={view} headline={headline} dir={dir} />
        ) : (
          <PlatformFrame ref={frameRef} view={view} parts={parts} headline={headline} dir={dir} />
        )}
        {desk.reviseError && desk.failedInstruction && (
          <ReviseError error={desk.reviseError} instruction={desk.failedInstruction} onRetry={desk.retryRevision} conflict={desk.conflict} />
        )}
        {check.error ? (
          <ErrorSurface error={check.error} onRetry={check.retry} />
        ) : (
          issue && (
            <Notice
              variant="warn"
              style={NOTICE_STYLE}
              icon={<Icon name="warning" size="sm" style={{ color: "var(--warn)" }} />}
              textClassName="grow"
              aria-busy={check.busy}
              action={
                issue.fix && (
                  <Button variant="quiet" size="sm" disabled={!canFix} onClick={() => check.fix(issue)}>
                    {issue.fix.label}
                  </Button>
                )
              }
            >
              {`${issue.title}. ${issue.note}`}
            </Notice>
          )
        )}
        <div className="row" style={{ gap: "12px" }}>
          <Ring value={view.pct} color={view.ringColor}>
            {arabicCount(view.count)}
          </Ring>
          <span className="col grow">
            <b style={{ fontSize: "14px" }}>{view.limitTitle}</b>
            <span className="t-meta">{view.limitNote}</span>
          </span>
        </div>
      </main>

      <div className="m-cta" style={M_CTA_STYLE}>
        <Button variant="ink" block size="lg" onClick={copyForPlatform}>
          <Icon name="copy" size="sm" />
          {done === "publish" ? DRAFT_COPY.copied : PUBLISH_COPY.mobCopyFor(view.name)}
        </Button>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} aria-labelledby="pc-t" className="col" style={{ paddingBottom: "24px" }}>
        <div className="ai-strip" style={SHEET_STRIP_STYLE} />
        <header className="row" style={SHEET_HEAD_STYLE}>
          <h2 id="pc-t" className="t-title">
            {PUBLISH_COPY.checkTitle}
          </h2>
          {check.checks.length > 0 && <Badge variant={check.summary.variant}>{check.summary.text}</Badge>}
        </header>
        <p className="t-meta" style={{ padding: "0 20px" }}>
          {PUBLISH_COPY.checkLead}
        </p>
        <div className="col" style={{ padding: "4px 20px 12px" }} aria-busy={check.busy}>
          {check.loading ? <CheckRowsSkeleton /> : <CheckRows checks={check.checks} mobile canFix={canFix} onFix={check.fix} />}
        </div>
        <div className="col" style={{ padding: "0 20px", gap: "8px" }}>
          {check.hasFixes && (
            <Button variant="ai" block size="lg" disabled={!canFix} onClick={check.fixAll}>
              <Icon name="sparkle" size="sm" />
              {PUBLISH_COPY.fixAll}
            </Button>
          )}
          <Button
            variant="ghost"
            block
            onClick={() => {
              setSheetOpen(false);
              copyNow();
            }}
          >
            {PUBLISH_COPY.copyAnyway}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

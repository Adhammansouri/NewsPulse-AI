// NewPublish (S12 §2) — port of docs/redesign/design/reference/NewPublish.dc.html: the focus view of a social draft
// (rail + main, no headlines column). Top bar («المسودة», format, version), the platform `seg`, the neutral `pf`
// frame, the ring with the platform's limit copy and «نسخ لـ {platform}», and the «فحص قبل النشر» aside whose
// fixes go through the existing revise endpoint (a new version, then its own check). Inline styles are the
// board's own; the board's `main` is a div (the shell renders the content `<main>`).
import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { NewsSummarizeData } from "@newsplus/shared";
import { useAiCooldown } from "@/hooks/useAiCooldown";
import { useSession } from "@/hooks/useSession";
import { Badge } from "@/ui/Badge";
import { Button, buttonClassName } from "@/ui/Button";
import { ErrorSurface } from "@/ui/ErrorSurface";
import { Icon } from "@/ui/Icon";
import { Notice } from "@/ui/Notice";
import { Ring } from "@/ui/Ring";
import { VersionChip } from "@/ui/VersionChip";
import { DRAFT_COPY, formatNoun, versionLabel } from "../studio/draft/copy";
import { DraftCopyProvider, selectText, useDraftCopy } from "../studio/draft/DraftBlock";
import { draftDir } from "../studio/draft/draftModel";
import { ReviseError } from "../studio/draft/Editor";
import { formatCopy } from "../studio/formats";
import type { EditorialDesk } from "../studio/useEditorialDesk";
import { CheckRows, CheckRowsSkeleton } from "./CheckRows";
import { PlatformFrame } from "./PlatformFrame";
import { PUBLISH_COPY } from "./publishCopy";
import { withPublishParam } from "./publishLink";
import {
  arabicCount,
  currentVersionNumber,
  DEFAULT_PLATFORM,
  PLATFORMS,
  platformView,
  publishParts,
  storyHeadline,
  type Platform,
} from "./publishModel";
import { usePublishCheck } from "./usePublishCheck";

const BAR_STYLE = { padding: "12px 24px", background: "var(--surface)", borderBottom: "1px solid var(--line)" } as const;
const BODY_STYLE = { display: "flex", gap: "28px", padding: "26px 32px", overflow: "hidden" } as const;
const PREVIEW_STYLE = { gap: "16px", alignItems: "center" } as const;
const FRAME_WIDTH = "520px";
const RING_ROW_STYLE = { width: FRAME_WIDTH, gap: "12px" } as const;
const ASIDE_STYLE = { width: "390px", flex: "none", alignSelf: "flex-start", overflow: "hidden" } as const;
const ASIDE_HEAD_STYLE = { padding: "16px 18px 6px", gap: "4px" } as const;
const ICON_WRAP_STYLE = { width: "30px", height: "30px", borderRadius: "9px" } as const;
const ROWS_STYLE = { padding: "0 18px 8px" } as const;
const FIX_ALL_STYLE = { padding: "12px 18px 16px", borderTop: "1px solid var(--line)" } as const;
const OK_NOTICE_STYLE = { margin: "0 18px 16px" } as const;

export function DeskPublish({ desk, data }: { desk: EditorialDesk; data: NewsSummarizeData }) {
  return (
    <DraftCopyProvider>
      <PublishView desk={desk} data={data} />
    </DraftCopyProvider>
  );
}

function PublishView({ desk, data }: { desk: EditorialDesk; data: NewsSummarizeData }) {
  const location = useLocation();
  const session = useSession();
  const cooldown = useAiCooldown();
  const { done, copy } = useDraftCopy();
  const frameRef = useRef<HTMLElement>(null);
  const [platform, setPlatform] = useState<Platform>(DEFAULT_PLATFORM);
  const check = usePublishCheck(desk, platform);

  const name = formatCopy(data.format, 0).name;
  const parts = publishParts(data);
  const view = platformView(platform, parts);
  const version = currentVersionNumber(desk.detail, data);
  const canFix = check.canFix && !cooldown.active;

  function copyForPlatform() {
    copy("publish", view.copy, DRAFT_COPY.copiedAll(formatNoun(data.format)), () => selectText(frameRef.current));
  }

  return (
    <div className="grow col" style={{ background: "var(--bg)" }}>
      <div className="row" style={BAR_STYLE}>
        <Link className={buttonClassName({ variant: "ghost", size: "sm" })} to={`${location.pathname}${withPublishParam(location.search, null)}`} replace>
          <Icon name="arrow-back" size="sm" />
          {PUBLISH_COPY.back}
        </Link>
        <Badge variant="ai">{name}</Badge>
        {version !== null && <VersionChip current>{versionLabel(version)}</VersionChip>}
        <span className="grow" />
        <span className="t-meta">{PUBLISH_COPY.hint}</span>
      </div>
      <div className="grow" style={BODY_STYLE}>
        <section className="col grow" style={PREVIEW_STYLE} aria-label={PUBLISH_COPY.previewLabel}>
          <div className="seg" role="tablist" aria-label={PUBLISH_COPY.platformLabel}>
            {PLATFORMS.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-pressed={item === platform}
                aria-selected={item === platform}
                onClick={() => setPlatform(item)}
              >
                {platformView(item, parts).name}
              </button>
            ))}
          </div>
          <PlatformFrame
            ref={frameRef}
            view={view}
            parts={parts}
            headline={storyHeadline(desk.detail, data)}
            handle={session?.user.displayName ?? ""}
            dir={draftDir(data)}
            width={FRAME_WIDTH}
          />
          <div className="row" style={RING_ROW_STYLE}>
            <Ring value={view.pct} color={view.ringColor}>
              {arabicCount(view.count)}
            </Ring>
            <span className="col grow">
              <b style={{ fontWeight: 600, fontSize: "14px" }}>{view.limitTitle}</b>
              <span className="t-meta">{view.limitNote}</span>
            </span>
            <Button variant="ink" onClick={copyForPlatform}>
              <Icon name="copy" size="sm" />
              {done === "publish" ? DRAFT_COPY.copied : PUBLISH_COPY.copyFor(view.name)}
            </Button>
          </div>
        </section>
        <aside className="panel col" aria-label={PUBLISH_COPY.checkTitle} style={ASIDE_STYLE}>
          <div className="ai-strip" />
          <div className="col" style={ASIDE_HEAD_STYLE}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="row">
                <span className="ic-wrap ic-wrap--ai" style={ICON_WRAP_STYLE}>
                  <Icon name="check" size="sm" />
                </span>
                <b style={{ fontWeight: 600 }}>{PUBLISH_COPY.checkTitle}</b>
              </span>
              {check.checks.length > 0 && <Badge variant={check.summary.variant}>{check.summary.text}</Badge>}
            </div>
            <p className="t-meta">{PUBLISH_COPY.checkLead}</p>
          </div>
          {desk.reviseError && desk.failedInstruction && (
            <ReviseError error={desk.reviseError} instruction={desk.failedInstruction} onRetry={desk.retryRevision} conflict={desk.conflict} style={OK_NOTICE_STYLE} />
          )}
          <div className="col" style={ROWS_STYLE} aria-busy={check.busy}>
            {check.loading ? (
              <CheckRowsSkeleton />
            ) : check.error ? (
              <ErrorSurface error={check.error} onRetry={check.retry} />
            ) : (
              <CheckRows checks={check.checks} mobile={false} canFix={canFix} onFix={check.fix} />
            )}
          </div>
          {check.hasFixes && (
            <div style={FIX_ALL_STYLE}>
              <Button variant="ai" block disabled={!canFix} onClick={check.fixAll}>
                <Icon name="sparkle" size="sm" />
                {PUBLISH_COPY.fixAll}
              </Button>
            </div>
          )}
          {check.allOk && version !== null && (
            <Notice
              variant="ok"
              className="fade-in"
              style={OK_NOTICE_STYLE}
              icon={<Icon name="check" size="sm" style={{ color: "var(--ok)", marginTop: "3px" }} />}
            >
              {PUBLISH_COPY.allOk(version)}
            </Notice>
          )}
        </aside>
      </div>
    </div>
  );
}

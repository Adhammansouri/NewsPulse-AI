// MobNewDiff: «قارن النسخ» on mobile — the m-bar (back, title, format), the from / to `seg`s with the swap icon,
// «{n} حذف» / «{n} إضافة», the word diff per field, «التعديلات اللي اتطلبت» (the editor's requests), and «رجّع ن{a}» /
// «اعتمد ن{b}» in the `m-cta`. Inline styles are the board's own.
import type { CSSProperties } from "react";
import type { NewsSummarizeData } from "@newsplus/shared";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { Segmented } from "@/ui/Segmented";
import { MOB_FORMAT_NAME, versionLabel } from "../studio/draft/copy";
import { DraftError } from "../studio/draft/Editor";
import { draftDir } from "../studio/draft/draftModel";
import { formatCopy, STUDIO_COPY } from "../studio/formats";
import { M_CTA_STYLE } from "../studio/MobStory";
import type { EditorialDesk } from "../studio/useEditorialDesk";
import { DIFF_COPY } from "./copy";
import { DiffText } from "./DiffText";
import { useComparePair } from "./useComparePair";

const CENTER = { gap: "8px", justifyContent: "center" } as const;
const HEAD: CSSProperties = { fontSize: "16.5px", lineHeight: 1.9, fontWeight: 600 };
const BODY_TEXT: CSSProperties = { color: "var(--ink)", fontSize: "15px" };

export function MobDiff({ desk, data, onClose }: { desk: EditorialDesk; data: NewsSummarizeData; onClose: () => void }) {
  const pair = useComparePair(desk, onClose);
  const name = MOB_FORMAT_NAME[data.format] ?? formatCopy(data.format, data.carousel?.slides.length ?? 0).name;
  const requests = pair?.requests.filter((turn) => turn.kind === "me") ?? [];
  const dir = pair ? draftDir(pair.to.copy) : "rtl";
  return (
    <>
      <header className="m-bar">
        <IconButton label={STUDIO_COPY.back} icon="arrow-back" onClick={onClose} />
        <span className="m-bar__title">{DIFF_COPY.compareVersions}</span>
        <Badge variant="ai">{name}</Badge>
      </header>
      <main className="m-scroll col" style={{ padding: "14px 16px", gap: "14px" }}>
        <DraftError error={desk.draftError} />
        {pair && (
          <>
            <div className="row" style={CENTER}>
              <Segmented
                options={pair.fromOptions.map((version) => ({ value: version.id, label: versionLabel(version.number) }))}
                value={pair.from.id}
                onChange={(id) => {
                  const version = pair.fromOptions.find((option) => option.id === id);
                  if (version) pair.pickFrom(version);
                }}
              />
              <Icon name="swap" size="sm" style={{ color: "var(--ink-3)" }} />
              <Segmented
                options={pair.toOptions.map((version) => ({ value: version.id, label: versionLabel(version.number) }))}
                value={pair.to.id}
                onChange={(id) => {
                  const version = pair.toOptions.find((option) => option.id === id);
                  if (version) pair.pickTo(version);
                }}
              />
            </div>
            {(pair.totals.removed > 0 || pair.totals.added > 0) && (
              <div className="row" style={CENTER}>
                {pair.totals.removed > 0 && <Badge variant="breaking">{DIFF_COPY.removed(pair.totals.removed)}</Badge>}
                {pair.totals.added > 0 && <Badge variant="ok">{DIFF_COPY.added(pair.totals.added)}</Badge>}
              </div>
            )}
            <article className="doc col" style={{ padding: "18px", gap: "16px" }}>
              {pair.fields.map((field) => (
                <div key={field.key} className="col" style={{ gap: "4px" }}>
                  <span className="t-meta" style={{ fontWeight: 600 }}>
                    {field.label}
                  </span>
                  {!field.changed ? (
                    <p className="t-small">{DIFF_COPY.unchanged}</p>
                  ) : field.kind === "head" ? (
                    <p style={HEAD} dir={dir}>
                      <DiffText parts={field.parts} />
                    </p>
                  ) : (
                    <p className="t-body" style={BODY_TEXT} dir={dir}>
                      <DiffText parts={field.parts} />
                    </p>
                  )}
                </div>
              ))}
            </article>
            {requests.length > 0 && (
              <div className="panel col" style={{ padding: "14px", gap: "8px" }}>
                <b style={{ fontWeight: 600, fontSize: "14px" }}>{DIFF_COPY.requestedMob}</b>
                {requests.map((turn) => (
                  <p key={turn.key} className="msg msg--me" style={{ maxWidth: "100%" }}>
                    {turn.text}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      {pair && (
        <div className="m-cta" style={M_CTA_STYLE}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Button variant="quiet" disabled={pair.busy} onClick={pair.restore}>
              {DIFF_COPY.restore(pair.from.number)}
            </Button>
            <Button variant="ink" disabled={pair.busy} onClick={pair.keep}>
              {DIFF_COPY.keep(pair.to.number)}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

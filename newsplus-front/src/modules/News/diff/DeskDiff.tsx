// NewDiff: «قارن» on desktop — the bar («المسودة», the format, «قارن» with the from / to `seg`s and the swap icon,
// «في سطر واحد | جنب بعض»), the word diff per field with «{n} حذف» / «{n} إضافة» and «بين ن١ (…) و ن٣ (…)», and
// the aside «إيه اللي اتطلب» with «اعتمد ن{b}» / «رجّع ن{a}». «جنب بعض» is not drawn: two equal `doc` columns, the
// older version with its deletions on the left, the newer with its additions on the right (the sprint).
// A failed load or restore shows as DraftError (S10) above the actions. Inline styles are the board's own.
import { useState, type CSSProperties } from "react";
import type { NewsSummarizeData } from "@newsplus/shared";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Segmented } from "@/ui/Segmented";
import { versionLabel } from "../studio/draft/copy";
import { DraftError } from "../studio/draft/Editor";
import { draftDir } from "../studio/draft/draftModel";
import { formatCopy } from "../studio/formats";
import type { EditorialDesk } from "../studio/useEditorialDesk";
import { DIFF_COPY } from "./copy";
import { sideBySide, type DiffPart, type FieldDiff, type RequestTurn } from "./diffModel";
import { DiffText } from "./DiffText";
import { useComparePair, type ComparePairState } from "./useComparePair";

type Mode = "inline" | "side";

const BAR = { padding: "12px 24px", background: "var(--surface)", borderBottom: "1px solid var(--line)" } as const;
// The board's `overflow: hidden` clips a long draft; real drafts scroll instead.
const BODY = { display: "flex", gap: "24px", padding: "24px 30px", overflowY: "auto", minHeight: 0 } as const;
const DOC = { padding: "26px 30px", gap: "18px" } as const;
const HEAD: CSSProperties = { fontSize: "18px", lineHeight: 1.9, fontWeight: 600 };
const BODY_TEXT: CSSProperties = { color: "var(--ink)" };

export function DeskDiff({ desk, data, onClose }: { desk: EditorialDesk; data: NewsSummarizeData; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("inline");
  const pair = useComparePair(desk, onClose);
  const name = formatCopy(data.format, data.carousel?.slides.length ?? 0).name;
  return (
    <>
      <div className="row" style={BAR}>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <Icon name="arrow-back" size="sm" />
          {DIFF_COPY.backToDraft}
        </Button>
        <Badge variant="ai">{name}</Badge>
        <span className="grow" />
        {pair && (
          <>
            <span className="t-label">{DIFF_COPY.compare}</span>
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
            <Segmented
              style={{ marginInlineStart: "12px" }}
              options={[
                { value: "inline", label: DIFF_COPY.inline },
                { value: "side", label: DIFF_COPY.sideBySide },
              ]}
              value={mode}
              onChange={setMode}
            />
          </>
        )}
      </div>
      {pair && (
        <div className="grow" style={BODY}>
          {mode === "inline" ? (
            <article className="doc col grow" style={{ ...DOC, maxWidth: "760px" }}>
              <div className="row" style={{ gap: "10px" }}>
                <Totals pair={pair} />
                <span className="t-meta">
                  {DIFF_COPY.between(pair.from.number, pair.from.createdAt, pair.to.number, pair.to.createdAt)}
                </span>
              </div>
              {pair.fields.map((field) => (
                <Field key={field.key} field={field} parts={field.parts} dir={draftDir(pair.to.copy)} />
              ))}
            </article>
          ) : (
            <SideBySide pair={pair} />
          )}
          <Requested pair={pair} error={desk.draftError} />
        </div>
      )}
    </>
  );
}

function Totals({ pair }: { pair: ComparePairState }) {
  return (
    <>
      {pair.totals.removed > 0 && <Badge variant="breaking">{DIFF_COPY.removed(pair.totals.removed)}</Badge>}
      {pair.totals.added > 0 && <Badge variant="ok">{DIFF_COPY.added(pair.totals.added)}</Badge>}
    </>
  );
}

function Field({ field, parts, dir }: { field: FieldDiff; parts: readonly DiffPart[]; dir: "rtl" | "ltr" }) {
  return (
    <div className="col" style={{ gap: "4px" }}>
      <span className="t-meta" style={{ fontWeight: 600 }}>
        {field.label}
      </span>
      {field.changed ? (
        field.kind === "head" ? (
          <p style={HEAD} dir={dir}>
            <DiffText parts={parts} />
          </p>
        ) : (
          <p className="t-body" style={BODY_TEXT} dir={dir}>
            <DiffText parts={parts} />
          </p>
        )
      ) : (
        <p className="t-small">{DIFF_COPY.unchanged}</p>
      )}
    </div>
  );
}

/** «جنب بعض»: in RTL the first column sits on the right — the newer version; the older one is on the left. */
function SideBySide({ pair }: { pair: ComparePairState }) {
  const halves = pair.fields.map((field) => ({ field, ...sideBySide(field.parts) }));
  return (
    <>
      <article className="doc col grow" style={DOC}>
        <div className="row" style={{ gap: "10px" }}>
          {pair.totals.added > 0 && <Badge variant="ok">{DIFF_COPY.added(pair.totals.added)}</Badge>}
          <span className="t-meta">{DIFF_COPY.versionAt(pair.to.number, pair.to.createdAt)}</span>
        </div>
        {halves.map(({ field, after }) => (
          <Field key={field.key} field={field} parts={after} dir={draftDir(pair.to.copy)} />
        ))}
      </article>
      <article className="doc col grow" style={DOC}>
        <div className="row" style={{ gap: "10px" }}>
          {pair.totals.removed > 0 && <Badge variant="breaking">{DIFF_COPY.removed(pair.totals.removed)}</Badge>}
          <span className="t-meta">{DIFF_COPY.versionAt(pair.from.number, pair.from.createdAt)}</span>
        </div>
        {halves.map(({ field, before }) => (
          <Field key={field.key} field={field} parts={before} dir={draftDir(pair.from.copy)} />
        ))}
      </article>
    </>
  );
}

function Turn({ turn }: { turn: RequestTurn }) {
  return (
    <p className={`msg msg--${turn.kind}`}>
      {turn.text}
    </p>
  );
}

function Requested({ pair, error }: { pair: ComparePairState; error: unknown }) {
  return (
    <aside className="panel col" style={{ width: "330px", flex: "none", alignSelf: "flex-start", padding: "18px", gap: "12px" }}>
      <b style={{ fontWeight: 600 }}>{DIFF_COPY.requested}</b>
      {pair.requests.length > 0 && (
        <div className="col" style={{ gap: "8px" }}>
          {pair.requests.map((turn) => (
            <Turn key={turn.key} turn={turn} />
          ))}
        </div>
      )}
      <hr className="hr" />
      <DraftError error={error} />
      <Button variant="ink" block disabled={pair.busy} onClick={pair.keep}>
        <Icon name="check" size="sm" />
        {DIFF_COPY.keep(pair.to.number)}
      </Button>
      <Button variant="quiet" block disabled={pair.busy} onClick={pair.restore}>
        <Icon name="refresh" size="sm" />
        {DIFF_COPY.restore(pair.from.number)}
      </Button>
      <p className="t-meta" style={{ textAlign: "center" }}>
        {DIFF_COPY.restoreNote}
      </p>
    </aside>
  );
}


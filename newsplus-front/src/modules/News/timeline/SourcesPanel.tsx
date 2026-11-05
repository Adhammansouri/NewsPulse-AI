// «المصادر» tab: one link per source of the story — its mark, its link (name + external icon, the story panel's
// `chip chip--soft chip--sm`) and when it reported the story («٢:٥٢ م», the timeline's clock). No board draws this
// tab: it is composed from the timeline panel and the story panel's own markup, with no new copy.
import { SourceMark } from "@/ui/SourceMarks";
import { Icon } from "@/ui/Icon";
import type { SourceRow } from "./timelineModel";

export function SourcesPanel({ rows, mobile }: { rows: SourceRow[]; mobile: boolean }) {
  return (
    <section className="panel col" style={mobile ? { padding: "16px", gap: "12px" } : { padding: "22px 24px", gap: "14px" }}>
      {rows.map((row) => (
        <div key={row.key} className="row" style={{ gap: "8px" }}>
          <SourceMark ch={row.source.mark.ch} bg={row.source.mark.bg} />
          <a className="chip chip--soft chip--sm" href={row.url} target="_blank" rel="noopener">
            {row.source.name}
            <Icon name="external" size="sm" />
          </a>
          <span className="grow" />
          {row.time && <span className="t-meta num">{row.time}</span>}
        </div>
      ))}
    </section>
  );
}

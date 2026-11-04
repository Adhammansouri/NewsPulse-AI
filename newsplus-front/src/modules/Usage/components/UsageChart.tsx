// Daily bars of DeskUsage («التكلفة يوماً بيوم») and MobUsage («يوماً بيوم»). Inline styles are the boards' own;
// today's bar is the AI gradient. The bars are decorative: a visually hidden table carries the values.
import type { ChartBar } from "../usageView";

/** Board bar heights: `value / max × 170px` (desktop) and `× 100px` (mobile). */
const BAR_HEIGHT = { desk: 170, mob: 100 } as const;
/** No label under a bar: keep its line box so every bar starts on the same baseline. */
const NO_LABEL = " ";

function barBackground(bar: ChartBar) {
  return bar.isToday ? "var(--ai)" : "var(--line-strong)";
}

function ChartTable({ caption, bars }: { caption: string; bars: ChartBar[] }) {
  return (
    <table className="sr">
      <caption>{caption}</caption>
      <tbody>
        {bars.map((bar) => (
          <tr key={bar.date}>
            <th scope="row" dir="ltr">
              {bar.date}
            </th>
            <td dir="ltr">{bar.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DeskBars({ bars, dense, caption }: { bars: ChartBar[]; dense: boolean; caption: string }) {
  return (
    <>
      <div
        dir="ltr"
        aria-hidden="true"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))`,
          gap: dense ? "8px" : "18px",
          alignItems: "end",
          height: "220px",
        }}
      >
        {bars.map((bar) => (
          <div key={bar.date} className="col" style={{ alignItems: "center", gap: "8px", height: "100%", justifyContent: "flex-end" }}>
            {!dense && <span className="t-meta num">{bar.value}</span>}
            <div
              style={{
                width: "100%",
                maxWidth: "64px",
                borderRadius: "10px 10px 4px 4px",
                background: barBackground(bar),
                height: `${Math.round(bar.ratio * BAR_HEIGHT.desk)}px`,
              }}
            />
            <span className="t-meta">{bar.day || NO_LABEL}</span>
          </div>
        ))}
      </div>
      <ChartTable caption={caption} bars={bars} />
    </>
  );
}

export function MobBars({ bars, dense, caption }: { bars: ChartBar[]; dense: boolean; caption: string }) {
  return (
    <>
      <div
        dir="ltr"
        aria-hidden="true"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))`,
          gap: dense ? "2px" : "8px",
          alignItems: "end",
          height: "130px",
        }}
      >
        {bars.map((bar) => (
          <div key={bar.date} className="col" style={{ alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end" }}>
            <div
              style={{
                width: "100%",
                borderRadius: "8px 8px 3px 3px",
                background: barBackground(bar),
                height: `${Math.round(bar.ratio * BAR_HEIGHT.mob)}px`,
              }}
            />
            <span className="t-meta" style={{ fontSize: "10.5px" }}>
              {bar.day || NO_LABEL}
            </span>
          </div>
        ))}
      </div>
      <ChartTable caption={caption} bars={bars} />
    </>
  );
}

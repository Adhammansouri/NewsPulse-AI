// DeskUsage / MobUsage ready content (`isReady` branches). Inline styles are the boards' own.
import { AiPanel } from "@/ui/AiPanel";
import { Icon } from "@/ui/Icon";
import { Meter } from "@/ui/Meter";
import { Panel } from "@/ui/Panel";
import { Segmented, type SegmentedOption } from "@/ui/Segmented";
import type { ChartMetric, CostKpi, ModelRow, SpendRow, UsageChart, UsageKpis } from "../usageView";
import { DeskBars, MobBars } from "./UsageChart";

const SPEND_NOTE = "الأرقام من حساب OpenAI وقد تشمل استخداماً خارج Newsplus";

/** Spend bar colours (DeskUsage): text navy, slides the AI gradient (meter default), web search ink-3. */
const SPEND_BAR: Record<SpendRow["key"], { background: string } | undefined> = {
  text: { background: "var(--navy)" },
  images: undefined,
  webSearch: { background: "var(--ink-3)" },
};

const METRIC_OPTIONS: ReadonlyArray<SegmentedOption<ChartMetric>> = [
  { value: "cost", label: "التكلفة" },
  { value: "tokens", label: "التوكنز" },
];

/** The cost hero (`ai-panel`): period cost, then this month against the monthly limit. */
function CostHero({ cost, padding }: { cost: CostKpi; padding: string }) {
  return (
    <AiPanel as="section" className="col" style={{ padding, gap: "10px", boxShadow: "none" }}>
      <span className="t-meta">{cost.label}</span>
      <strong className="t-num" dir="ltr" style={{ fontSize: "38px", lineHeight: 1.1, textAlign: "right" }}>
        {cost.amount}
      </strong>
      {cost.limit && (
        <>
          <Meter value={cost.limit.percent} />
          <span className="t-meta num">
            {cost.limit.percentLabel} من حد الشهر (<span dir="ltr">{cost.limit.limit}</span>) · متاح{" "}
            <span dir="ltr">{cost.limit.available}</span>
          </span>
        </>
      )}
    </AiPanel>
  );
}

const DESK_TILE_STYLE = { padding: "20px", gap: "6px" } as const;

export function DeskReady({
  kpis,
  chart,
  metric,
  showMetricToggle,
  onMetric,
  models,
  spend,
}: {
  kpis: UsageKpis;
  chart: UsageChart | null;
  metric: ChartMetric;
  showMetricToggle: boolean;
  onMetric: (metric: ChartMetric) => void;
  models: ModelRow[] | null;
  spend: SpendRow[] | null;
}) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr 1fr 1fr", gap: "14px" }}>
        {kpis.cost && <CostHero cost={kpis.cost} padding="20px" />}
        {kpis.requests && (
          <Panel as="section" className="col" style={DESK_TILE_STYLE}>
            <span className="ic-wrap" style={{ marginBottom: "6px" }}>
              <Icon name="sparkle" />
            </span>
            <span className="t-meta">طلبات المحرّر</span>
            <strong className="t-num" style={{ fontSize: "26px" }}>
              {kpis.requests.total}
            </strong>
            <span className="t-meta">متوسط {kpis.requests.average} يومياً</span>
          </Panel>
        )}
        {kpis.tokens && (
          <Panel as="section" className="col" style={DESK_TILE_STYLE}>
            <span className="ic-wrap" style={{ marginBottom: "6px" }}>
              <Icon name="doc-lines" />
            </span>
            <span className="t-meta">التوكنز</span>
            <strong className="t-num" style={{ fontSize: "26px" }} dir="ltr">
              {kpis.tokens.total}
            </strong>
            {kpis.tokens.cachedShare && <span className="t-meta">{kpis.tokens.cachedShare} منها من الذاكرة المؤقتة</span>}
          </Panel>
        )}
        {kpis.slides && (
          <Panel as="section" className="col" style={DESK_TILE_STYLE}>
            <span className="ic-wrap" style={{ marginBottom: "6px" }}>
              <Icon name="image" />
            </span>
            <span className="t-meta">شرائح مرسومة</span>
            <strong className="t-num" style={{ fontSize: "26px" }}>
              {kpis.slides}
            </strong>
            <span className="t-meta">صور كاروسيل</span>
          </Panel>
        )}
      </div>

      {chart && (
        <Panel as="section" className="col" style={{ padding: "20px 22px", gap: "16px" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 className="t-head">التكلفة يوماً بيوم</h2>
            {showMetricToggle && <Segmented options={METRIC_OPTIONS} value={metric} onChange={onMetric} />}
          </div>
          <DeskBars bars={chart.bars} dense={chart.dense} caption={metric === "cost" ? "التكلفة يوماً بيوم" : "التوكنز يوماً بيوم"} />
        </Panel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" }}>
        {models && (
          <Panel as="section" style={{ padding: "18px 22px" }}>
            <h2 id="u-models" className="t-head" style={{ marginBottom: "8px" }}>
              النماذج
            </h2>
            <table aria-labelledby="u-models" style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr className="t-meta">
                  <th scope="col" style={{ textAlign: "start", padding: "8px 0", fontWeight: 600 }}>
                    النموذج
                  </th>
                  <th scope="col" style={{ textAlign: "start", fontWeight: 600 }}>
                    طلبات
                  </th>
                  <th scope="col" style={{ textAlign: "start", fontWeight: 600 }}>
                    إدخال
                  </th>
                  <th scope="col" style={{ textAlign: "start", fontWeight: 600 }}>
                    إخراج
                  </th>
                </tr>
              </thead>
              <tbody className="num">
                {models.map((row) => (
                  <tr key={row.model} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "11px 0" }} dir="ltr">
                      {row.model}
                    </td>
                    <td>{row.requests}</td>
                    {row.input === null ? <td>—</td> : <td dir="ltr">{row.input}</td>}
                    {row.output === null ? <td>—</td> : <td dir="ltr">{row.output}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
        {spend && (
          <Panel as="section" className="col" style={{ padding: "18px 22px", gap: "12px" }}>
            <h2 className="t-head">أين يذهب الإنفاق؟</h2>
            <div className="col" style={{ gap: "12px" }}>
              {spend.map((row) => (
                <div key={row.key}>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: "14px" }}>
                    <span>{row.label}</span>
                    <span className="num" dir="ltr">
                      {row.amount}
                    </span>
                  </div>
                  <Meter value={row.share} style={{ height: "6px", marginTop: "6px" }} barStyle={SPEND_BAR[row.key]} />
                </div>
              ))}
            </div>
            <p className="t-meta">{SPEND_NOTE}.</p>
          </Panel>
        )}
      </div>
    </>
  );
}

const MOB_TILE_STYLE = { padding: "14px", gap: "2px" } as const;

function MobTile({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <Panel className="col" style={MOB_TILE_STYLE}>
      <span className="t-meta">{label}</span>
      <b className="t-num" style={{ fontSize: "22px" }} dir={ltr ? "ltr" : undefined}>
        {value}
      </b>
    </Panel>
  );
}

export function MobReady({ kpis, chart, spend }: { kpis: UsageKpis; chart: UsageChart | null; spend: SpendRow[] | null }) {
  return (
    <>
      {kpis.cost && <CostHero cost={kpis.cost} padding="18px" />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {kpis.requests && <MobTile label="طلبات المحرّر" value={kpis.requests.total} />}
        {kpis.tokens && <MobTile label="التوكنز" value={kpis.tokens.total} ltr />}
        {kpis.slides && <MobTile label="شرائح مرسومة" value={kpis.slides} />}
        {kpis.tokens?.cachedShare && <MobTile label="من الذاكرة المؤقتة" value={kpis.tokens.cachedShare} />}
      </div>
      {chart && (
        <Panel as="section" className="col" style={{ padding: "16px", gap: "12px" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 className="t-head">يوماً بيوم</h2>
            <span className="t-meta num" dir="ltr">
              max {chart.max}
            </span>
          </div>
          <MobBars bars={chart.bars} dense={chart.dense} caption="التكلفة يوماً بيوم" />
        </Panel>
      )}
      {spend && (
        <section className="m-list">
          {spend.map((row) => (
            <div key={row.key} className="m-item">
              <span className="m-item__label">{row.label}</span>
              <span className="t-num" dir="ltr">
                {row.amount}
              </span>
            </div>
          ))}
        </section>
      )}
      <p className="t-meta" style={{ textAlign: "center" }}>
        {SPEND_NOTE}
      </p>
    </>
  );
}

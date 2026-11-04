// DeskUsage (+ -loading / -error / -custom / -setup / -forbidden) and MobUsage (+ -loading) — ports of
// docs/redesign/design/reference/DeskUsage.dc.html and MobUsage.dc.html. The desktop board's `main` is a div here:
// the shell already renders the content `<main>`.
import type { ReactNode } from "react";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { Segmented, type SegmentedOption } from "@/ui/Segmented";
import { MobBackLink } from "@/components/shell/MobBackLink";
import type { ChartMetric, ModelRow, SpendRow, UsageChart, UsageKpis, UsagePreset, UsageScreenState } from "../usageView";
import { CustomPeriod, type CustomDraft } from "./CustomPeriod";
import { DeskReady, MobReady } from "./UsageReady";
import { DeskUsageLoading, MobUsageLoading, UsageError, UsageForbidden, UsageSetup } from "./UsageStates";

const DESK_PRESETS: ReadonlyArray<SegmentedOption<UsagePreset>> = [
  { value: "today", label: "اليوم" },
  { value: "7d", label: "٧ أيام" },
  { value: "30d", label: "٣٠ يوماً" },
  { value: "month", label: "هذا الشهر" },
  { value: "custom", label: "مخصّص" },
];

const MOB_PRESETS: ReadonlyArray<SegmentedOption<UsagePreset>> = [
  { value: "today", label: "اليوم" },
  { value: "7d", label: "٧ أيام" },
  { value: "30d", label: "٣٠ يوم" },
  { value: "month", label: "الشهر" },
];

export type UsageScreenProps = {
  state: UsageScreenState;
  syncLine: string;
  preset: UsagePreset;
  onPreset: (preset: UsagePreset) => void;
  fetching: boolean;
  onRefresh: () => void;
  canExport: boolean;
  onExport: () => void;
  /** Ready content (null outside `ready`). */
  ready: {
    kpis: UsageKpis;
    deskChart: UsageChart | null;
    mobChart: UsageChart | null;
    models: ModelRow[] | null;
    spend: SpendRow[] | null;
  } | null;
  metric: ChartMetric;
  showMetricToggle: boolean;
  onMetric: (metric: ChartMetric) => void;
  custom: {
    open: boolean;
    draft: CustomDraft;
    scopes: Array<{ value: string; label: string }>;
    scopeDisabled: boolean;
    onChange: (draft: CustomDraft) => void;
    onApply: () => void;
  };
};

function StateContent({ props, loading, mobile }: { props: UsageScreenProps; loading: ReactNode; mobile: boolean }) {
  const { state } = props;
  if (state.kind === "loading") return <>{loading}</>;
  if (state.kind === "forbidden") return <UsageForbidden />;
  if (state.kind === "setup") return <UsageSetup stacked={mobile} />;
  if (state.kind === "error") return <UsageError message={state.message} retrying={props.fetching} onRetry={props.onRefresh} />;
  return null;
}

export function DeskUsage(props: UsageScreenProps) {
  const { syncLine, preset, onPreset, onRefresh, canExport, fetching, onExport, ready, custom } = props;
  return (
    <div className="grow" style={{ padding: "30px 40px 40px", overflowY: "auto" }}>
      <div className="col" style={{ maxWidth: "1220px", margin: "0 auto", gap: "20px" }}>
        <header className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div className="col">
            <h1 className="t-hero" style={{ fontSize: "30px" }}>
              استهلاك الذكاء الاصطناعي
            </h1>
            <p className="live">
              {syncLine}
            </p>
          </div>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <Segmented role="group" aria-label="الفترة" options={DESK_PRESETS} value={preset} onChange={onPreset} />
            <IconButton line label="تحديث" icon="refresh" aria-busy={fetching || undefined} onClick={onRefresh} />
            {/* Nothing to export (no data yet, or a refresh in flight): inert, but drawn as on every DeskUsage board. */}
            <Button
              variant="quiet"
              size="sm"
              aria-disabled={!canExport || fetching || undefined}
              onClick={() => {
                if (canExport && !fetching) onExport();
              }}
            >
              <Icon name="download" size="sm" />
              تصدير CSV
            </Button>
          </div>
        </header>

        {custom.open && (
          <CustomPeriod
            draft={custom.draft}
            scopes={custom.scopes}
            scopeDisabled={custom.scopeDisabled}
            onChange={custom.onChange}
            onApply={custom.onApply}
          />
        )}

        {ready ? (
          <DeskReady
            kpis={ready.kpis}
            chart={ready.deskChart}
            metric={props.metric}
            showMetricToggle={props.showMetricToggle}
            onMetric={props.onMetric}
            models={ready.models}
            spend={ready.spend}
          />
        ) : (
          <StateContent props={props} loading={<DeskUsageLoading />} mobile={false} />
        )}
      </div>
    </div>
  );
}

export function MobUsage(props: UsageScreenProps) {
  const { preset, onPreset, onRefresh, fetching, ready } = props;
  return (
    <>
      <header className="m-head" style={{ gap: "12px" }}>
        <div className="m-head__row">
          <MobBackLink />
          <span className="m-title" style={{ fontSize: "24px" }}>
            استهلاك AI
          </span>
          <IconButton label="تحديث" icon="refresh" aria-busy={fetching || undefined} onClick={onRefresh} />
        </div>
        <Segmented block options={MOB_PRESETS} value={preset} onChange={onPreset} />
      </header>
      <main className="m-scroll col" style={{ padding: "8px 16px 24px", gap: "14px" }}>
        {ready ? (
          <MobReady kpis={ready.kpis} chart={ready.mobChart} spend={ready.spend} />
        ) : (
          <StateContent props={props} loading={<MobUsageLoading />} mobile />
        )}
      </main>
    </>
  );
}

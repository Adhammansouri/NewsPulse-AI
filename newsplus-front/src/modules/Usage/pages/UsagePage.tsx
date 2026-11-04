// AI usage (S09 §B, admin): `GET /openai/usage` + query state mapped to the DeskUsage / MobUsage boards.
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNow } from "@/hooks/useNow";
import { useSession } from "@/hooks/useSession";
import { getOpenAIUsage } from "@/services/openaiUsageService";
import { DeskUsage, MobUsage, type UsageScreenProps } from "../components/UsageScreens";
import type { CustomDraft } from "../components/CustomPeriod";
import { exportCSV, hasExportData } from "../exportCsv";
import { presetRange } from "../usageFormat";
import {
  modelRows,
  scopeOptions,
  screenState,
  spendRows,
  syncLine,
  usageChart,
  usageKpis,
  type ChartMetric,
  type UsagePreset,
} from "../usageView";

export default function UsagePage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "استهلاك OpenAI — Newsplus";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const session = useSession();
  const isMobile = useIsMobile();
  const now = useNow();
  const [preset, setPreset] = useState<UsagePreset>("7d");
  const [range, setRange] = useState(() => presetRange("7d"));
  const [project, setProject] = useState<string>();
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState<CustomDraft | null>(null);
  const [metric, setMetric] = useState<ChartMetric>("cost");

  // Same key and options as before S09 (MorePage reads the default period's entry from the same cache).
  const query = useQuery({
    queryKey: ["openai-usage", session?.user.id, range.start, range.end, project],
    queryFn: ({ signal }) => getOpenAIUsage({ ...range, project }, signal),
    enabled: Boolean(session),
    retry: false,
    staleTime: 60_000,
    gcTime: 0,
    refetchInterval: 300_000,
  });

  const data = query.data;
  const state = screenState(query);
  const ready = state.kind === "ready" ? state.data : null;
  const textReady = Boolean(ready?.usage?.completions?.data);
  const chartMetric: ChartMetric = textReady ? metric : "cost";
  const currentScope = project ?? data?.scope?.projectId ?? "organization";

  function choosePreset(next: UsagePreset) {
    if (next === "custom") {
      setDraft({ ...range, project: currentScope });
      setCustomOpen((open) => !open);
      return;
    }
    setRange(presetRange(next));
    setPreset(next);
    setCustomOpen(false);
  }

  function applyCustom() {
    if (!draft) return;
    setRange({ start: draft.start, end: draft.end });
    setProject(draft.project);
    setPreset("custom");
  }

  const props: UsageScreenProps = {
    state,
    syncLine: syncLine(state, now),
    preset,
    onPreset: choosePreset,
    fetching: query.isFetching,
    onRefresh: () => void query.refetch(),
    canExport: hasExportData(data),
    onExport: () => {
      if (data) exportCSV(data.usage, data.costs.data, range.start, range.end);
    },
    ready: ready
      ? {
          kpis: usageKpis(ready, preset),
          deskChart: usageChart(ready, chartMetric, false),
          mobChart: usageChart(ready, "cost", true),
          models: modelRows(ready),
          spend: spendRows(ready),
        }
      : null,
    metric: chartMetric,
    showMetricToggle: textReady,
    onMetric: setMetric,
    custom: {
      open: (customOpen || preset === "custom") && draft !== null,
      draft: draft ?? { ...range, project: currentScope },
      scopes: scopeOptions(data),
      scopeDisabled: query.isFetching || !data?.configured,
      onChange: setDraft,
      onApply: applyCustom,
    },
  };

  return isMobile ? <MobUsage {...props} /> : <DeskUsage {...props} />;
}

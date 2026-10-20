import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowClockwise, ArrowSquareOut, DownloadSimple, PlugsConnected, WarningCircle } from "@phosphor-icons/react";
import type { OpenAICostRow, OpenAIDataStatus, OpenAISection, OpenAISpendLimit, OpenAIUsageRow } from "@newsplus/shared";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { useSession } from "@/hooks/useSession";
import { ApiError } from "@/services/apiError";
import { getOpenAIUsage } from "@/services/openaiUsageService";
import { formatDateTime } from "@/utils/format";
import { dailySeries, integer, metricLabels, modelTotals, money, presetRange, quantity, sumMetric, usdTotal } from "../usageFormat";
import "../usage.css";

const statusLabels: Record<OpenAIDataStatus, string> = {
  ready: "متصل",
  "not-configured": "بانتظار ربط حساب OpenAI",
  unauthorized: "المفتاح لا يملك صلاحية قراءة هذه البيانات",
  unavailable: "تعذّر جلب البيانات. حاول التحديث لاحقاً",
  "not-found": "غير متاح لهذا الحساب أو لم يُعدّ له حد",
  "project-required": "اختر مشروعاً لعرض هذه البيانات",
};
const categories: Record<string, string> = {
  completions: "النصوص والتوكنز",
  images: "الصور",
  embeddings: "التضمينات",
  moderations: "مراجعة المحتوى",
  audioSpeeches: "تحويل النص إلى صوت",
  audioTranscriptions: "تفريغ الصوت",
  vectorStores: "تخزين المتجهات",
  codeInterpreterSessions: "جلسات تنفيذ الكود",
  fileSearchCalls: "البحث في الملفات",
  webSearchCalls: "البحث على الويب",
};
const PRESETS = [
  { id: "today", label: "اليوم" },
  { id: "7d", label: "7 أيام" },
  { id: "30d", label: "30 يوماً" },
  { id: "month", label: "هذا الشهر" },
];
const today = () => new Date().toISOString().slice(0, 10);

function State({ status }: { status: OpenAIDataStatus }) {
  const bad = status === "unauthorized" || status === "unavailable";
  return <p className={`usage-state ${bad ? "is-error" : ""}`}>{statusLabels[status]}</p>;
}

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="usage-external">
      {children}
      <ArrowSquareOut size={16} aria-hidden="true" />
    </a>
  );
}

const numberOrDash = (rows: OpenAISection<OpenAIUsageRow[]> | undefined, key: string) => (rows?.data ? integer(sumMetric(rows.data, key)) : "—");
const costOrDash = (section: OpenAISection<OpenAICostRow[]> | undefined) => {
  const value = section?.data ? usdTotal(section.data) : null;
  return value === null ? "—" : money(value);
};

function SpendMeter({ title, limit, costs }: { title: string; limit: OpenAISection<OpenAISpendLimit>; costs: OpenAISection<OpenAICostRow[]> }) {
  const total = costs.data ? usdTotal(costs.data) : null;
  const amount = limit.data?.amount;
  const comparable = limit.data?.currency === "USD" && total !== null && amount !== undefined && amount > 0;
  const ratio = comparable ? total / amount : null;
  const enforcement = limit.data?.enforcement;

  return (
    <div className="meter">
      <div className="meter-head">
        <h3>{title}</h3>
        <span className="hint">الشهر الحالي · UTC</span>
      </div>
      {limit.data ? (
        <>
          <p className="meter-limit"><strong dir="ltr">{money(limit.data.amount, limit.data.currency)}</strong><span>حد الإنفاق الشهري</span></p>
          <div
            className={`segments ${ratio !== null && ratio >= 0.8 ? "is-warn" : ""}`}
            role="img"
            aria-label={ratio === null ? "نسبة الاستهلاك غير متاحة" : `تم استهلاك ${(ratio * 100).toFixed(1)} بالمئة من حد الإنفاق`}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} className={ratio !== null && i < Math.ceil(Math.min(1, ratio) * 24) ? "is-used" : ""} style={{ ["--i" as string]: i }} />
            ))}
          </div>
          <p className="meter-row">
            <span>المستهلك <b dir="ltr">{costOrDash(costs)}</b></span>
            <span>المتاح <b dir="ltr">{comparable ? money(Math.max(0, amount - total)) : "—"}</b></span>
          </p>
          <p className="hint">
            {ratio !== null ? `${(ratio * 100).toFixed(1)}% من الحد · ` : ""}
            {enforcement === "enforcing" ? "الحد يوقف الطلبات عند بلوغه" : enforcement === "inactive" ? "الحد غير نشط حالياً" : `حالة الحد: ${enforcement}`}
          </p>
          {!costs.data ? <State status={costs.status} /> : null}
        </>
      ) : (
        <State status={limit.status} />
      )}
    </div>
  );
}

function exportCSV(usage: Record<string, OpenAISection<OpenAIUsageRow[]>>, costs: OpenAICostRow[] | null, start: string, end: string) {
  const rows: Array<Array<string | number>> = [["date_utc", "category", "model_or_line_item", "metric", "value", "currency", "dimensions"]];
  for (const [category, section] of Object.entries(usage))
    for (const row of section.data ?? [])
      for (const [metric, value] of Object.entries(row.metrics)) rows.push([row.date, category, row.model ?? "", metric, value, "", JSON.stringify(row.dimensions)]);
  for (const row of costs ?? []) rows.push([row.date, "costs", row.lineItem, "amount", row.amount, row.currency, row.projectId ?? ""]);
  // Guard against spreadsheet formula injection.
  const escape = (value: string | number) => `"${String(typeof value === "string" && /^[=+\-@]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
  const url = URL.createObjectURL(new Blob(["﻿" + rows.map((row) => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `openai-usage-${start}-${end}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function UsagePage() {
  useEffect(() => {
    const previous = document.title;
    document.title = "استهلاك OpenAI — Newsplus";
    return () => {
      document.title = previous;
    };
  }, []);

  const session = useSession();
  const [range, setRange] = useState(() => presetRange("7d"));
  const [draft, setDraft] = useState(range);
  const [preset, setPreset] = useState("7d");
  const [project, setProject] = useState<string>();
  const [chartMetric, setChartMetric] = useState<"cost" | "tokens">("cost");
  const [day, setDay] = useState<string>();
  const [dateError, setDateError] = useState("");

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
  const text = data?.usage.completions;
  const images = data?.usage.images;
  const series = dailySeries(range.start, range.end, text?.data ?? [], data?.costs.data ?? []);
  const chartReady = chartMetric === "cost" ? Boolean(data?.costs.data) && usdTotal(data?.costs.data ?? []) !== null : Boolean(text?.data);
  const maximum = Math.max(...series.map((point) => point[chartMetric] ?? 0), 0);
  const selectedDay = series.find((point) => point.date === day) ?? series[series.length - 1];
  const models = modelTotals(text?.data ?? []);
  const input = text?.data ? sumMetric(text.data, "input_tokens") : null;
  const cached = text?.data ? sumMetric(text.data, "input_cached_tokens") : null;

  const costGroups = new Map<string, { name: string; currency: string; amount: number }>();
  for (const row of data?.costs.data ?? []) {
    const key = `${row.lineItem}:${row.currency}`;
    const group = costGroups.get(key) ?? { name: row.lineItem, currency: row.currency, amount: 0 };
    group.amount += row.amount;
    costGroups.set(key, group);
  }
  const groups = [...costGroups.values()].sort((a, b) => b.amount - a.amount);
  const hasExport = Boolean(data && (Object.values(data.usage).some((section) => section.data?.length) || data.costs.data?.length));

  function setPeriod(id: string) {
    const next = presetRange(id);
    setRange(next);
    setDraft(next);
    setPreset(id);
    setDay(undefined);
    setDateError("");
  }

  function applyDates(event: React.FormEvent) {
    event.preventDefault();
    const days = (Date.parse(draft.end) - Date.parse(draft.start)) / 86_400_000;
    if (!Number.isFinite(days) || days < 0 || days >= 90 || draft.end > today()) {
      setDateError("اختر فترة صحيحة لا تزيد عن 90 يوماً وتنتهي اليوم أو قبله.");
      return;
    }
    setRange(draft);
    setPreset("custom");
    setDay(undefined);
    setDateError("");
  }

  const forbidden = query.error instanceof ApiError && query.error.status === 403;
  const presetOptions = preset === "custom" ? [...PRESETS, { id: "custom", label: "مخصصة" }] : PRESETS;

  return (
    <div className="page usage page-enter">
      <header className="page-head usage-head">
        <div>
          <h1 className="page-title">استهلاك OpenAI</h1>
          <p className="page-lede">أين يذهب استهلاكك، وكم تنفق، وما المتاح حتى حدود حسابك.</p>
        </div>
        <div className="usage-actions">
          <button className="btn btn-quiet btn-sm" type="button" disabled={query.isFetching} onClick={() => void query.refetch()}>
            {query.isFetching ? <span className="spinner" aria-hidden="true" /> : <ArrowClockwise size={18} aria-hidden="true" />}
            تحديث
          </button>
          <button className="btn btn-quiet btn-sm" type="button" disabled={!hasExport || query.isFetching} onClick={() => data && exportCSV(data.usage, data.costs.data, range.start, range.end)}>
            <DownloadSimple size={18} aria-hidden="true" />
            تصدير CSV
          </button>
        </div>
      </header>

      <div className="usage-controls">
        <Segmented value={preset} onChange={(id) => setPeriod(id)} options={presetOptions} ariaLabel="فترة الاستهلاك" />
        <div className="field usage-scope">
          <label className="sr-only" htmlFor="usage-scope">النطاق</label>
          <select id="usage-scope" className="select" value={project ?? data?.scope.projectId ?? "organization"} onChange={(event) => { setProject(event.target.value); setDay(undefined); }} disabled={query.isFetching || !data?.configured}>
            <option value="organization">المؤسسة بالكامل</option>
            {data?.scope.projectId && !data.projects.data?.some((item) => item.id === data.scope.projectId) ? <option value={data.scope.projectId}>{data.scope.projectId}</option> : null}
            {data?.projects.data?.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
        </div>
        <details className="usage-custom">
          <summary className="btn btn-ghost btn-sm">فترة مخصصة</summary>
          <form className="usage-date-form" onSubmit={applyDates}>
            <label className="field"><span className="field-label">من</span><input className="input" type="date" value={draft.start} max={draft.end} required onChange={(event) => setDraft({ ...draft, start: event.target.value })} /></label>
            <label className="field"><span className="field-label">إلى</span><input className="input" type="date" value={draft.end} min={draft.start} max={today()} required onChange={(event) => setDraft({ ...draft, end: event.target.value })} /></label>
            <button type="submit" className="btn btn-primary btn-sm">طبّق</button>
          </form>
          <p className="hint">كل الأيام بتوقيت UTC والتكلفة بالدولار.</p>
        </details>
      </div>
      {dateError ? <Notice tone="error">{dateError}</Notice> : null}

      <p className="usage-sync" role="status">
        <span className={`dot ${data?.configured ? "is-ok" : ""}`} aria-hidden="true" />
        {query.isPending ? "جارٍ قراءة بيانات الحساب…" : data ? <>{data.configured ? "بيانات OpenAI الرسمية" : "الحساب غير مربوط"} · آخر جلب <bdi>{formatDateTime(data.fetchedAt)}</bdi></> : "البيانات غير متاحة"}
      </p>

      {query.error ? (
        <Notice tone="error" title={forbidden ? "المتابعة متاحة لصاحب الحساب فقط" : "تعذّر تحميل الاستهلاك"}>
          {forbidden ? "سجّل الدخول بحساب مالك مساحة العمل أو مسؤول النظام." : "تحقق من الاتصال ثم اضغط تحديث."}
        </Notice>
      ) : null}

      {data && !data.configured ? (
        <section className="panel usage-connect">
          <span className="empty-icon" aria-hidden="true"><PlugsConnected size={26} /></span>
          <div>
            <h2>اربط حساب OpenAI لعرض الأرقام</h2>
            <p>أضف مفتاح إدارة OpenAI على السيرفر لتظهر هنا بيانات الاستهلاك والتكلفة والحدود. مفتاح تشغيل أدوات الذكاء الاصطناعي وحده لا يكفي.</p>
            <details>
              <summary>خطوات الربط الآمن</summary>
              <p>أنشئ Admin API Key من إعدادات المؤسسة وضعه في <code>OPENAI_ADMIN_KEY</code> على السيرفر ثم أعد تشغيل الـ API. يمكنك تحديد <code>OPENAI_PROJECT_ID</code> لفتح مشروعك تلقائياً. احتفظ بالمفتاح على السيرفر فقط.</p>
            </details>
            <External href="https://platform.openai.com/settings/organization/admin-keys">إعداد مفتاح الإدارة</External>
          </div>
        </section>
      ) : null}

      <section className="usage-overview" aria-label="ملخص الفترة" aria-busy={query.isFetching}>
        <div className="panel usage-hero">
          <p className="usage-label">تكلفة الفترة</p>
          <strong className="usage-big" dir="ltr">{query.isPending ? <span className="skel" style={{ width: "9rem", height: "2.6rem" }} /> : costOrDash(data?.costs)}</strong>
          <p className="hint">من <bdi>{range.start}</bdi> إلى <bdi>{range.end}</bdi> · {data?.scope.projectId ? "المشروع المحدد" : "المؤسسة بالكامل"}</p>
          {data && !data.costs.data ? <State status={data.costs.status} /> : null}
        </div>
        <dl className="usage-kpis">
          <div className="panel kpi"><dt>طلبات النماذج النصية</dt><dd dir="ltr">{numberOrDash(text, "num_model_requests")}</dd></div>
          <div className="panel kpi"><dt>توكنز النصوص</dt><dd dir="ltr">{text?.data ? integer(sumMetric(text.data, "input_tokens") + sumMetric(text.data, "output_tokens")) : "—"}</dd></div>
          <div className="panel kpi"><dt>الصور</dt><dd dir="ltr">{numberOrDash(images, "images")}</dd></div>
          <div className="panel kpi"><dt>تكلفة الشهر الحالي</dt><dd dir="ltr">{costOrDash(data?.monthCosts)}</dd></div>
        </dl>
      </section>

      <section className="panel usage-chart-card">
        <div className="panel-head">
          <h2 className="panel-title">الاستهلاك يوماً بيوم</h2>
          <Segmented size="sm" value={chartMetric} onChange={setChartMetric} ariaLabel="مقياس الرسم" options={[{ id: "cost", label: "التكلفة" }, { id: "tokens", label: "التوكنز" }]} />
        </div>
        <div className="usage-chart-body">
          {chartReady ? (
            <>
              <p className="usage-axis" dir="ltr">أعلى يوم: {chartMetric === "cost" ? money(maximum) : integer(maximum)}</p>
              <div className="chart-scroll">
                <div className="chart" style={{ minWidth: series.length > 31 ? `${series.length * 18}px` : undefined }} dir="ltr" role="group" aria-label="الاستهلاك اليومي">
                  {series.map((point, i) => (
                    <button
                      type="button"
                      key={point.date}
                      className={`chart-day ${selectedDay?.date === point.date ? "is-selected" : ""}`}
                      aria-pressed={selectedDay?.date === point.date}
                      aria-label={`${point.date}: ${chartMetric === "cost" ? money(point.cost ?? 0) : `${integer(point.tokens)} توكن`}`}
                      title={`${point.date} · ${chartMetric === "cost" ? money(point.cost ?? 0) : integer(point.tokens)}`}
                      onClick={() => setDay(point.date)}
                    >
                      <span className="chart-track"><span className="chart-bar" style={{ height: maximum > 0 ? `${Math.max(0, ((point[chartMetric] ?? 0) / maximum) * 100)}%` : "0%", ["--i" as string]: i }} /></span>
                      <span className="chart-label">{series.length <= 10 || i === 0 || i === series.length - 1 || i % 7 === 0 ? point.date.slice(5).replace("-", "/") : ""}</span>
                    </button>
                  ))}
                </div>
              </div>
              <p className="usage-readout" aria-live="polite">
                <bdi>{selectedDay?.date}</bdi>
                <span>التكلفة <b dir="ltr">{data?.costs.data && selectedDay?.cost !== null ? money(selectedDay?.cost ?? 0) : "—"}</b></span>
                <span>التوكنز <b dir="ltr">{text?.data ? integer(selectedDay?.tokens ?? 0) : "—"}</b></span>
                <span>الطلبات <b dir="ltr">{text?.data ? integer(selectedDay?.requests ?? 0) : "—"}</b></span>
              </p>
              {maximum === 0 ? <p className="hint">لم يسجّل OpenAI استهلاكاً في هذه الفترة حتى الآن.</p> : null}
            </>
          ) : query.isPending ? (
            <div className="skel" style={{ height: "11rem" }} aria-hidden="true" />
          ) : (
            <State status={chartMetric === "cost" ? (data?.costs.status ?? "unavailable") : (text?.status ?? "unavailable")} />
          )}
          <p className="hint">قد تتأخر البيانات المجمّعة عن آخر طلب. يتحدّث الرسم تلقائياً كل 5 دقائق.</p>
        </div>
      </section>

      <div className="usage-two">
        <section className="panel">
          <div className="panel-head"><h2 className="panel-title">تفاصيل التوكنز</h2></div>
          <div className="usage-pad">
            <dl className="defs">
              <div><dt>إدخال</dt><dd dir="ltr">{numberOrDash(text, "input_tokens")}</dd></div>
              <div><dt>إخراج</dt><dd dir="ltr">{numberOrDash(text, "output_tokens")}</dd></div>
              <div><dt>إدخال مخزّن مؤقتاً</dt><dd dir="ltr">{numberOrDash(text, "input_cached_tokens")}</dd></div>
              <div><dt>نسبة المخزّن من الإدخال</dt><dd dir="ltr">{input !== null && cached !== null ? `${input ? ((cached / input) * 100).toFixed(1) : "0"}%` : "—"}</dd></div>
            </dl>
            <p className="hint">المخزّن مؤقتاً جزء من إجمالي الإدخال وليس إضافة عليه.</p>
            {text && !text.data ? <State status={text.status} /> : null}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2 className="panel-title">حدود الإنفاق</h2></div>
          <div className="usage-pad">
            {data ? (
              <>
                <SpendMeter title="المؤسسة" limit={data.organizationLimit} costs={data.organizationMonthCosts} />
                {data.scope.projectId ? <SpendMeter title="المشروع المحدد" limit={data.projectLimit} costs={data.monthCosts} /> : null}
              </>
            ) : (
              <p className="usage-state">بانتظار بيانات الحساب</p>
            )}
            <p className="hint">المتاح محسوب حتى حد الإنفاق، وليس رصيداً مدفوعاً مسبقاً.</p>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2 className="panel-title">استهلاك النماذج النصية</h2><span className="panel-meta">الفترة المحددة</span></div>
        {text?.data ? (
          models.length ? (
            <div className="table-scroll">
              <table>
                <caption className="sr-only">استهلاك كل نموذج نصي في الفترة المحددة</caption>
                <thead><tr><th>النموذج</th><th>الطلبات</th><th>إدخال</th><th>إخراج</th><th>إدخال مخزّن</th></tr></thead>
                <tbody>
                  {models.map(({ model, metrics }) => (
                    <tr key={model}>
                      <td><bdi>{model}</bdi></td>
                      {["num_model_requests", "input_tokens", "output_tokens", "input_cached_tokens"].map((key) => <td key={key} dir="ltr">{integer(metrics[key] ?? 0)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="usage-pad usage-state">لا يوجد استهلاك نصي مسجّل في هذه الفترة.</p>
          )
        ) : (
          <div className="usage-pad"><State status={text?.status ?? "unavailable"} /></div>
        )}
      </section>

      <div className="usage-two">
        <section className="panel">
          <div className="panel-head"><h2 className="panel-title">أين يذهب إنفاقك؟</h2></div>
          <div className="usage-pad">
            {data?.costs.data ? (
              groups.length ? (
                <ul className="cost-list">
                  {groups.map((group) => (
                    <li key={`${group.name}:${group.currency}`}><bdi>{group.name}</bdi><strong dir="ltr">{money(group.amount, group.currency)}</strong></li>
                  ))}
                </ul>
              ) : (
                <p className="usage-state">لا توجد تكلفة مسجّلة للفترة.</p>
              )
            ) : (
              <State status={data?.costs.status ?? "unavailable"} />
            )}
            <p className="hint">تكاليف فعلية من OpenAI حسب بند الفوترة، ولا تُستنتج تكلفة كل نموذج من عدد التوكنز.</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2 className="panel-title">الخدمات الأخرى</h2></div>
          <div className="services">
            {Object.entries(categories).map(([key, label]) => {
              const section = data?.usage[key];
              const totals = new Map<string, number>();
              for (const row of section?.data ?? []) for (const [metric, value] of Object.entries(row.metrics)) totals.set(metric, (totals.get(metric) ?? 0) + value);
              return (
                <details key={key}>
                  <summary><span>{label}</span><span className="hint">{section?.data ? (section.data.length ? "التفاصيل" : "لا استهلاك") : "غير متاح"}</span></summary>
                  <div className="services-body">
                    {section?.data ? (
                      totals.size ? (
                        key === "vectorStores" ? (
                          <>
                            <p className="hint">حجم التخزين المسجّل لكل يوم؛ لا تُجمع أحجام الأيام كأنها حجم حالي.</p>
                            {section.data.map((row, i) => (
                              <div className="service-model" key={i}>
                                <bdi>{row.date}</bdi>
                                <dl className="defs">{Object.entries(row.metrics).map(([metric, value]) => <div key={metric}><dt>{metricLabels[metric] ?? metric}</dt><dd dir="ltr">{quantity(value)}</dd></div>)}</dl>
                              </div>
                            ))}
                          </>
                        ) : (
                          <>
                            <dl className="defs">{[...totals].map(([metric, value]) => <div key={metric}><dt>{metricLabels[metric] ?? metric}</dt><dd dir="ltr">{quantity(value)}</dd></div>)}</dl>
                            {modelTotals(section.data).map(({ model, metrics }) => (
                              <div className="service-model" key={model}>
                                <bdi>{model}</bdi>
                                <dl className="defs">{Object.entries(metrics).map(([metric, value]) => <div key={metric}><dt>{metricLabels[metric] ?? metric}</dt><dd dir="ltr">{quantity(value)}</dd></div>)}</dl>
                              </div>
                            ))}
                          </>
                        )
                      ) : (
                        <p className="usage-state">لا يوجد استهلاك مسجّل.</p>
                      )
                    ) : (
                      <State status={section?.status ?? "unavailable"} />
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2 className="panel-title">حدود السرعة لكل نموذج</h2><span className="panel-meta">إعدادات المشروع، وليست المتبقي الآن</span></div>
        {data?.rateLimits.data ? (
          data.rateLimits.data.length ? (
            <div className="table-scroll">
              <table>
                <caption className="sr-only">حدود الطلبات والتوكنز والصور والصوت للمشروع</caption>
                <thead><tr><th>النموذج</th><th>طلب / دقيقة</th><th>توكن / دقيقة</th><th>طلب / يوم</th><th>صورة / دقيقة</th><th>صوت MB / دقيقة</th><th>Batch توكن / يوم</th></tr></thead>
                <tbody>
                  {data.rateLimits.data.map((limit) => (
                    <tr key={limit.model}>
                      <td><bdi>{limit.model}</bdi></td>
                      {[limit.requestsPerMinute, limit.tokensPerMinute, limit.requestsPerDay, limit.imagesPerMinute, limit.audioMegabytesPerMinute, limit.batchTokensPerDay].map((value, i) => (
                        <td key={i} dir="ltr">{value === null ? "—" : integer(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="usage-pad usage-state">لا توجد حدود نماذج متاحة.</p>
          )
        ) : (
          <div className="usage-pad"><State status={data?.rateLimits.status ?? "project-required"} /></div>
        )}
        <p className="usage-pad hint">حدود الدقيقة تختلف عن حد الإنفاق الشهري. الرصيد المدفوع مسبقاً وحد الاستخدام المعتمد غير معروضين هنا؛ راجعهما من إعدادات OpenAI.</p>
      </section>

      {data?.configured ? (
        <details className="panel usage-daily">
          <summary>السجل اليومي للفترة</summary>
          <div className="table-scroll">
            <table>
              <thead><tr><th>اليوم · UTC</th><th>التكلفة USD</th><th>الطلبات النصية</th><th>التوكنز النصية</th></tr></thead>
              <tbody>
                {series.map((point) => (
                  <tr key={point.date}>
                    <td dir="ltr">{point.date}</td>
                    <td dir="ltr">{data.costs.data && point.cost !== null ? money(point.cost) : "—"}</td>
                    <td dir="ltr">{text?.data ? integer(point.requests) : "—"}</td>
                    <td dir="ltr">{text?.data ? integer(point.tokens) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}

      <footer className="usage-footer">
        <p className="hint"><WarningCircle size={16} aria-hidden="true" /> النطاق يتبع المؤسسة أو المشروع في OpenAI، وقد يشمل استخداماً خارج Newsplus.</p>
        <div>
          <External href="https://platform.openai.com/usage">لوحة OpenAI</External>
          <External href="https://platform.openai.com/settings/organization/billing/overview">الفوترة والرصيد</External>
          <External href="https://platform.openai.com/settings/organization/limits">حدود الحساب</External>
        </div>
      </footer>
    </div>
  );
}

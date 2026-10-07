import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowClockwise, ArrowSquareOut, DownloadSimple } from "@phosphor-icons/react";
import type { OpenAIDataStatus, OpenAISection, OpenAIUsageRow, OpenAICostRow, OpenAISpendLimit } from "@newsplus/shared";
import { useSession } from "@/hooks/useSession";
import { ApiError } from "@/services/apiError";
import { getOpenAIUsage } from "@/services/openaiUsageService";
import { dailySeries, integer, quantity, metricLabels, modelTotals, money, presetRange, sumMetric, usdTotal } from "../usageFormat";
import "../usage.css";

const statusLabels: Record<OpenAIDataStatus, string> = {
  ready: "متصل", "not-configured": "بانتظار ربط حساب OpenAI", unauthorized: "المفتاح لا يملك صلاحية قراءة هذه البيانات", unavailable: "تعذر جلب البيانات — حاول التحديث لاحقاً", "not-found": "غير متاح لهذا الحساب أو لم يتم إعداد حد", "project-required": "اختر مشروعاً لعرض هذه البيانات",
};
const categories: Record<string, string> = { completions: "النصوص والتوكنز", images: "الصور", embeddings: "التضمينات", moderations: "مراجعة المحتوى", audioSpeeches: "تحويل النص إلى صوت", audioTranscriptions: "تفريغ الصوت", vectorStores: "تخزين المتجهات", codeInterpreterSessions: "جلسات تنفيذ الكود", fileSearchCalls: "البحث في الملفات", webSearchCalls: "البحث على الويب" };
const presets = [{ id: "today", label: "اليوم" }, { id: "7d", label: "آخر 7 أيام" }, { id: "30d", label: "آخر 30 يوماً" }, { id: "month", label: "هذا الشهر" }];
function State({ status }: { status: OpenAIDataStatus }) { return <p className={`usage-state ${status === "unauthorized" || status === "unavailable" ? "usage-state--error" : ""}`}>{statusLabels[status]}</p>; }
function External({ href, children }: { href: string; children: React.ReactNode }) { return <a href={href} target="_blank" rel="noreferrer" className="usage-external">{children}<ArrowSquareOut size={16} aria-hidden="true" /></a>; }
function numberOrDash(rows: OpenAISection<OpenAIUsageRow[]> | undefined, key: string) { return rows?.data ? integer(sumMetric(rows.data, key)) : "—"; }
function costOrDash(section: OpenAISection<OpenAICostRow[]> | undefined) { const value = section?.data ? usdTotal(section.data) : null; return value === null ? "—" : money(value); }

function SpendMeter({ title, limit, costs }: { title: string; limit: OpenAISection<OpenAISpendLimit>; costs: OpenAISection<OpenAICostRow[]> }) {
  const total = costs.data ? usdTotal(costs.data) : null;
  const amount = limit.data?.amount;
  const comparable = limit.data?.currency === "USD" && total !== null && amount !== undefined && amount > 0;
  const ratio = comparable ? total / amount : null;
  return <section className="usage-budget">
    <div className="usage-section-heading"><h3>{title}</h3><span className="usage-caption">الشهر الحالي · UTC</span></div>
    {limit.data ? <>
      <div className="usage-budget-values"><strong dir="ltr">{money(limit.data.amount, limit.data.currency)}</strong><span>حد الإنفاق الشهري</span></div>
      <div className={`usage-segments ${ratio !== null && ratio >= .8 ? "usage-segments--warning" : ""}`} role="img" aria-label={ratio === null ? "نسبة الاستهلاك غير متاحة" : `تم استهلاك ${(ratio * 100).toFixed(1)} بالمئة من حد الإنفاق`}>
        {Array.from({ length: 24 }, (_, i) => <span key={i} className={ratio !== null && i < Math.ceil(Math.min(1, ratio) * 24) ? "is-used" : ""} />)}
      </div>
      <div className="usage-budget-meta"><span>المستهلك <b dir="ltr">{costOrDash(costs)}</b></span><span>المتاح حتى الحد <b dir="ltr">{comparable ? money(Math.max(0, amount - total)) : "—"}</b></span></div>
      <p className="usage-caption">{ratio !== null ? `${(ratio * 100).toFixed(1)}% من الحد · ` : ""}{limit.data.enforcement === "enforcing" ? "الحد يوقف الطلبات عند بلوغه" : limit.data.enforcement === "inactive" ? "الحد غير نشط حالياً" : `حالة الحد: ${limit.data.enforcement}`}</p>
      {!costs.data && <State status={costs.status} />}
    </> : <State status={limit.status} />}
  </section>;
}

function exportCSV(usage: Record<string, OpenAISection<OpenAIUsageRow[]>>, costs: OpenAICostRow[] | null, start: string, end: string) {
  const rows: Array<Array<string | number>> = [["date_utc", "category", "model_or_line_item", "metric", "value", "currency", "dimensions"]];
  for (const [category, section] of Object.entries(usage)) for (const row of section.data ?? []) for (const [metric, value] of Object.entries(row.metrics)) rows.push([row.date, category, row.model ?? "", metric, value, "", JSON.stringify(row.dimensions)]);
  for (const row of costs ?? []) rows.push([row.date, "costs", row.lineItem, "amount", row.amount, row.currency, row.projectId ?? ""]);
  const escape = (value: string | number) => `"${String(typeof value === "string" && /^[=+\-@]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
  const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map((row) => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `openai-usage-${start}-${end}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function UsagePage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "استهلاك OpenAI — Newsplus";
    return () => { document.title = previousTitle; };
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
    enabled: Boolean(session), retry: false, staleTime: 60_000, gcTime: 0, refetchInterval: 300_000,
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
    const key = `${row.lineItem}:${row.currency}`; const group = costGroups.get(key) ?? { name: row.lineItem, currency: row.currency, amount: 0 }; group.amount += row.amount; costGroups.set(key, group);
  }
  const groups = [...costGroups.values()].sort((a, b) => b.amount - a.amount);
  const hasExport = Boolean(data && (Object.values(data.usage).some((section) => section.data?.length) || data.costs.data?.length));
  const setPeriod = (id: string) => { const next = presetRange(id); setRange(next); setDraft(next); setPreset(id); setDay(undefined); setDateError(""); };
  const applyDates = (event: React.FormEvent) => {
    event.preventDefault();
    const days = (Date.parse(draft.end) - Date.parse(draft.start)) / 86_400_000;
    if (!Number.isFinite(days) || days < 0 || days >= 90 || draft.end > new Date().toISOString().slice(0, 10)) { setDateError("اختر فترة صحيحة لا تزيد عن 90 يوماً، حتى اليوم."); return; }
    setRange(draft); setPreset("custom"); setDay(undefined); setDateError("");
  };

  return <div className="usage-page" dir="rtl">
    <header className="usage-heading">
      <div><p className="usage-eyebrow" dir="ltr">OPENAI / USAGE & LIMITS</p><h1>استهلاك الذكاء الاصطناعي<span>.</span></h1><p className="usage-intro">تابع أين يذهب استهلاكك، وكم تنفق، وما المتاح حتى حدود حسابك.</p></div>
      <div className="usage-actions"><button className="nd-btn-secondary" type="button" disabled={query.isFetching} onClick={() => void query.refetch()}><ArrowClockwise size={18} aria-hidden="true" />{query.isFetching ? "جارٍ التحديث…" : "تحديث"}</button><button className="nd-btn-secondary" type="button" disabled={!hasExport || query.isFetching} onClick={() => data && exportCSV(data.usage, data.costs.data, range.start, range.end)}><DownloadSimple size={18} aria-hidden="true" />تصدير CSV</button></div>
    </header>

    <div className="usage-toolbar">
      <div className="usage-presets" aria-label="فترة الاستهلاك">{presets.map((item) => <button type="button" key={item.id} aria-pressed={preset === item.id} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div>
      <label className="usage-project">النطاق<select value={project ?? data?.scope.projectId ?? "organization"} onChange={(event) => { setProject(event.target.value); setDay(undefined); }} disabled={query.isFetching || !data?.configured}><option value="organization">المؤسسة بالكامل</option>{data?.scope.projectId && !data.projects.data?.some((item) => item.id === data.scope.projectId) && <option value={data.scope.projectId}>{data.scope.projectId}</option>}{data?.projects.data?.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
    </div>
    <form className="usage-date-form" onSubmit={applyDates}>
      <label>من<input type="date" value={draft.start} max={draft.end} required onChange={(event) => setDraft({ ...draft, start: event.target.value })} /></label><label>إلى<input type="date" value={draft.end} min={draft.start} max={new Date().toISOString().slice(0, 10)} required onChange={(event) => setDraft({ ...draft, end: event.target.value })} /></label><button type="submit" className="usage-text-button">تطبيق الفترة</button><span className="usage-caption">كل الأيام بتوقيت UTC · التكلفة بالدولار</span>
    </form>
    {dateError && <p className="usage-state usage-state--error" role="alert">{dateError}</p>}
    <div className="usage-sync" role="status"><span className={`usage-dot ${data?.configured ? "is-connected" : ""}`} aria-hidden="true" />{query.isPending ? "جارٍ قراءة بيانات الحساب…" : data ? <><span>{data.configured ? "بيانات OpenAI الرسمية" : "الحساب غير مربوط للمتابعة"}</span><span>آخر جلب: <bdi>{new Date(data.fetchedAt).toLocaleString("ar-EG", { timeZone: "UTC", dateStyle: "short", timeStyle: "short" })}</bdi> UTC</span></> : "البيانات غير متاحة"}</div>
    {query.error && <div className="usage-notice" role="alert"><h2>{query.error instanceof ApiError && query.error.status === 403 ? "المتابعة متاحة لصاحب الحساب فقط" : "تعذر الاتصال بصفحة الاستهلاك"}</h2><p>{query.error instanceof ApiError && query.error.status === 403 ? "سجّل الدخول بحساب مالك مساحة العمل أو مسؤول النظام." : "تحقق من الاتصال، ثم اضغط تحديث للمحاولة مرة أخرى."}</p></div>}
    {data && !data.configured && <section className="usage-notice"><div><span className="usage-eyebrow">CONNECT ACCOUNT</span><h2>خطوة واحدة لعرض أرقام حسابك</h2><p>اربط مفتاح إدارة OpenAI على السيرفر لتظهر هنا بيانات الاستهلاك والتكلفة والحدود. مفتاح تشغيل أدوات الذكاء الاصطناعي وحده لا يكفي.</p><details><summary>إرشادات الربط الآمن</summary><p>أنشئ Admin API Key من إعدادات المؤسسة، وأضفه إلى إعداد <code>OPENAI_ADMIN_KEY</code> على السيرفر ثم أعد تشغيل API. ويمكن تحديد <code>OPENAI_PROJECT_ID</code> لفتح مشروعك تلقائياً. احتفظ بالمفتاح على السيرفر فقط.</p></details></div><External href="https://platform.openai.com/settings/organization/admin-keys">إعداد مفتاح الإدارة</External></section>}

    <section className="usage-overview" aria-label="ملخص الفترة">
      <div className="usage-hero"><span className="usage-eyebrow">تكلفة الفترة المحددة</span><strong className="usage-hero-number" dir="ltr">{costOrDash(data?.costs)}</strong><p>من <bdi>{range.start}</bdi> إلى <bdi>{range.end}</bdi></p>{data && !data.costs.data && <State status={data.costs.status} />}<span className="usage-caption">{data?.scope.projectId ? "المشروع المحدد" : "المؤسسة بالكامل"} · تشمل بنود الفوترة المتاحة</span></div>
      <div className="usage-stat-stack"><div><span>طلبات النماذج النصية</span><strong dir="ltr">{numberOrDash(text, "num_model_requests")}</strong></div><div><span>إجمالي التوكنز النصية</span><strong dir="ltr">{text?.data ? integer(sumMetric(text.data, "input_tokens") + sumMetric(text.data, "output_tokens")) : "—"}</strong></div><div><span>الصور المُنشأة / المعالجة</span><strong dir="ltr">{numberOrDash(images, "images")}</strong></div><div><span>تكلفة الشهر الحالي</span><strong dir="ltr">{costOrDash(data?.monthCosts)}</strong></div></div>
    </section>

    <section className="usage-chart-section">
      <div className="usage-section-heading"><div><span className="usage-eyebrow">DAILY ACTIVITY</span><h2>استهلاكك، يوماً بيوم</h2></div><div className="usage-chart-switch"><button type="button" aria-pressed={chartMetric === "cost"} onClick={() => setChartMetric("cost")}>التكلفة</button><button type="button" aria-pressed={chartMetric === "tokens"} onClick={() => setChartMetric("tokens")}>التوكنز</button></div></div>
      {chartReady ? <><div className="usage-chart-topline"><span className="usage-caption">{chartMetric === "cost" ? "USD / DAY" : "TOKENS / DAY"}</span><span dir="ltr">{chartMetric === "cost" ? money(maximum) : integer(maximum)}</span></div><div className="usage-chart-scroll"><div className="usage-chart" style={{ minWidth: series.length > 31 ? `${series.length * 18}px` : undefined }} dir="ltr" aria-label="رسم الاستهلاك اليومي">
        {series.map((point, i) => <button type="button" key={point.date} className={`usage-chart-day ${selectedDay?.date === point.date ? "is-selected" : ""}`} aria-pressed={selectedDay?.date === point.date} aria-label={`${point.date}: ${chartMetric === "cost" ? money(point.cost ?? 0) : `${integer(point.tokens)} توكن`}`} title={`${point.date} · ${chartMetric === "cost" ? money(point.cost ?? 0) : integer(point.tokens)}`} onClick={() => setDay(point.date)}><span className="usage-chart-track"><span className="usage-chart-bar" style={{ height: maximum > 0 ? `${Math.max(0, (point[chartMetric] ?? 0) / maximum * 100)}%` : "0%" }} /></span><span className="usage-chart-label">{series.length <= 10 || i === 0 || i === series.length - 1 || i % 7 === 0 ? point.date.slice(5).replace("-", "/") : ""}</span></button>)}
      </div></div><div className="usage-day-readout" aria-live="polite"><bdi>{selectedDay?.date}</bdi><span>التكلفة <b dir="ltr">{data?.costs.data && selectedDay?.cost !== null ? money(selectedDay?.cost ?? 0) : "—"}</b></span><span>التوكنز <b dir="ltr">{text?.data ? integer(selectedDay?.tokens ?? 0) : "—"}</b></span><span>الطلبات النصية <b dir="ltr">{text?.data ? integer(selectedDay?.requests ?? 0) : "—"}</b></span></div>{maximum === 0 && <p className="usage-caption">لم يُسجّل OpenAI استهلاكاً لهذه الفترة حتى الآن.</p>}</> : <div className="usage-chart-empty"><span className="usage-empty-number" aria-hidden="true">—</span><State status={chartMetric === "cost" ? data?.costs.status ?? "unavailable" : text?.status ?? "unavailable"} /></div>}
      <p className="usage-caption">البيانات المجمعة قد تتأخر عن آخر طلب. التحديث التلقائي كل 5 دقائق، مع حفظ نتيجة الجلب لمدة دقيقة.</p>
    </section>

    <div className="usage-detail-grid">
      <section className="usage-panel"><div className="usage-section-heading"><div><span className="usage-eyebrow">TOKEN BREAKDOWN</span><h2>تفاصيل التوكنز</h2></div></div><dl className="usage-definition"><div><dt>إدخال</dt><dd>{numberOrDash(text, "input_tokens")}</dd></div><div><dt>إخراج</dt><dd>{numberOrDash(text, "output_tokens")}</dd></div><div><dt>إدخال مخزّن مؤقتاً</dt><dd>{numberOrDash(text, "input_cached_tokens")}</dd></div><div><dt>نسبة التخزين المؤقت من الإدخال</dt><dd>{input !== null && cached !== null ? `${input ? (cached / input * 100).toFixed(1) : "0"}%` : "—"}</dd></div></dl><p className="usage-caption">التوكن وحدة معالجة للنص. الإدخال المخزّن مؤقتاً جزء من إجمالي الإدخال؛ لا يُضاف إليه مرة ثانية.</p>{text && !text.data && <State status={text.status} />}</section>
      <section className="usage-panel"><div className="usage-section-heading"><div><span className="usage-eyebrow">SPENDING LIMITS</span><h2>حدود الإنفاق</h2></div></div>{data ? <><SpendMeter title="المؤسسة" limit={data.organizationLimit} costs={data.organizationMonthCosts} />{data.scope.projectId && <SpendMeter title="المشروع المحدد" limit={data.projectLimit} costs={data.monthCosts} />}</> : <p className="usage-state">بانتظار بيانات الحساب</p>}<p className="usage-caption">المتاح هنا محسوب حتى حد الإنفاق، وليس رصيداً مدفوعاً مسبقاً أو كوتا يومية.</p></section>
    </div>

    <section className="usage-panel usage-models"><div className="usage-section-heading"><div><span className="usage-eyebrow">MODELS</span><h2>استهلاك النماذج النصية</h2></div><span className="usage-caption">الفترة المحددة</span></div>{text?.data ? models.length ? <div className="usage-table-scroll"><table><caption className="usage-sr-only">استهلاك كل نموذج نصي في الفترة المحددة</caption><thead><tr><th>النموذج</th><th>الطلبات</th><th>إدخال</th><th>إخراج</th><th>إدخال مخزّن</th></tr></thead><tbody>{models.map(({ model, metrics }) => <tr key={model}><td><bdi>{model}</bdi></td>{["num_model_requests", "input_tokens", "output_tokens", "input_cached_tokens"].map((key) => <td key={key} dir="ltr">{integer(metrics[key] ?? 0)}</td>)}</tr>)}</tbody></table></div> : <p className="usage-state">لا يوجد استهلاك نصي مسجّل في هذه الفترة.</p> : <State status={text?.status ?? "unavailable"} />}</section>

    <div className="usage-detail-grid">
      <section className="usage-panel"><div className="usage-section-heading"><div><span className="usage-eyebrow">COST DETAILS</span><h2>أين يذهب إنفاقك؟</h2></div></div>{data?.costs.data ? groups.length ? <ul className="usage-cost-list">{groups.map((group) => <li key={`${group.name}:${group.currency}`}><span><bdi>{group.name}</bdi></span><strong dir="ltr">{money(group.amount, group.currency)}</strong></li>)}</ul> : <p className="usage-state">لا توجد تكلفة مسجّلة للفترة.</p> : <State status={data?.costs.status ?? "unavailable"} />}<p className="usage-caption">تكاليف فعلية مجمعة من OpenAI حسب بند الفوترة؛ لا تُستنتج تكلفة كل نموذج من عدد التوكنز.</p></section>
      <section className="usage-panel"><div className="usage-section-heading"><div><span className="usage-eyebrow">SERVICES</span><h2>الخدمات والتفاصيل الإضافية</h2></div></div><div className="usage-services">{Object.entries(categories).map(([key, label]) => {
        const section = data?.usage[key]; const totals = new Map<string, number>();
        for (const row of section?.data ?? []) for (const [metric, value] of Object.entries(row.metrics)) totals.set(metric, (totals.get(metric) ?? 0) + value);
        return <details key={key}><summary><span>{label}</span><span className="usage-caption">{section?.data ? section.data.length ? "عرض التفاصيل" : "لا يوجد استهلاك" : "غير متاح"}</span></summary>{section?.data ? totals.size ? key === "vectorStores" ? <><p className="usage-caption">حجم التخزين المسجّل لكل يوم؛ لا تُجمع أحجام الأيام كأنها حجم حالي.</p>{section.data.map((row, i) => <div className="usage-service-model" key={i}><bdi>{row.date}</bdi><dl className="usage-definition">{Object.entries(row.metrics).map(([metric, value]) => <div key={metric}><dt>{metricLabels[metric] ?? metric}</dt><dd>{quantity(value)}</dd></div>)}</dl></div>)}</> : <><dl className="usage-definition">{[...totals].map(([metric, value]) => <div key={metric}><dt>{metricLabels[metric] ?? metric}</dt><dd>{quantity(value)}</dd></div>)}</dl>{modelTotals(section.data).map(({ model, metrics }) => <div className="usage-service-model" key={model}><bdi>{model}</bdi><dl className="usage-definition">{Object.entries(metrics).map(([metric, value]) => <div key={metric}><dt>{metricLabels[metric] ?? metric}</dt><dd>{quantity(value)}</dd></div>)}</dl></div>)}</> : <p className="usage-state">لا يوجد استهلاك مسجّل.</p> : <State status={section?.status ?? "unavailable"} />}</details>;
      })}</div></section>
    </div>

    <section className="usage-panel"><div className="usage-section-heading"><div><span className="usage-eyebrow">RATE LIMITS</span><h2>حدود السرعة لكل نموذج</h2></div><span className="usage-caption">إعدادات المشروع · ليست الاستهلاك المتبقي الآن</span></div>{data?.rateLimits.data ? data.rateLimits.data.length ? <div className="usage-table-scroll"><table><caption className="usage-sr-only">حدود الطلبات والتوكنز والصور والصوت للمشروع</caption><thead><tr><th>النموذج</th><th>طلب / دقيقة</th><th>توكن / دقيقة</th><th>طلب / يوم</th><th>صورة / دقيقة</th><th>صوت MB / دقيقة</th><th>Batch توكن / يوم</th></tr></thead><tbody>{data.rateLimits.data.map((limit) => <tr key={limit.model}><td><bdi>{limit.model}</bdi></td>{[limit.requestsPerMinute, limit.tokensPerMinute, limit.requestsPerDay, limit.imagesPerMinute, limit.audioMegabytesPerMinute, limit.batchTokensPerDay].map((value, i) => <td key={i} dir="ltr">{value === null ? "—" : integer(value)}</td>)}</tr>)}</tbody></table></div> : <p className="usage-state">لا توجد حدود نماذج متاحة.</p> : <State status={data?.rateLimits.status ?? "project-required"} />}<p className="usage-caption">حدود الدقيقة تختلف عن حد الإنفاق الشهري. الرصيد المدفوع مسبقاً وحد الاستخدام المعتمد للحساب غير معروضين هنا؛ راجعهما من إعدادات OpenAI.</p></section>

    {data?.configured && <details className="usage-panel usage-daily-table"><summary>السجل اليومي للفترة المحددة</summary><div className="usage-table-scroll"><table><thead><tr><th>اليوم · UTC</th><th>التكلفة USD</th><th>الطلبات النصية</th><th>التوكنز النصية</th></tr></thead><tbody>{series.map((point) => <tr key={point.date}><td dir="ltr">{point.date}</td><td dir="ltr">{data.costs.data && point.cost !== null ? money(point.cost) : "—"}</td><td dir="ltr">{text?.data ? integer(point.requests) : "—"}</td><td dir="ltr">{text?.data ? integer(point.tokens) : "—"}</td></tr>)}</tbody></table></div></details>}
    <footer className="usage-footer"><p>النطاق يتبع المؤسسة أو المشروع المحدد في OpenAI، وقد يشمل استخداماً خارج Newsplus.</p><div><External href="https://platform.openai.com/usage">لوحة OpenAI</External><External href="https://platform.openai.com/settings/organization/billing/overview">الفوترة والرصيد</External><External href="https://platform.openai.com/settings/organization/limits">حدود الحساب</External></div></footer>
  </div>;
}

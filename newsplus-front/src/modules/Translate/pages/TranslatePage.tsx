import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowsLeftRight, FileText, Translate, WarningCircle } from "@phosphor-icons/react";
import type { TranslateLanguage } from "@newsplus/shared";
import { QuotaNotice } from "@/components/QuotaNotice";
import { CopyButton } from "@/components/ui/CopyButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Segmented";
import { readDeskHandoff } from "@/services/deskHandoff";
import { isOpenAIQuotaError, toolErrorMessage } from "@/services/toolErrors";
import { translateContent } from "@/services/translateService";
import { formatNumber } from "@/utils/format";

type Pane = "source" | "output";

const TARGETS = [
  { id: "ar" as const, label: "عربي" },
  { id: "en" as const, label: "English" },
];

const languageName = (language: string) => (language === "ar" ? "العربية" : language === "en" ? "الإنجليزية" : "لغة أخرى");
const chars = (value: string) => value.trim().length;

export default function TranslatePage() {
  const handoff = readDeskHandoff(useLocation().state);
  const [source, setSource] = useState(() => handoff?.source ?? "");
  const [target, setTarget] = useState<TranslateLanguage>("en");
  const [pane, setPane] = useState<Pane>("source");

  const mutation = useMutation({
    mutationFn: translateContent,
    onSuccess: () => setPane("output"),
    onError: () => setPane("source"),
  });

  const result = mutation.data;
  const translated = result?.translated ?? "";
  const looksUrl = /^https?:\/\/\S+$/i.test(source.trim());
  const limit = looksUrl ? 2_000 : 20_000;
  const tooLong = chars(source) > limit;
  const extracted = looksUrl && result ? result.original : null;
  const shown = extracted ?? source;

  function reset() {
    mutation.reset();
  }

  function changeTarget(next: TranslateLanguage) {
    if (mutation.isPending || next === target) return;
    setTarget(next);
    reset();
    setPane("source");
  }

  function swap() {
    if (mutation.isPending) return;
    const detected = result?.sourceLanguage;
    setTarget(detected === "ar" || detected === "en" ? detected : target === "ar" ? "en" : "ar");
    if (result) setSource(result.translated);
    reset();
    setPane("source");
  }

  function submit() {
    const value = source.trim();
    if (!value || mutation.isPending || tooLong) return;
    mutation.mutate(looksUrl ? { url: value, target } : { text: value, target });
  }

  return (
    <div className="ws">
      <header className="ws-head">
        <div className="ws-title">
          <h1 className="page-title">ترجمة صحفية</h1>
          <p className="ws-lede">من المصدر إلى صياغة صحفية دقيقة، مع حفظ الأسماء والأرقام والاقتباسات.</p>
        </div>
        <div className="ws-head-tools">
          <span className="field-label">الترجمة إلى</span>
          <Segmented value={target} onChange={changeTarget} options={TARGETS} ariaLabel="لغة الهدف" size="sm" disabled={mutation.isPending} />
          <button type="button" className="icon-btn" onClick={swap} disabled={mutation.isPending} aria-label="تبديل اتجاه الترجمة" title="تبديل الاتجاه">
            <ArrowsLeftRight size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="ws-tabs">
        <Segmented
          value={pane}
          onChange={setPane}
          ariaLabel="أقسام الترجمة"
          block
          options={[
            { id: "source", label: "الأصل" },
            { id: "output", label: "الترجمة", disabled: !translated && !mutation.isPending },
          ]}
        />
      </div>

      <form
        className="ws-body"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <section className={`ws-pane ${pane === "source" ? "" : "is-off"}`} aria-label="الأصل">
          <div className="ws-pane-head">
            <p className="panel-title"><FileText size={18} aria-hidden="true" />{extracted ? "النص المستخرج" : looksUrl ? "رابط المصدر" : "النص الأصلي"}</p>
            <p className="panel-meta"><bdi>{formatNumber(chars(shown))}</bdi> حرف</p>
          </div>
          {extracted ? (
            <div className="source-strip">
              <span title={source}>{source}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={reset} disabled={mutation.isPending}>تعديل المصدر</button>
            </div>
          ) : null}
          <div className="ws-fill">
            <label className="sr-only" htmlFor="translate-source">النص الأصلي</label>
            <textarea
              id="translate-source"
              className="textarea"
              dir="auto"
              value={shown}
              readOnly={Boolean(extracted)}
              disabled={mutation.isPending}
              aria-invalid={tooLong || undefined}
              aria-describedby="translate-hint"
              placeholder="الصق نص الخبر أو رابط المقال هنا…"
              onChange={(event) => {
                setSource(event.target.value);
                reset();
              }}
            />
            <p id="translate-hint" className={`hint ${tooLong ? "is-error" : ""}`}>
              {tooLong
                ? `المصدر يتجاوز ${formatNumber(limit)} حرف. ${looksUrl ? "استخدم رابطاً أقصر أو الصق نص المقال." : "قسّم النص إلى أجزاء كاملة."}`
                : "الصق نصاً كاملاً أو رابط مقال. الفقرات المتسقة تعطي ترجمة أدق."}
            </p>
          </div>
          <div className="ws-dock">
            {mutation.error ? <ErrorBlock error={mutation.error} /> : null}
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={mutation.isPending || !source.trim() || tooLong}>
              {mutation.isPending ? <span className="spinner" aria-hidden="true" /> : <Translate size={20} aria-hidden="true" />}
              {mutation.isPending ? "جارٍ الترجمة…" : `ترجم إلى ${languageName(target)}`}
            </button>
          </div>
        </section>

        <section className={`ws-pane ${pane === "output" ? "" : "is-off"}`} aria-label="الترجمة" aria-busy={mutation.isPending}>
          <div className="ws-pane-head">
            <p className="panel-title"><Translate size={18} aria-hidden="true" />الترجمة</p>
            <p className="panel-meta">{languageName(result?.targetLanguage ?? target)}</p>
          </div>
          <div className="ws-scroll">
            {mutation.isPending ? (
              <div className="ws-working" role="status">
                <p className="working">
                  <span className="working-dots" aria-hidden="true"><i /><i /><i /></span>
                  جارٍ ترجمة النص ومراجعة الصياغة…
                </p>
                <div className="ink-lines" aria-hidden="true"><span /><span /><span /><span /><span /></div>
              </div>
            ) : translated ? (
              <article className="translated" dir={result?.targetLanguage === "ar" ? "rtl" : "ltr"} lang={result?.targetLanguage ?? target} aria-label="النص المترجم">
                {translated}
              </article>
            ) : (
              <EmptyState icon={<Translate size={26} />} title="الخبر بلغته الجديدة">
                أضف المصدر واختر لغة الترجمة، وستظهر النتيجة هنا للمراجعة.
              </EmptyState>
            )}
          </div>
          {translated && !mutation.isPending ? (
            <div className="ws-dock">
              <div className="ws-dock-row">
                <CopyButton className="btn btn-primary btn-sm" label="نسخ الترجمة" getText={() => translated} toastMessage="تم نسخ الترجمة" />
                <p className="pair-note">
                  {languageName(result?.sourceLanguage ?? "other")} إلى {languageName(result?.targetLanguage ?? target)} · <bdi>{formatNumber(chars(translated))}</bdi> حرف · راجع النص قبل النشر
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </form>
    </div>
  );
}

function ErrorBlock({ error }: { error: unknown }) {
  if (isOpenAIQuotaError(error)) return <QuotaNotice />;
  return (
    <div className="notice is-error" role="alert">
      <WarningCircle size={20} weight="fill" aria-hidden="true" />
      <div>{toolErrorMessage(error)}</div>
    </div>
  );
}

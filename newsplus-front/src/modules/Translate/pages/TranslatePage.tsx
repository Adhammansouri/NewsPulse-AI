import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ToolShell, ToolStatus } from "@/components/shared/ToolShell";
import { translateContent } from "@/services/translateService";
import { copyText, toolErrorMessage } from "@/services/toolErrors";
import type { TranslateLanguage } from "@newsplus/shared";

export default function TranslatePage() {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState<TranslateLanguage>("en");
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: translateContent,
  });

  const result = mutation.data;
  const translated = result?.translated ?? "";

  function swap() {
    setTarget((current) => (current === "ar" ? "en" : "ar"));
    if (result) {
      setSource(result.translated);
      mutation.reset();
    }
  }

  return (
    <ToolShell
      badge="BILINGUAL"
      title="الترجمة"
      description="ترجم بين العربية والإنجليزية مع عرض النص الأصلي والمترجم جنباً إلى جنب."
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="nd-seg" role="group" aria-label="Target language">
          <button
            type="button"
            className={`nd-seg-btn ${target === "ar" ? "is-active" : ""}`}
            onClick={() => setTarget("ar")}
          >
            إلى العربية
          </button>
          <button
            type="button"
            className={`nd-seg-btn ${target === "en" ? "is-active" : ""}`}
            onClick={() => setTarget("en")}
          >
            إلى الإنجليزية
          </button>
        </div>
        <button type="button" className="nd-btn-secondary" onClick={swap}>
          تبديل الاتجاه
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = source.trim();
          if (!trimmed) return;
          setCopied(false);
          const looksUrl = /^https?:\/\//i.test(trimmed) && !trimmed.includes("\n") && trimmed.length < 500;
          mutation.mutate(looksUrl ? { url: trimmed, target } : { text: trimmed, target });
        }}
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="nd-surface p-6 sm:p-8">
            <label className="nd-label mb-4 block" htmlFor="translate-source">
              ORIGINAL
            </label>
            <textarea
              id="translate-source"
              className="nd-textarea mb-8 min-h-[280px]"
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                mutation.reset();
              }}
              placeholder="الصق النص أو رابط المحتوى للترجمة..."
              dir="auto"
            />
            <button type="submit" className="nd-btn-primary w-full" disabled={mutation.isPending || !source.trim()}>
              ترجمة
            </button>
            <div className="mt-6">
              {mutation.isPending && <ToolStatus tone="busy">[ WORKING ] جاري الترجمة...</ToolStatus>}
              {mutation.error && <ToolStatus tone="error">[ ERROR ] {toolErrorMessage(mutation.error)}</ToolStatus>}
            </div>
          </section>

          <section className="nd-surface flex min-h-[360px] flex-col p-6 sm:p-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="nd-label">TRANSLATION</p>
              {translated && (
                <button
                  type="button"
                  className="nd-btn-secondary"
                  onClick={async () => {
                    await copyText(translated);
                    setCopied(true);
                  }}
                >
                  {copied ? "تم النسخ" : "نسخ"}
                </button>
              )}
            </div>

            {!translated && !mutation.isPending && (
              <div className="flex flex-1 flex-col justify-center">
                <p className="nd-display text-4xl text-[var(--nd-text-disabled)]">—</p>
                <ToolStatus>[ NO OUTPUT ] الترجمة ستظهر هنا</ToolStatus>
              </div>
            )}

            {mutation.isPending && <ToolStatus tone="busy">[ WORKING ] جاري إعداد النص المترجم...</ToolStatus>}

            {translated && (
              <div>
                <ToolStatus tone="ready">
                  [ READY ] {result?.sourceLanguage ?? "?"} → {result?.targetLanguage ?? target}
                </ToolStatus>
                <p className="mt-5 whitespace-pre-wrap text-[15px] leading-8" dir="auto">
                  {translated}
                </p>
              </div>
            )}
          </section>
        </div>
      </form>
    </ToolShell>
  );
}

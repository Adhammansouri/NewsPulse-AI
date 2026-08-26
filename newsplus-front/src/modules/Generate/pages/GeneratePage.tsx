import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ToolShell, ToolStatus } from "@/components/shared/ToolShell";
import { generateContent } from "@/services/generateService";
import { copyText, toolErrorMessage } from "@/services/toolErrors";
import type { GenerateLanguage, GenerateStyle } from "@newsplus/shared";

const STYLES: { id: GenerateStyle; label: string }[] = [
  { id: "brief", label: "موجز" },
  { id: "article", label: "مقال" },
  { id: "report", label: "تقرير" },
];

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [angle, setAngle] = useState("");
  const [style, setStyle] = useState<GenerateStyle>("article");
  const [language, setLanguage] = useState<GenerateLanguage>("ar");
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: generateContent,
  });

  const result = mutation.data;

  return (
    <ToolShell
      badge="GENERATE"
      title="توليد المحتوى"
      description="أنشئ تقارير ومقالات إخبارية بأسلوب تحريري من موضوع أو رابط أو نص مرجعي."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <form
          className="nd-surface p-6 sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (!prompt.trim()) return;
            setCopied(false);
            mutation.mutate({
              prompt: prompt.trim(),
              style,
              language,
              angle: angle.trim() || undefined,
            });
          }}
        >
          <p className="nd-label mb-4">CONTROLS</p>
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="nd-seg" role="group" aria-label="Style">
              {STYLES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`nd-seg-btn ${style === item.id ? "is-active" : ""}`}
                  onClick={() => setStyle(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="nd-seg" role="group" aria-label="Language">
              {(["ar", "en"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  className={`nd-seg-btn ${language === code ? "is-active" : ""}`}
                  onClick={() => setLanguage(code)}
                >
                  {code === "ar" ? "عربي" : "EN"}
                </button>
              ))}
            </div>
          </div>

          <label className="nd-label mb-3 block" htmlFor="generate-prompt">
            ASSIGNMENT
          </label>
          <textarea
            id="generate-prompt"
            className="nd-textarea mb-6"
            rows={10}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="اكتب الموضوع، الزاوية، أو الصق نصاً مرجعياً..."
          />

          <label className="nd-label mb-3 block" htmlFor="generate-angle">
            ANGLE
          </label>
          <input
            id="generate-angle"
            className="nd-input mb-8"
            value={angle}
            onChange={(event) => setAngle(event.target.value)}
            placeholder="اختياري — زاوية التغطية"
          />

          <button type="submit" className="nd-btn-primary w-full" disabled={mutation.isPending || !prompt.trim()}>
            توليد المحتوى
          </button>
          <div className="mt-6">
            {mutation.isPending && <ToolStatus tone="busy">[ WORKING ] جاري الكتابة...</ToolStatus>}
            {mutation.error && <ToolStatus tone="error">[ ERROR ] {toolErrorMessage(mutation.error)}</ToolStatus>}
          </div>
        </form>

        <section className="nd-surface flex min-h-[360px] flex-col p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <p className="nd-label">OUTPUT</p>
            {result && (
              <button
                type="button"
                className="nd-btn-secondary"
                onClick={async () => {
                  await copyText([result.title, result.dek, result.body].filter(Boolean).join("\n\n"));
                  setCopied(true);
                }}
              >
                {copied ? "تم النسخ" : "نسخ"}
              </button>
            )}
          </div>

          {!result && !mutation.isPending && (
            <div className="flex flex-1 flex-col justify-center">
              <p className="nd-display text-4xl text-[var(--nd-text-disabled)]">—</p>
              <ToolStatus>[ NO OUTPUT ] المعاينة ستظهر هنا بعد التوليد</ToolStatus>
            </div>
          )}

          {mutation.isPending && <ToolStatus tone="busy">[ WORKING ] جاري تجهيز النص...</ToolStatus>}

          {result && (
            <article>
              <ToolStatus tone="ready">[ READY ] مسودة جاهزة للمراجعة</ToolStatus>
              <h2 className="mt-4 text-2xl font-medium leading-snug text-[var(--nd-text-display)]">{result.title}</h2>
              {result.dek && <p className="mt-3 text-[var(--nd-text-secondary)]">{result.dek}</p>}
              <div className="mt-6 whitespace-pre-wrap text-[15px] leading-8">{result.body}</div>
            </article>
          )}
        </section>
      </div>
    </ToolShell>
  );
}

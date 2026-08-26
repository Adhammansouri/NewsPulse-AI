import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ToolShell, ToolStatus } from "@/components/shared/ToolShell";
import { getNewsFeed, getNewsSources, summarizeNews } from "@/services/newsService";
import { copyText, toolErrorMessage } from "@/services/toolErrors";
import type { NewsFeedItem, NewsSummarizeData } from "@newsplus/shared";

function formatStamp(iso: string) {
  try {
    return new Date(iso).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function NewsPage() {
  const [sourceId, setSourceId] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [copied, setCopied] = useState(false);

  const sourcesQuery = useQuery({
    queryKey: ["news-sources"],
    queryFn: getNewsSources,
  });

  const feedQuery = useQuery({
    queryKey: ["news-feed", sourceId, query],
    queryFn: () => getNewsFeed(sourceId, query || undefined),
  });

  const summarizeMutation = useMutation({
    mutationFn: summarizeNews,
  });

  const items = feedQuery.data?.items ?? [];
  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  );

  const summary = summarizeMutation.data;
  const busy = summarizeMutation.isPending;
  const error = sourcesQuery.error ?? feedQuery.error ?? summarizeMutation.error;

  function runSummarize(body: Parameters<typeof summarizeNews>[0]) {
    setCopied(false);
    summarizeMutation.mutate(body);
  }

  async function onCopy(data: NewsSummarizeData) {
    const text = [data.title, data.dek, data.summary, ...data.bullets.map((item) => `• ${item}`)].join("\n\n");
    await copyText(text);
    setCopied(true);
  }

  return (
    <ToolShell
      badge="MONITOR"
      title="ملخص الأخبار"
      description="تابع العناوين من مصادر عربية ودولية، ثم اطلب ملخصاً تحريرياً لخبر محدد أو لموضوع."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          className={`nd-tag ${sourceId === "all" ? "nd-tag-active" : ""}`}
          onClick={() => setSourceId("all")}
        >
          الكل
        </button>
        {(sourcesQuery.data?.sources ?? []).map((source) => (
          <button
            key={source.id}
            type="button"
            className={`nd-tag ${sourceId === source.id ? "nd-tag-active" : ""}`}
            onClick={() => setSourceId(source.id)}
          >
            {source.name}
          </button>
        ))}
      </div>

      <label className="nd-label mb-2 block" htmlFor="news-query">
        FILTER
      </label>
      <input
        id="news-query"
        className="nd-input mb-8"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ابحث في العناوين..."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="nd-surface overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="nd-label">HEADLINES</p>
            <p className="nd-status-inline">{items.length} ITEM</p>
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {feedQuery.isLoading && (
              <p className="nd-status-inline px-5 py-8">[ LOADING ] جاري جلب المصادر...</p>
            )}
            {!feedQuery.isLoading && items.length === 0 && (
              <p className="nd-status-inline px-5 py-8">[ EMPTY ] لا توجد عناوين في هذه النافذة.</p>
            )}
            {items.map((item) => (
              <HeadlineRow
                key={item.id}
                item={item}
                active={selected?.id === item.id}
                onSelect={() => {
                  setSelectedId(item.id);
                  summarizeMutation.reset();
                }}
              />
            ))}
          </div>
        </section>

        <section className="nd-surface flex min-h-[360px] flex-col p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="nd-label">SUMMARIES</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="nd-btn-secondary"
                disabled={!selected || busy}
                onClick={() => selected && runSummarize({ itemId: selected.id, language: "ar" })}
              >
                تلخيص المحدد
              </button>
              <button
                type="button"
                className="nd-btn-secondary"
                disabled={busy || items.length === 0}
                onClick={() => runSummarize({ briefing: true, language: "ar" })}
              >
                موجز عاجل
              </button>
            </div>
          </div>

          {selected && !summary && (
            <div className="mb-6">
              <div className="mb-3 flex flex-wrap gap-2">
                {selected.breaking && <span className="nd-tag nd-tag-active">BREAKING</span>}
                {selected.sources.map((source) => (
                  <span key={`${source.id}-${source.url}`} className="nd-tag">
                    {source.name}
                  </span>
                ))}
              </div>
              <h2 className="text-xl font-medium text-[var(--nd-text-display)]">{selected.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--nd-text-secondary)]">{selected.excerpt || "—"}</p>
              <p className="nd-status-inline mt-4">{formatStamp(selected.publishedAt)}</p>
            </div>
          )}

          {busy && <ToolStatus tone="busy">[ WORKING ] جاري كتابة الملخص...</ToolStatus>}
          {error && <ToolStatus tone="error">[ ERROR ] {toolErrorMessage(error)}</ToolStatus>}

          {summary && (
            <SummaryPane
              data={summary}
              copied={copied}
              onCopy={() => void onCopy(summary)}
            />
          )}

          {!summary && !busy && selected && (
            <ToolStatus>[ READY ] اختر خبراً ثم اطلب التلخيص، أو الصق رابطاً بالأسفل.</ToolStatus>
          )}

          <form
            className="mt-auto pt-8"
            onSubmit={(event) => {
              event.preventDefault();
              if (!customInput.trim()) return;
              runSummarize({ input: customInput.trim(), language: "ar" });
            }}
          >
            <label className="nd-label mb-3 block" htmlFor="news-custom">
              URL / TOPIC
            </label>
            <textarea
              id="news-custom"
              className="nd-textarea mb-6"
              rows={4}
              value={customInput}
              onChange={(event) => setCustomInput(event.target.value)}
              placeholder="الصق رابط خبر أو اكتب موضوعاً للمتابعة..."
            />
            <button type="submit" className="nd-btn-primary w-full" disabled={busy || !customInput.trim()}>
              تلخيص الأخبار
            </button>
          </form>
        </section>
      </div>
    </ToolShell>
  );
}

function HeadlineRow({
  item,
  active,
  onSelect,
}: {
  item: NewsFeedItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" className={`nd-feed-item ${active ? "is-active" : ""}`} onClick={onSelect}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {item.breaking && <span className="nd-tag nd-tag-active">BREAKING</span>}
        <span className="nd-tag">{item.sources[0]?.name}</span>
        {item.sources.length > 1 && <span className="nd-tag">+{item.sources.length - 1}</span>}
      </div>
      <p className="text-start text-[15px] leading-6 text-[var(--nd-text-primary)]">{item.title}</p>
      <p className="nd-status-inline mt-2">{formatStamp(item.publishedAt)}</p>
    </button>
  );
}

function SummaryPane({
  data,
  copied,
  onCopy,
}: {
  data: NewsSummarizeData;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <ToolStatus tone="ready">[ READY ] ملخص جاهز</ToolStatus>
        <button type="button" className="nd-btn-secondary" onClick={onCopy}>
          {copied ? "تم النسخ" : "نسخ"}
        </button>
      </div>
      <h2 className="text-xl font-medium text-[var(--nd-text-display)]">{data.title}</h2>
      {data.dek && <p className="mt-2 text-sm text-[var(--nd-text-secondary)]">{data.dek}</p>}
      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-8">{data.summary}</p>
      {data.bullets.length > 0 && (
        <ul className="mt-5 list-disc space-y-2 ps-5 text-[15px] leading-7">
          {data.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      )}
      {data.sources.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="nd-label">SOURCES</p>
          {data.sources.map((source) => (
            <a
              key={`${source.name}-${source.url}`}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="block text-sm text-[var(--nd-interactive)] underline-offset-4 hover:underline"
            >
              {source.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

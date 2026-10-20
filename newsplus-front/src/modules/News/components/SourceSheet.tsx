import { Check, MagnifyingGlass, Newspaper } from "@phosphor-icons/react";
import { useState } from "react";
import type { NewsSource } from "@newsplus/shared";
import { Sheet } from "@/components/ui/Sheet";
import { SourceMark } from "../SourceMark";

export function SourceSheet({
  open,
  sources,
  selectedId,
  onClose,
  onSelect,
}: {
  open: boolean;
  sources: NewsSource[];
  selectedId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase();
  const matches = sources.filter((source) => source.name.toLocaleLowerCase().includes(needle));
  const choose = (id: string) => {
    onSelect(id);
    onClose();
    setQuery("");
  };

  return (
    <Sheet open={open} onClose={onClose} title="مصادر الأخبار" subtitle={`${sources.length} مصدر`} variant="center">
      <div className="input-wrap source-search">
        <MagnifyingGlass size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="source-search">ابحث باسم المصدر</label>
        <input id="source-search" className="input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم المصدر…" autoComplete="off" />
      </div>

      <button type="button" className={`source-option source-option--all ${selectedId === "all" ? "is-active" : ""}`} aria-pressed={selectedId === "all"} onClick={() => choose("all")}>
        <Newspaper size={22} aria-hidden="true" />
        <span>كل المصادر</span>
        {selectedId === "all" ? <Check size={18} weight="bold" aria-hidden="true" /> : null}
      </button>

      {(["ar", "en"] as const).map((language) => {
        const group = matches.filter((source) => source.language === language);
        if (group.length === 0) return null;
        return (
          <section key={language} className="source-group" aria-label={language === "ar" ? "مصادر عربية" : "مصادر إنجليزية"}>
            <h3>{language === "ar" ? "مصادر عربية" : "مصادر إنجليزية"} <bdi>{group.length}</bdi></h3>
            <div className="source-grid">
              {group.map((source) => (
                <button key={source.id} type="button" className={`source-option ${selectedId === source.id ? "is-active" : ""}`} aria-pressed={selectedId === source.id} onClick={() => choose(source.id)}>
                  <SourceMark id={source.id} name={source.name} size={28} />
                  <bdi lang={source.language}>{source.name}</bdi>
                  {selectedId === source.id ? <Check size={18} weight="bold" aria-hidden="true" /> : null}
                </button>
              ))}
            </div>
          </section>
        );
      })}
      {matches.length === 0 ? <p className="hint" role="status">لا توجد مصادر مطابقة.</p> : null}
    </Sheet>
  );
}

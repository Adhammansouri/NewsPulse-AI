import { Check, MagnifyingGlass, Newspaper, X } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";
import type { NewsSource } from "@newsplus/shared";
import { SourceMark } from "../SourceMark";

export function SourcePicker({ sources, selectedId, onSelect }: {
  sources: NewsSource[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialogId = useId();
  const titleId = useId();
  const searchId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    dialog.showModal();
    searchRef.current?.focus();
    return () => dialog.close();
  }, [open]);

  useEffect(() => {
    // Keep the selected source in view without scrolling the page or feed.
    const selected = selectedRef.current;
    const rail = selected?.parentElement;
    if (!selected || !rail) return;
    const buttonBox = selected.getBoundingClientRect();
    const railBox = rail.getBoundingClientRect();
    if (buttonBox.left < railBox.left || buttonBox.right > railBox.right) {
      rail.scrollBy({ left: buttonBox.left - railBox.left - (railBox.width - buttonBox.width) / 2 });
    }
  }, [selectedId]);

  const matchingSources = sources.filter((source) => source.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const choose = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <div className="newsroom-sources">
      <button type="button" className="newsroom-source-browse" aria-haspopup="dialog" aria-expanded={open} aria-controls={dialogId} onClick={() => { setQuery(""); setOpen(true); }}>
        <Newspaper size={18} aria-hidden="true" />
        المصادر <bdi className="newsroom-source-count">{sources.length}</bdi>
      </button>
      <div className="newsroom-source-rail" role="group" aria-label="تصفية المصدر">
        <button ref={selectedId === "all" ? selectedRef : undefined} type="button" className={`newsroom-source-chip ${selectedId === "all" ? "is-active" : ""}`} aria-pressed={selectedId === "all"} onClick={() => onSelect("all")}>كل المصادر</button>
        {sources.map((source) => (
          <button ref={selectedId === source.id ? selectedRef : undefined} key={source.id} type="button" data-source-id={source.id} className={`newsroom-source-chip ${selectedId === source.id ? "is-active" : ""}`} aria-pressed={selectedId === source.id} onClick={() => onSelect(source.id)}>
            <SourceMark id={source.id} name={source.name} size={24} />
            <bdi>{source.name}</bdi>
          </button>
        ))}
      </div>

      {open && <dialog ref={dialogRef} id={dialogId} className="newsroom-source-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); setOpen(false); }} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <div className="newsroom-source-sheet">
          <header className="newsroom-source-head">
            <div><h2 id={titleId}>اختر مصدر الأخبار</h2><p>{sources.length} مصدر متاح · الاختيار يطبّق مباشرة</p></div>
            <button type="button" className="news-icon-btn" aria-label="إغلاق المصادر" onClick={() => setOpen(false)}><X size={20} aria-hidden="true" /></button>
          </header>
          <label className="newsroom-source-search" htmlFor={searchId}>
            <MagnifyingGlass size={18} aria-hidden="true" />
            <span className="sr-only">بحث في المصادر</span>
            <input ref={searchRef} id={searchId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم المصدر…" autoComplete="off" />
          </label>
          <div className="newsroom-source-results">
            <button type="button" className={`newsroom-source-option newsroom-source-all ${selectedId === "all" ? "is-active" : ""}`} aria-pressed={selectedId === "all"} onClick={() => choose("all")}>
              <Newspaper size={24} aria-hidden="true" /><span>كل المصادر</span>{selectedId === "all" && <Check size={18} aria-hidden="true" />}
            </button>
            {(["ar", "en"] as const).map((language) => {
              const group = matchingSources.filter((source) => source.language === language);
              return group.length > 0 && <section key={language} className="newsroom-source-group" aria-label={language === "ar" ? "مصادر عربية" : "مصادر إنجليزية"}>
                <h3>{language === "ar" ? "مصادر عربية" : "مصادر إنجليزية"}<bdi>{group.length}</bdi></h3>
                <div className="newsroom-source-grid">
                  {group.map((source) => <button key={source.id} type="button" className={`newsroom-source-option ${selectedId === source.id ? "is-active" : ""}`} aria-pressed={selectedId === source.id} onClick={() => choose(source.id)}>
                    <SourceMark id={source.id} name={source.name} size={32} /><bdi lang={source.language}>{source.name}</bdi>{selectedId === source.id && <Check size={18} aria-hidden="true" />}
                  </button>)}
                </div>
              </section>;
            })}
            {matchingSources.length === 0 && <p className="newsroom-source-empty" role="status">لا توجد مصادر مطابقة لهذا البحث.</p>}
          </div>
        </div>
      </dialog>}
    </div>
  );
}

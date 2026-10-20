import { ArrowLeft, LinkSimple } from "@phosphor-icons/react";
import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Segmented } from "@/components/ui/Segmented";

type Mode = "brief" | "article" | "report" | "translate";

const MODES = [
  { id: "brief" as const, label: "ملخص" },
  { id: "article" as const, label: "مقال" },
  { id: "report" as const, label: "تقرير" },
  { id: "translate" as const, label: "ترجمة" },
];

const ACTION: Record<Mode, string> = {
  brief: "اكتب الملخص",
  article: "اكتب المقال",
  report: "اكتب التقرير",
  translate: "ترجم",
};

/** One box to start any job: paste a link or type a topic, pick what to do with it. */
export function CommandBar() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<Mode>("brief");
  const ref = useRef<HTMLTextAreaElement>(null);
  const text = value.trim();
  const isUrl = /^https?:\/\/\S+$/i.test(text);

  function go(event?: FormEvent) {
    event?.preventDefault();
    if (!text) {
      ref.current?.focus();
      return;
    }
    if (mode === "translate") navigate("/translate", { state: { source: text } });
    else navigate("/generate", { state: { prompt: text, source: "home", style: mode } });
  }

  return (
    <form className="command" onSubmit={go} aria-label="ابدأ مهمة جديدة">
      <label className="sr-only" htmlFor="command-input">رابط خبر أو موضوع</label>
      <div className="command-well">
        <LinkSimple size={22} className="command-icon" aria-hidden="true" />
        <textarea
          ref={ref}
          id="command-input"
          className="command-input"
          rows={2}
          value={value}
          dir="auto"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) go();
          }}
          placeholder="الصق رابط خبر أو اكتب موضوعاً تريد تغطيته…"
        />
      </div>
      <div className="command-bar">
        <Segmented value={mode} options={MODES} onChange={setMode} ariaLabel="نوع المهمة" size="sm" />
        <button type="submit" className="btn btn-primary command-go" disabled={!text}>
          {ACTION[mode]}
          <ArrowLeft size={18} weight="bold" aria-hidden="true" className="flip-rtl" />
        </button>
      </div>
      {isUrl && mode !== "translate" ? <p className="hint">سنقرأ الصفحة أولاً، وإن تعذّر فتحها نبحث عن الخبر بالرابط.</p> : null}
    </form>
  );
}

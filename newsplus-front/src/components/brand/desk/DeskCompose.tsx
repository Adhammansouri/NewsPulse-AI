import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export function DeskCompose() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const trimmed = value.trim();

  function go(path: "/news" | "/generate" | "/translate") {
    if (!trimmed) return;
    if (path === "/news") {
      navigate("/generate", { state: { prompt: trimmed, source: "news", style: "brief" } });
      return;
    }
    if (path === "/generate") {
      navigate("/generate", { state: { prompt: trimmed } });
      return;
    }
    navigate("/translate", { state: { source: trimmed } });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    go("/news");
  }

  return (
    <section className="brand-panel p-5 sm:p-6" aria-labelledby="desk-compose-title">
      <h2 id="desk-compose-title" className="brand-text-primary text-sm font-semibold">
        ابدأ من نص أو رابط
      </h2>
      <p className="brand-text-secondary mt-1 text-sm">لخّص خبراً، ولّد تقريراً، أو ترجم مباشرة.</p>

      <form className="mt-4" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="desk-compose">
          موضوع أو رابط
        </label>
        <textarea
          id="desk-compose"
          className="brand-text-primary w-full resize-y rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-3 text-sm leading-7 placeholder:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/30"
          rows={4}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="الصق رابطاً أو اكتب موضوعاً..."
          dir="auto"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="brand-btn" disabled={!trimmed}>
            لخّص
          </button>
          <button
            type="button"
            className="brand-header-ghost-btn"
            disabled={!trimmed}
            onClick={() => go("/generate")}
          >
            ولّد
          </button>
          <button
            type="button"
            className="brand-header-ghost-btn"
            disabled={!trimmed}
            onClick={() => go("/translate")}
          >
            ترجم
          </button>
        </div>
      </form>
    </section>
  );
}

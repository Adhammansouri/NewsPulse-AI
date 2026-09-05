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
    <section className="desk-compose" aria-labelledby="desk-compose-title">
      <h2 id="desk-compose-title" className="desk-compose__title">
        ابدأ من نص أو رابط
      </h2>

      <form onSubmit={onSubmit}>
        <div className="desk-compose__well">
          <label className="sr-only" htmlFor="desk-compose">
            موضوع أو رابط
          </label>
          <textarea
            id="desk-compose"
            className="desk-compose__field"
            rows={4}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="الصق رابطاً أو اكتب موضوعاً..."
            dir="auto"
          />
          <div className="desk-compose__bar">
            <button type="submit" className="brand-btn" disabled={!trimmed}>
              لخّص
            </button>
            <button type="button" className="desk-btn-ghost" disabled={!trimmed} onClick={() => go("/generate")}>
              ولّد
            </button>
            <button type="button" className="desk-btn-ghost" disabled={!trimmed} onClick={() => go("/translate")}>
              ترجم
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

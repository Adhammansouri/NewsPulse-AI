// S11 §2 · NewCmdK: the command palette (Ctrl/⌘ K). `scrim` + `palette` over the whole app: the query row, the
// listbox of «أفعال بالمحرّر» / «عناوين» / «انتقال», the footer. ↑/↓ move `aria-selected` (the focus stays in the
// field: `aria-activedescendant`), ↵ runs, Ctrl/⌘ ↵ the video script, Esc closes, hover selects. Headlines and
// drafts come from the wire's feed and the archive's list (the same cached queries). Inline styles are the board's own.
import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import type { NewsFeedItem } from "@newsplus/shared";
import { readKey, type GoPage } from "@/hooks/hotkeys";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { listEditorialConversations } from "@/services/editorialService";
import { cx } from "@/ui/cx";
import { Icon } from "@/ui/Icon";
import { Key } from "@/ui/Key";
import { Scrim } from "@/ui/Scrim";
import { useOverlay } from "@/ui/useOverlay";
import { buildPalette, moveActive, PALETTE_COPY, type PaletteModel, type PaletteOption, type PaletteRun } from "./commandModel";
import { SHELL_LAYER_STYLE } from "./shellOverlay";

const ICON_WRAP_STYLE: CSSProperties = { width: "30px", height: "30px", borderRadius: "9px" };
/** The board's query `span.grow` (weight 500) as a real field; the caret in the board's `--cyan-dot`. */
const INPUT_STYLE: CSSProperties = {
  fontWeight: 500,
  border: 0,
  outline: 0,
  background: "transparent",
  padding: 0,
  caretColor: "var(--cyan-dot)",
};
/** The palette keeps 84px under it too on short screens: the list scrolls instead of running off the screen. */
const LIST_STYLE: CSSProperties = { maxHeight: "calc(100dvh - 278px)", overflowY: "auto" };
const KEYS_STYLE: CSSProperties = { gap: "4px" };
const FOOT_ITEM_STYLE: CSSProperties = { gap: "6px" };

function optionId(base: string, index: number) {
  return `${base}-o${index}`;
}

/** The palette card (NewCmdK `div.palette`), without the layer and the scrim. */
export function PaletteView({
  query,
  model,
  active,
  baseId,
  inputRef,
  listRef,
  onQuery,
  onActive,
  onPick,
  onKeyDown,
  containerRef,
}: {
  query: string;
  model: PaletteModel;
  active: number;
  baseId: string;
  inputRef?: Ref<HTMLInputElement>;
  listRef?: Ref<HTMLDivElement>;
  onQuery: (value: string) => void;
  onActive: (index: number) => void;
  onPick: (option: PaletteOption) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  containerRef?: Ref<HTMLDivElement>;
}) {
  const listId = `${baseId}-list`;
  let index = -1;
  return (
    <div
      ref={containerRef}
      className="palette"
      role="dialog"
      aria-modal="true"
      aria-label={PALETTE_COPY.label}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      // A click anywhere but the field keeps the focus (and the caret) in the field.
      onMouseDown={(event) => {
        if (!(event.target instanceof HTMLInputElement)) event.preventDefault();
      }}
    >
      <div className="palette__input">
        <Icon name="search" size="lg" style={{ color: "var(--cyan)" }} />
        <input
          ref={inputRef}
          className="grow"
          type="text"
          role="combobox"
          aria-label={PALETTE_COPY.label}
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={model.options.length > 0 ? optionId(baseId, active) : undefined}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          style={INPUT_STYLE}
        />
        <Key>Esc</Key>
      </div>
      <div ref={listRef} id={listId} className="palette__group" role="listbox" aria-label={PALETTE_COPY.results} style={LIST_STYLE}>
        {model.groups.map((group) => {
          const labelId = `${baseId}-${group.key}`;
          return (
            <div key={group.key} role="group" aria-labelledby={labelId}>
              <div id={labelId} className="palette__label">
                {group.label}
              </div>
              {group.options.map((option) => {
                index += 1;
                const at = index;
                return (
                  <div
                    key={option.key}
                    id={optionId(baseId, at)}
                    className="palette__item"
                    role="option"
                    aria-selected={at === active}
                    aria-disabled={option.disabled || undefined}
                    onPointerMove={() => onActive(at)}
                    onClick={() => onPick(option)}
                  >
                    <span className={cx("ic-wrap", option.ai && "ic-wrap--ai")} style={ICON_WRAP_STYLE}>
                      <Icon name={option.icon} size="sm" />
                    </span>
                    <span className="col grow">
                      {/* One line per row, as NewCmdK: long real headlines end in an ellipsis. */}
                      <span className="ellipsis" style={{ fontWeight: 600 }} dir={option.dir}>
                        {option.title.map((segment, i) =>
                          segment.mark ? <mark key={i}>{segment.text}</mark> : <Fragment key={i}>{segment.text}</Fragment>,
                        )}
                      </span>
                      {option.meta && <span className="t-meta">{option.meta}</span>}
                    </span>
                    {option.keys ? (
                      <span className="row" dir="ltr" style={KEYS_STYLE}>
                        {option.keys.map((key) => (
                          <Key key={key}>{key}</Key>
                        ))}
                      </span>
                    ) : (
                      <span className="row" style={KEYS_STYLE} />
                    )}
                  </div>
                );
              })}
              {/* «مفيش نتائج لـ «…»» right after the actions; «انتقال» still follows it. */}
              {group.key === "actions" && model.noResults && (
                <p className="t-meta" aria-live="polite" style={{ padding: "8px 10px" }}>
                  {model.noResults}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="palette__foot">
        <span className="row" style={FOOT_ITEM_STYLE}>
          <Key>↑</Key>
          <Key>↓</Key>
          {PALETTE_COPY.navigate}
        </span>
        <span className="row" style={FOOT_ITEM_STYLE}>
          <Key>↵</Key>
          {PALETTE_COPY.run}
        </span>
        <span className="grow" />
        <span className="row" style={FOOT_ITEM_STYLE}>
          <Key>?</Key>
          {PALETTE_COPY.allShortcuts}
        </span>
      </div>
    </div>
  );
}

/**
 * The command palette, open. `story` is the newsroom's open story (none off /news); `onRun` carries out a picked
 * option once the palette has closed.
 */
export function CommandPalette({
  story,
  pages,
  aiBlocked,
  onClose,
  onRun,
}: {
  story: NewsFeedItem | null;
  pages: readonly GoPage[];
  aiBlocked: boolean;
  onClose: () => void;
  onRun: (run: PaletteRun) => void;
}) {
  const baseId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [now] = useState(() => new Date());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  useOverlay({ open: true, onClose, containerRef, initialFocusRef: inputRef, modal: true });

  const feedQuery = useNewsFeed("all", "");
  // The archive drawer's unfiltered list (and the wire's «مسودة جاهزة» badge): the same cache entry.
  const draftsQuery = useQuery({ queryKey: ["editorial-conversations", ""], queryFn: () => listEditorialConversations("") });

  const model = useMemo(
    () =>
      buildPalette({
        query,
        story,
        feed: feedQuery.data?.items ?? [],
        drafts: draftsQuery.data?.items ?? [],
        pages,
        now,
        aiBlocked,
      }),
    [query, story, feedQuery.data, draftsQuery.data, pages, now, aiBlocked],
  );
  const count = model.options.length;
  const current = Math.min(active, Math.max(0, count - 1));

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [current, count]);

  function pick(option: PaletteOption | undefined) {
    if (!option || option.disabled) return;
    onRun(option.run);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive(moveActive(current, count, event.key === "ArrowDown" ? 1 : -1));
      return;
    }
    const combo = readKey(event.nativeEvent);
    if (!combo || combo.alt) return;
    if (combo.key === "Enter" && !combo.shift) {
      // The palette's own ↵: the screen behind (the studio's / generate's Ctrl ↵) must not hear it.
      event.preventDefault();
      event.stopPropagation();
      if (event.repeat) return;
      if (combo.mod) pick(model.options.find((option) => option.run.type === "write" && option.run.format === "video"));
      else pick(model.options[current]);
      return;
    }
    if (combo.mod && combo.key === "K") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  }

  const root = document.querySelector<HTMLElement>("div.np");
  if (!root) return null;
  return createPortal(
    <div style={SHELL_LAYER_STYLE}>
      <Scrim onClick={onClose} />
      <PaletteView
        query={query}
        model={model}
        active={current}
        baseId={baseId}
        inputRef={inputRef}
        listRef={listRef}
        containerRef={containerRef}
        onQuery={(value) => {
          setQuery(value);
          setActive(0);
        }}
        onActive={setActive}
        onPick={pick}
        onKeyDown={onKeyDown}
      />
    </div>,
    root,
  );
}

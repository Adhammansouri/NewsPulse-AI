// S11 keyboard shortcuts, the pure part: reading a key press, the typing guard, and the keymap with its two-key
// sequences (`F 1`, `G H`). No DOM or React here, so scripts/check-hotkeys.mjs runs it in node. useHotkeys.ts
// wires it to the window.

/** A key press, layout-independent: letters upper-cased (`J`), digits, `/`, `?`, and named keys (`Enter`). */
export type KeyCombo = {
  key: string;
  /** Ctrl or ⌘. */
  mod: boolean;
  shift: boolean;
  alt: boolean;
};

/** The fields of a KeyboardEvent the reader needs (plain objects in the tests). */
export type KeyLike = {
  key: string;
  code?: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

const NAMED_KEYS = new Set(["Enter", "Escape", "ArrowUp", "ArrowDown"]);

/**
 * The press as a combo, or null for keys no shortcut uses. The character comes first (`event.key`), so `?` and `/`
 * work on any Latin layout; on the Arabic layout (`ت` on the J key, `؟`, `١`) the physical key (`event.code`)
 * stands in, so the shortcuts work without switching the keyboard to English.
 */
export function readKey(event: KeyLike): KeyCombo | null {
  const base = { mod: event.ctrlKey || event.metaKey, shift: event.shiftKey, alt: event.altKey };
  const key = event.key;
  if (key === "Esc") return { key: "Escape", ...base };
  if (NAMED_KEYS.has(key)) return { key, ...base };
  if (key === "؟") return { key: "?", ...base };
  if (key.length === 1 && key >= "!" && key <= "~") return { key: key.toUpperCase(), ...base };
  const code = event.code ?? "";
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter) return { key: letter[1], ...base };
  const digit = /^(?:Digit|Numpad)([0-9])$/.exec(code);
  if (digit) return { key: digit[1], ...base };
  if (code === "Slash") return { key: event.shiftKey ? "?" : "/", ...base };
  return null;
}

/** Element fields the guards read (an HTMLElement in the app, a plain object in the tests). */
export type TargetLike = {
  tagName?: string;
  type?: string;
  isContentEditable?: boolean;
  getAttribute?: (name: string) => string | null;
  hasAttribute?: (name: string) => boolean;
};

/** Inputs that take no typing: a letter pressed on them is still a shortcut. */
const NON_TEXT_INPUTS = new Set(["checkbox", "radio", "button", "submit", "reset", "range", "color", "file", "image", "hidden"]);

/** Focus is in a field being typed in (input, textarea, select, contenteditable): shortcuts stand down. */
export function isTypingTarget(target: TargetLike | null | undefined): boolean {
  if (!target || typeof target.tagName !== "string") return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName.toUpperCase();
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") return !NON_TEXT_INPUTS.has((target.type ?? "text").toLowerCase());
  return false;
}

/** While typing, only these still work (S11 §1): Esc, Ctrl/⌘ K, Ctrl/⌘ Enter. */
export function allowedWhileTyping(combo: KeyCombo): boolean {
  if (combo.key === "Escape") return true;
  return combo.mod && !combo.alt && (combo.key === "K" || combo.key === "Enter");
}

const ACTIVATION_ROLES = new Set([
  "button",
  "link",
  "option",
  "tab",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "checkbox",
  "radio",
  "switch",
  "combobox",
  "treeitem",
  "gridcell",
]);

/** Enter already does something on this element (a button, a link, an option…): `↵` leaves it to the element. */
export function isActivationTarget(target: TargetLike | null | undefined): boolean {
  if (!target || typeof target.tagName !== "string") return false;
  const tag = target.tagName.toUpperCase();
  if (tag === "BUTTON" || tag === "SUMMARY" || tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return true;
  if (tag === "A" && target.hasAttribute?.("href")) return true;
  if (target.isContentEditable) return true;
  const role = target.getAttribute?.("role");
  return role ? ACTIVATION_ROLES.has(role) : false;
}

/* ---------- Keymap ---------- */

/** The pages of `G` then `H`/`N`/`W`/`A` (and `U`, the usage page as NewCmdK draws it). */
export type GoPage = "home" | "news" | "workflow" | "archive" | "usage";

export const GO_KEYS: Readonly<Record<string, GoPage>> = { H: "home", N: "news", W: "workflow", A: "archive", U: "usage" };

export type HotkeyAction =
  | { type: "palette" }
  | { type: "search" }
  | { type: "shortcuts" }
  | { type: "theme" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "open" }
  | { type: "briefing" }
  /** 1–5: الكل · ٢٠ د · ساعة · ٣ س · اليوم. */
  | { type: "time"; index: number }
  /** F then 1–7: the deck order (منشور · فيديو · كاروسيل · مكتبي · نشرة · حقائق · سياق). */
  | { type: "format"; index: number }
  | { type: "copyAll" }
  | { type: "publish" }
  | { type: "go"; page: GoPage };

/** The first key of a sequence, and when it was pressed. */
export type SequenceState = { prefix: "F" | "G"; at: number } | null;

/** S11 §1: a sequence's second key must follow within a second. */
export const SEQUENCE_TIMEOUT_MS = 1000;

export const TIME_KEYS = 5;
export const FORMAT_KEYS = 7;

export type Resolution = {
  action: HotkeyAction | null;
  /** The sequence after this press. */
  state: SequenceState;
  /** The press belongs to the keymap (an action, or a sequence's first key): its default is prevented. */
  consumed: boolean;
};

const NONE = (state: SequenceState = null): Resolution => ({ action: null, state, consumed: false });
const ACT = (action: HotkeyAction): Resolution => ({ action, state: null, consumed: true });

function digit(key: string, max: number): number | null {
  if (key.length !== 1 || key < "1" || key > "9") return null;
  const value = Number(key);
  return value <= max ? value : null;
}

/** A press on its own (no sequence pending). */
function single(combo: KeyCombo, now: number): Resolution {
  const { key } = combo;
  if (combo.mod) return key === "K" && !combo.shift ? ACT({ type: "palette" }) : NONE();
  // `?` and `/` are typed with Shift on some layouts: Shift only counts for letters.
  if (key === "?") return ACT({ type: "shortcuts" });
  if (key === "/") return ACT({ type: "search" });
  if (/^[A-Z]$/.test(key) && combo.shift) return key === "D" ? ACT({ type: "theme" }) : NONE();
  const time = digit(key, TIME_KEYS);
  if (time !== null) return ACT({ type: "time", index: time });
  switch (key) {
    case "J":
      return ACT({ type: "next" });
    case "K":
      return ACT({ type: "prev" });
    case "Enter":
      return combo.shift ? NONE() : ACT({ type: "open" });
    case "B":
      return ACT({ type: "briefing" });
    case "C":
      return ACT({ type: "copyAll" });
    case "P":
      return ACT({ type: "publish" });
    case "F":
    case "G":
      return { action: null, state: { prefix: key, at: now }, consumed: true };
    default:
      return NONE();
  }
}

/**
 * The keymap of S11 §1. `state` is the pending sequence; a second key after the timeout, or one that does not
 * complete the sequence, is read as a press on its own.
 */
export function resolveHotkey(combo: KeyCombo, state: SequenceState, now: number): Resolution {
  if (combo.alt) return NONE();
  const pending = state && now - state.at <= SEQUENCE_TIMEOUT_MS ? state : null;
  if (pending && combo.key === "Escape") return { action: null, state: null, consumed: true };
  if (pending && !combo.mod && !combo.shift) {
    if (pending.prefix === "F") {
      const index = digit(combo.key, FORMAT_KEYS);
      if (index !== null) return ACT({ type: "format", index });
    } else {
      const page = GO_KEYS[combo.key];
      if (page) return ACT({ type: "go", page });
    }
  }
  return single(combo, now);
}

/** Holding J / K walks the headlines; every other shortcut fires once per press. */
export function repeats(action: HotkeyAction): boolean {
  return action.type === "next" || action.type === "prev";
}

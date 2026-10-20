export type Theme = "light" | "dark";

const THEME_KEY = "newsplus-theme";
const LEGACY_THEME_KEY = "newsplus-login-theme";
const THEME_EVENT = "newsplus-theme-changed";

const THEME_COLORS: Record<Theme, string> = {
  light: "#F3F5F8",
  dark: "#0A1220",
};

function parseTheme(value: string | null): Theme | null {
  if (value === "dark" || value === "light") return value;
  return null;
}

function migrateLegacyTheme(): Theme | null {
  try {
    const legacy = localStorage.getItem(LEGACY_THEME_KEY);
    const parsed = parseTheme(legacy);
    if (!parsed) return null;
    localStorage.setItem(THEME_KEY, parsed);
    localStorage.removeItem(LEGACY_THEME_KEY);
    return parsed;
  } catch {
    return null;
  }
}

export function getTheme(): Theme {
  try {
    const stored = parseTheme(localStorage.getItem(THEME_KEY));
    if (stored) return stored;
    const migrated = migrateLegacyTheme();
    if (migrated) return migrated;
  } catch {
    /* private mode */
  }
  return "light";
}

export function applyThemeToDocument(theme: Theme) {
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  html.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEME_COLORS[theme]);
  }
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode */
  }
  applyThemeToDocument(theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function subscribeToTheme(listener: () => void) {
  window.addEventListener(THEME_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(THEME_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function runThemeTransition(update: () => void) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };

  if (prefersReduced || typeof doc.startViewTransition !== "function") {
    update();
    return;
  }

  document.documentElement.classList.add("np-theme-transition");
  const transition = doc.startViewTransition(update);
  void transition.finished.finally(() => {
    document.documentElement.classList.remove("np-theme-transition");
  });
}

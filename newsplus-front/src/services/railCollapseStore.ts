const RAIL_COLLAPSED_KEY = "newsplus-rail-collapsed";
const RAIL_COLLAPSE_EVENT = "newsplus-rail-collapse-changed";

export function getRailCollapsed(): boolean {
  try {
    return localStorage.getItem(RAIL_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setRailCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(RAIL_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent(RAIL_COLLAPSE_EVENT, { detail: { collapsed } }));
}

export function subscribeRailCollapsed(onChange: (collapsed: boolean) => void): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ collapsed: boolean }>).detail;
    onChange(detail?.collapsed ?? getRailCollapsed());
  };
  window.addEventListener(RAIL_COLLAPSE_EVENT, handler);
  return () => window.removeEventListener(RAIL_COLLAPSE_EVENT, handler);
}

import type { QueryKey } from "@tanstack/react-query";

/** Mobile screens that keep the tab bar (S02 §1). Detail screens (story, draft, archive, notifications, usage…) hide it. */
const TAB_SCREENS = ["/", "/news", "/generate", "/translate", "/more", "/board"] as const;

export function isTabScreen(pathname: string): boolean {
  return (TAB_SCREENS as readonly string[]).includes(pathname);
}

/** `/` matches only itself; every other section also matches its sub-paths (`/news/…`). */
export function isSectionActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

/**
 * The query whose first load keeps the route bar up after the page chunk arrived (S02 §8):
 * the headlines for Home and News, the usage report for Usage. Other pages render without data.
 */
const PRIMARY_QUERY: ReadonlyArray<readonly [path: string, key: QueryKey]> = [
  ["/", ["news-feed"]],
  ["/news", ["news-feed"]],
  ["/usage", ["openai-usage"]],
];

export function primaryQueryKey(pathname: string): QueryKey | undefined {
  return PRIMARY_QUERY.find(([path]) => isSectionActive(pathname, path))?.[1];
}

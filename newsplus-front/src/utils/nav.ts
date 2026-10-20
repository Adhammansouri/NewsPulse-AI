import type { Icon } from "@phosphor-icons/react";
import { ChartBar, House, Newspaper, PencilSimple, Translate } from "@phosphor-icons/react";

export type NavItem = {
  href: string;
  label: string;
  /** short label for the bottom tab bar */
  short: string;
  icon: Icon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "المكتب", short: "المكتب", icon: House },
  { href: "/news", label: "غرفة الأخبار", short: "الأخبار", icon: Newspaper },
  { href: "/generate", label: "توليد", short: "توليد", icon: PencilSimple },
  { href: "/translate", label: "ترجمة", short: "ترجمة", icon: Translate },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/usage", label: "استهلاك الذكاء الاصطناعي", short: "الاستهلاك", icon: ChartBar },
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function titleForPath(pathname: string) {
  const all = [...NAV_ITEMS, ...SECONDARY_NAV, { href: "/notifications", label: "الإشعارات", short: "الإشعارات", icon: House }];
  return all.find((item) => isActivePath(pathname, item.href))?.label ?? "Newsplus";
}

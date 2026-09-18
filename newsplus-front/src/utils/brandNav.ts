import type { Icon } from "@phosphor-icons/react";
import { House, Newspaper, PencilSimple, Translate } from "@phosphor-icons/react";

export function isActiveNavPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export const BRAND_NAV_ICONS: Record<string, Icon> = {
  "/": House,
  "/news": Newspaper,
  "/generate": PencilSimple,
  "/translate": Translate,
};

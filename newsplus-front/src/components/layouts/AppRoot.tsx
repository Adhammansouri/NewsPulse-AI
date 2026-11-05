import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTheme } from "@/hooks/useTheme";
import { AiGradientDefs } from "@/ui/AiGradientDefs";
import { ToastProvider } from "@/ui/Toast";

type AppRootProps = { children?: ReactNode };

/**
 * Pulse root (GLOBAL-RULES §3, §6): `<div class="np [m]" data-theme>` around every route.
 * The design tokens and resets in src/styles/design are scoped to `.np`; `m` switches to the mobile layer below 1024px.
 */
export default function AppRoot({ children }: AppRootProps) {
  const { theme } = useTheme();
  const isMobile = useIsMobile();

  return (
    <div className={"np" + (isMobile ? " m" : "")} data-theme={theme}>
      <AiGradientDefs theme={theme} />
      <ToastProvider>{children ?? <Outlet />}</ToastProvider>
    </div>
  );
}

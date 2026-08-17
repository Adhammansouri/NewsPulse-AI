import { useTheme } from "@/hooks/useTheme";

type ThemeToggleProps = {
  className?: string;
  variant?: "header" | "login";
};

function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <circle cx="12" cy="12" r="3.75" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.55 1.55M17.75 17.75l1.55 1.55M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.55-1.55M17.75 6.25l1.55-1.55" />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M20.4 14.2A8.2 8.2 0 1 1 9.8 3.6 6.7 6.7 0 0 0 20.4 14.2z" />
    </svg>
  );
}

function ThemeToggleIcons({
  isDark,
  variant,
}: {
  isDark: boolean;
  variant: "header" | "login";
}) {
  const wrapClass = variant === "login" ? "np-login__theme-icon-wrap" : "theme-toggle__icon-wrap";
  const iconClass = variant === "login" ? "np-login__theme-icon" : "theme-toggle__icon";
  const layerClass = variant === "login" ? "np-login__theme-icon-layer" : "theme-toggle__icon-layer";

  return (
    <span className={wrapClass} aria-hidden="true">
      <IconMoon className={`${iconClass} ${layerClass}${isDark ? "" : " is-active"}`} />
      <IconSun className={`${iconClass} ${layerClass}${isDark ? " is-active" : ""}`} />
    </span>
  );
}

export function ThemeToggle({ className, variant = "header" }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن";

  const buttonClass =
    className ??
    (variant === "login" ? "np-login__chrome-btn np-login__theme-toggle" : "brand-header-icon-btn");

  return (
    <button
      type="button"
      className={buttonClass}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
    >
      <ThemeToggleIcons isDark={isDark} variant={variant} />
    </button>
  );
}

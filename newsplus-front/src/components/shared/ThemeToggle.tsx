import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle({ className = "icon-btn", withLabel = false }: { className?: string; withLabel?: boolean }) {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "الوضع الفاتح" : "الوضع الداكن";
  return (
    <button type="button" className={className} onClick={toggleTheme} aria-label={label} title={label} aria-pressed={isDark}>
      <span className="theme-icon" data-dark={isDark ? "true" : "false"} aria-hidden="true">
        <Moon size={20} weight="bold" className="theme-icon-moon" />
        <Sun size={20} weight="bold" className="theme-icon-sun" />
      </span>
      {withLabel ? <span>{label}</span> : null}
    </button>
  );
}

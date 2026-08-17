import { useCallback, useSyncExternalStore } from "react";
import {
  getTheme,
  runThemeTransition,
  setTheme,
  subscribeToTheme,
  toggleTheme,
  type Theme,
} from "@/services/themeStore";

export function useTheme() {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, () => "light" as Theme);

  const applyTheme = useCallback((next: Theme) => {
    runThemeTransition(() => setTheme(next));
  }, []);

  const toggle = useCallback(() => {
    runThemeTransition(() => {
      toggleTheme();
    });
  }, []);

  return {
    theme,
    isDark: theme === "dark",
    setTheme: applyTheme,
    toggleTheme: toggle,
  };
}

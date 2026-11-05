import type { RefObject } from "react";
import type { Theme } from "@/services/themeStore";
import type { LoginLocale } from "../copy";
import type { LoginForm } from "../useLoginForm";

export type LoginView = "login" | "forgot";

/** What LoginPage hands to the DeskLogin / MobLogin layouts. */
export type LoginLayoutProps = {
  locale: LoginLocale;
  theme: Theme;
  isDark: boolean;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  form: LoginForm;
  view: LoginView;
  onForgot: () => void;
  onBack: () => void;
  /** `VITE_ADMIN_EMAIL`; empty → the forgot view has no address and no «راسل المسؤول». */
  adminEmail: string;
  /** «نسيت كلمة المرور؟» — focus returns here from the forgot view. */
  forgotTriggerRef: RefObject<HTMLElement | null>;
  /** First action of the forgot view — focused when it opens. */
  forgotFocusRef: RefObject<HTMLElement | null>;
};

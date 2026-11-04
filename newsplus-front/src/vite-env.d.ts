/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  /** System admin address behind «راسل المسؤول» (`mailto:`) on the login screen's forgot-password view. */
  readonly VITE_ADMIN_EMAIL?: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}

interface Navigator {
  standalone?: boolean;
}

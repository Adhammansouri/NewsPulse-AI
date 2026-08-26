const INSTALL_DISMISS_KEY = "newsplus-pwa-install-dismissed";
const IOS_HINT_DISMISS_KEY = "newsplus-pwa-ios-hint-dismissed";

export function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    window.navigator.standalone === true
  );
}

export function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function isIosSafari() {
  const ua = window.navigator.userAgent;
  if (!isIosDevice()) return false;
  const isSafari = /safari/i.test(ua);
  const isOther = /crios|fxios|edgios|opr\//i.test(ua);
  return isSafari && !isOther;
}

export function canUseWebPush() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function readDismissed(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeDismissed(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* private mode */
  }
}

export { INSTALL_DISMISS_KEY, IOS_HINT_DISMISS_KEY };

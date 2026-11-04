import type { usePushNotifications } from "@/hooks/usePushNotifications";
import type { CalloutId, NotifView } from "../notificationsModel";

/** The button whose request is in flight (it shows the busy state). */
export type NotifAction = "enable" | "disable" | "test" | "check";

export type NotificationsScreenProps = {
  push: ReturnType<typeof usePushNotifications>;
  /** The first status check finished. */
  checked: boolean;
  view: NotifView;
  /** The callout matching the hook status (blocked / iPhone install / unsupported / server key). */
  callout: CalloutId | null;
  /** Desktop device line. */
  heroSub: string;
  /** Mobile hero line while on. */
  mobileOnLine: string;
  /** «وصل إشعار التجربة …» after a delivered test push. */
  testLine: string | null;
  /** Real headline for the «شكل الإشعار» preview; the preview is hidden while there is none. */
  previewText: string | null;
  action: NotifAction | null;
  /** The switch can act: idle (turns on) or subscribed (turns off). */
  canToggle: boolean;
  /** «فعّل الإشعارات» can act (status idle). */
  canEnable: boolean;
  onToggle: (next: boolean) => void;
  onEnable: () => void;
  onDisable: () => void;
  onTest: () => void;
  onCheck: () => void;
};

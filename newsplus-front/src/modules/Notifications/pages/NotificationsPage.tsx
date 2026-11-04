// Notifications (S09 §A): `usePushNotifications` mapped to DeskNotifications / MobNotif and their states.
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNow } from "@/hooks/useNow";
import { getNewsFeed } from "@/services/newsService";
import { isStandaloneDisplay } from "@/services/pwaDetect";
import { DeskNotifications } from "../components/DeskNotifications";
import { MobNotifications } from "../components/MobNotifications";
import type { NotifAction, NotificationsScreenProps } from "../components/screenProps";
import { detectDevice } from "../device";
import { activeCallout, deviceLine, mobileOnLine, notifView, previewHeadline, testResultLine } from "../notificationsModel";

/** The unfiltered wire query (`useNewsFeed()`'s key), read here for the preview headline without polling. */
const FEED_KEY = ["news-feed", "all", ""] as const;

export default function NotificationsPage() {
  const isMobile = useIsMobile();
  const push = usePushNotifications();
  const now = useNow();
  const feed = useQuery({ queryKey: FEED_KEY, queryFn: () => getNewsFeed("all"), staleTime: 60_000 });
  const device = useMemo(detectDevice, []);
  const [action, setAction] = useState<NotifAction | null>(null);

  function run(name: NotifAction, task: () => Promise<unknown>) {
    setAction(name);
    void task().finally(() => setAction(null));
  }

  const view = notifView(push);
  const status = push.status;
  const props: NotificationsScreenProps = {
    push,
    checked: push.checked,
    view,
    callout: activeCallout(status),
    heroSub: deviceLine(push, view, device, now),
    mobileOnLine: mobileOnLine(device, isStandaloneDisplay()),
    testLine: testResultLine(push.lastTestAt, push.lastTestSent, now),
    previewText: previewHeadline(feed.data?.items),
    action,
    canToggle: status === "idle" || status === "subscribed",
    canEnable: status === "idle",
    onToggle: (next) => run(next ? "enable" : "disable", next ? push.enable : push.disable),
    onEnable: () => run("enable", push.enable),
    onDisable: () => run("disable", push.disable),
    onTest: () => run("test", push.sendTest),
    onCheck: () => run("check", push.refresh),
  };

  return isMobile ? <MobNotifications {...props} /> : <DeskNotifications {...props} />;
}

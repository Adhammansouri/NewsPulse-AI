import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Notice } from "@/components/ui/Notice";
import { NotificationsActions } from "../components/NotificationsActions";
import { NotificationsStatus } from "../components/NotificationsStatus";
import "../notifications.css";

export default function NotificationsPage() {
  const { status, permission, vapidConfigured, hasSubscription, lastTestSent, error, enable, disable, sendTest } = usePushNotifications();

  return (
    <div className="page page--narrow page-enter">
      <header className="page-head">
        <h1 className="page-title">الإشعارات</h1>
        <p className="page-lede">تنبيهات المتصفح لهذا الجهاز. لا يوجد صندوق وارد بعد، ما تراه هنا هو حالة الاشتراك الفعلية.</p>
      </header>

      <div className="settings-stack">
        {status === "ios_needs_install" ? (
          <Notice tone="info" title="ثبّت التطبيق على iOS أولاً">
            من زر المشاركة اختر «إضافة إلى الشاشة الرئيسية»، ثم افتح Newsplus من الأيقونة وليس من Safari.
          </Notice>
        ) : null}
        {status === "blocked" ? (
          <Notice tone="warn" title="الإذن محظور في المتصفح">
            افتح إعدادات الموقع لهذا النطاق وامسح حظر الإشعارات، ثم أعد تحميل الصفحة.
          </Notice>
        ) : null}
        {status === "unsupported" ? (
          <Notice tone="warn" title="المتصفح لا يدعم الإشعارات">
            هذا الجهاز أو المتصفح لا يوفّر Service Worker وPush وNotification معاً. جرّب متصفحاً آخر.
          </Notice>
        ) : null}
        {status === "vapid_off" ? (
          <Notice tone="warn" title="الخادم غير مُعدّ للإرسال">
            مفتاح VAPID غير مُعدّ على الواجهة الخلفية. اطلب من المسؤول ضبطه.
          </Notice>
        ) : null}

        <NotificationsActions
          status={status}
          lastTestSent={lastTestSent}
          error={error}
          onEnable={() => void enable()}
          onDisable={() => void disable()}
          onSendTest={() => void sendTest()}
        />
        <NotificationsStatus status={status} permission={permission} vapidConfigured={vapidConfigured} hasSubscription={hasSubscription} />
      </div>
    </div>
  );
}

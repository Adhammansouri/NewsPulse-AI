import { NotificationsActions } from "@/modules/Notifications/components/NotificationsActions";
import { NotificationsStatus } from "@/modules/Notifications/components/NotificationsStatus";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function NotificationsPage() {
  const { status, permission, vapidConfigured, hasSubscription, lastTestSent, error, enable, disable, sendTest } =
    usePushNotifications();

  return (
    <div className="notifications-page">
      <header className="desk-masthead">
        <p className="desk-masthead__date">إعدادات الجهاز</p>
        <h1 className="desk-masthead__hello">الإشعارات</h1>
        <p className="desk-masthead__line">
          إدارة تنبيهات المتصفح لهذا الجهاز. لا يوجد صندوق وارد بعد — ما يظهر هنا هو الاشتراك الفعلي فقط.
        </p>
      </header>

      {status === "ios_needs_install" ? (
        <aside className="notifications-callout" role="note">
          <p className="notifications-callout__title">يلزم التثبيت على iOS</p>
          <p className="notifications-callout__text">
            شارك ← إضافة إلى الشاشة الرئيسية. الإشعارات تعمل بعد فتح التطبيق من الأيقونة، وليس من Safari.
          </p>
        </aside>
      ) : null}

      {status === "blocked" ? (
        <aside className="notifications-callout notifications-callout--warn" role="note">
          <p className="notifications-callout__title">الإذن محظور في المتصفح</p>
          <p className="notifications-callout__text">
            افتح إعدادات الموقع لهذا النطاق وامسح حظر الإشعارات، ثم أعد تحميل الصفحة.
          </p>
        </aside>
      ) : null}

      {status === "unsupported" ? (
        <aside className="notifications-callout notifications-callout--warn" role="note">
          <p className="notifications-callout__title">المتصفح لا يدعم الدفع</p>
          <p className="notifications-callout__text">
            هذا الجهاز أو هذا المتصفح لا يوفّر Service Worker وPush وNotification معاً.
          </p>
        </aside>
      ) : null}

      {status === "vapid_off" ? (
        <aside className="notifications-callout notifications-callout--warn" role="note">
          <p className="notifications-callout__title">الخادم غير مُعدّ للإرسال</p>
          <p className="notifications-callout__text">مفتاح VAPID غير مُعدّ على الواجهة الخلفية حالياً.</p>
        </aside>
      ) : null}

      <NotificationsStatus
        status={status}
        permission={permission}
        vapidConfigured={vapidConfigured}
        hasSubscription={hasSubscription}
      />

      <NotificationsActions
        status={status}
        lastTestSent={lastTestSent}
        error={error}
        onEnable={() => void enable()}
        onDisable={() => void disable()}
        onSendTest={() => void sendTest()}
      />
    </div>
  );
}

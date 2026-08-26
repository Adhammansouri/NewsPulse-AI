import type {
  ApiSuccessResponse,
  PushSubscribeData,
  PushSubscribeRequest,
  PushTestData,
  PushUnsubscribeData,
  PushUnsubscribeRequest,
  PushVapidKeyData,
} from "@newsplus/shared";
import { apiRequest } from "./httpConfig";
import { API_URLS } from "./urls";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function getVapidKey(): Promise<PushVapidKeyData> {
  const response = await apiRequest<ApiSuccessResponse<PushVapidKeyData>>(API_URLS.PUSH.VAPID_KEY, {
    auth: true,
  });
  return response.data;
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const vapid = await getVapidKey();
  if (!vapid.configured || !vapid.publicKey) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
    }));

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error("invalid-push-subscription");
  }

  const body: PushSubscribeRequest = {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  };

  await apiRequest<ApiSuccessResponse<PushSubscribeData>>(API_URLS.PUSH.SUBSCRIBE, {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });

  await apiRequest<ApiSuccessResponse<PushTestData>>(API_URLS.PUSH.TEST, {
    method: "POST",
    auth: true,
  });

  return subscription;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const body: PushUnsubscribeRequest = { endpoint: subscription.endpoint };
  try {
    await apiRequest<ApiSuccessResponse<PushUnsubscribeData>>(API_URLS.PUSH.SUBSCRIBE, {
      method: "DELETE",
      auth: true,
      body: JSON.stringify(body),
    });
  } catch {
    /* still drop the browser subscription */
  }
  await subscription.unsubscribe();
}

export async function getExistingPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/// <reference lib="webworker" />
/// <reference types="vite-plugin-pwa/client" />

import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  matchPrecache,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute, setCatchHandler } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkOnly(),
);

registerRoute(
  ({ request }) => request.headers.has("Authorization"),
  new NetworkOnly(),
);

registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api\//, /\/offline\.html$/],
  }),
);

setCatchHandler(async ({ request }) => {
  if (request.destination === "document") {
    const offline = await matchPrecache("/offline.html");
    if (offline) return offline;
  }
  return Response.error();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

type PushPayload = {
  title?: string;
  body?: string;
  url?: string;
};

self.addEventListener("push", (event) => {
  let payload: PushPayload = {};
  try {
    payload = event.data ? (event.data.json() as PushPayload) : {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title ?? "Newsplus";
  const options: NotificationOptions = {
    body: payload.body ?? "",
    icon: "/pwa/pwa-192x192.png",
    badge: "/pwa/pwa-192x192.png",
    data: { url: payload.url ?? "/" },
    lang: "ar",
    dir: "rtl",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetPath = typeof event.notification.data?.url === "string" ? event.notification.data.url : "/";
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(targetUrl);
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});

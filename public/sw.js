/* Service Worker for web push notifications. */

self.addEventListener("push", (event) => {
  let data = { title: "Хочу также", body: "", url: "/" };
  try {
    const parsed = event.data ? event.data.json() : {};
    data = { ...data, ...parsed };
  } catch {
    // Non-JSON payload: fall back to defaults.
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("focus" in client && client.url.startsWith(self.location.origin)) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});

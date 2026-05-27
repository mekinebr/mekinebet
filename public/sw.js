self.addEventListener("install", () => {
  console.log("SW instalado");
});

self.addEventListener("activate", () => {
  console.log("SW ativo");
});

self.addEventListener("push", (event) => {
  const data = event.data.json();

  self.registration.showNotification(
    data.title,
    {
      body: data.body,
      icon: "/logo192.png",
      badge: "/logo192.png",
      vibrate: [200, 100, 200],
      data: {
        url: data.url
      }
    }
  );
});

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    event.waitUntil(
      clients.openWindow(
        event.notification.data.url
      )
    );
  }
);

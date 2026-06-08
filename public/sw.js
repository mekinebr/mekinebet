self.addEventListener("install", () => {
  console.log("SW instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("SW ativo");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "MekineBet",
    body: "Novo alerta disponível",
    url: "/",
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (error) {
    console.error("Erro no push:", error);
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo192.png",
      badge: "/logo192.png",
      vibrate: [200, 100, 200],
      data: {
        url: data.url || "/",
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/")
  );
});

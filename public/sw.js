/* Service worker do Marco — só o necessário para push funcionar no iOS. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(self.clients.claim());
});

self.addEventListener("push", (evento) => {
  let dados = {};
  try {
    dados = evento.data ? evento.data.json() : {};
  } catch {
    dados = { titulo: "Marco", corpo: evento.data ? evento.data.text() : "" };
  }

  const titulo = dados.titulo || "Marco";
  const opcoes = {
    body: dados.corpo || "",
    icon: "/icons/icone-192.png",
    badge: "/icons/badge.png",
    tag: dados.tag || "marco",
    renotify: true,
    requireInteraction: !!dados.urgente,
    vibrate: dados.urgente ? [220, 90, 220, 90, 320] : [180, 80, 180],
    data: { url: dados.url || "/marcos" },
  };

  evento.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = (evento.notification.data && evento.notification.data.url) || "/marcos";

  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      // Se o app já está aberto, navega nele em vez de abrir outra aba.
      for (const janela of janelas) {
        if ("focus" in janela) {
          janela.focus();
          if ("navigate" in janela) return janela.navigate(destino).catch(() => {});
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});

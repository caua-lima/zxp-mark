/* Service worker do ZXP Mark: push + funcionamento offline. */

const VERSAO = "marco-v2";
const ESTATICO = `${VERSAO}-estatico`;
const PAGINAS = `${VERSAO}-paginas`;

/** Só o casco. Nada de dado de usuário aqui. */
const CASCO = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icone-192.png",
  "/icons/icone-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/badge.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(ESTATICO).then((c) => c.addAll(CASCO)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(nomes.filter((n) => !n.startsWith(VERSAO)).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

/* ------------------------------- offline -------------------------------- */

const ehEstatico = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/icons/") ||
  url.pathname === "/manifest.webmanifest";

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API sempre na rede: dado velho de marco é pior do que erro honesto.
  if (url.pathname.startsWith("/api/")) return;

  // Build assets são imutáveis — cache primeiro, sem revalidar.
  if (ehEstatico(url)) {
    evento.respondWith(
      caches.match(req).then(
        (guardado) =>
          guardado ||
          fetch(req).then((r) => {
            if (r.ok) {
              const copia = r.clone();
              caches.open(ESTATICO).then((c) => c.put(req, copia));
            }
            return r;
          })
      )
    );
    return;
  }

  // Páginas: rede primeiro (o cronômetro precisa do dado fresco), com a
  // última versão vista como rede de segurança quando não há conexão.
  if (req.mode === "navigate") {
    evento.respondWith(
      fetch(req)
        .then((r) => {
          if (r.ok) {
            const copia = r.clone();
            caches.open(PAGINAS).then((c) => c.put(req, copia));
          }
          return r;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match("/offline")))
    );
  }
});

/** Sair da conta apaga as páginas guardadas — nada de vazar entre contas. */
self.addEventListener("message", (evento) => {
  if (evento.data?.tipo === "limpar-cache") {
    evento.waitUntil(caches.delete(PAGINAS));
  }
});

/* ---------------------------------- push --------------------------------- */

self.addEventListener("push", (evento) => {
  let dados = {};
  try {
    dados = evento.data ? evento.data.json() : {};
  } catch {
    dados = { titulo: "ZXP Mark", corpo: evento.data ? evento.data.text() : "" };
  }

  const titulo = dados.titulo || "ZXP Mark";
  const opcoes = {
    body: dados.corpo || "",
    icon: "/icons/icone-192.png",
    badge: "/icons/badge.png",
    tag: dados.tag || "marco",
    renotify: true,
    requireInteraction: !!dados.urgente,
    vibrate: dados.urgente ? [220, 90, 220, 90, 320] : [180, 80, 180],
    data: { url: dados.url || "/marcos" },
    actions: dados.urgente
      ? [
          { action: "abrir", title: "Ver marco" },
          { action: "sos", title: "Estou com vontade" },
        ]
      : [],
  };

  evento.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();

  const destino =
    evento.action === "sos"
      ? "/ajuda?sos=1"
      : (evento.notification.data && evento.notification.data.url) || "/marcos";

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

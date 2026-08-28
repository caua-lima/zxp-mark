"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Botao } from "@/components/ui";

/* ------------------------------ utilidades ------------------------------ */

function paraUint8(base64: string): Uint8Array {
  const preenchido = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const normal = preenchido.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(normal);
  const saida = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) saida[i] = bin.charCodeAt(i);
  return saida;
}

function ehApple(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ se identifica como Mac; o toque denuncia.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function instalado(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export type EstadoPush =
  | "carregando"
  | "sem-suporte"
  | "instalar-primeiro"
  | "desligado"
  | "bloqueado"
  | "ligado";

/* -------------------------------- hook ---------------------------------- */

export function usarPush() {
  const [estado, setEstado] = useState<EstadoPush>("carregando");
  const [dispositivos, setDispositivos] = useState(0);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const sincronizar = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setEstado(ehApple() && !instalado() ? "instalar-primeiro" : "sem-suporte");
      return;
    }
    // No iOS a API existe mas só funciona com o app na tela de início.
    if (ehApple() && !instalado()) {
      setEstado("instalar-primeiro");
      return;
    }
    if (Notification.permission === "denied") {
      setEstado("bloqueado");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const inscricao = await reg?.pushManager.getSubscription();
      const r = await fetch("/api/push");
      const dados = (await r.json()) as { dispositivos: number };
      setDispositivos(dados.dispositivos ?? 0);
      setEstado(inscricao && Notification.permission === "granted" ? "ligado" : "desligado");
    } catch {
      setEstado("desligado");
    }
  }, []);

  useEffect(() => {
    void sincronizar();
  }, [sincronizar]);

  /** Precisa ser chamado direto de um clique — o iOS exige gesto do usuário. */
  const ativar = useCallback(async () => {
    setErro("");
    setOcupado(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setEstado(permissao === "denied" ? "bloqueado" : "desligado");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      const r = await fetch("/api/push");
      const { chave } = (await r.json()) as { chave: string | null };
      if (!chave) throw new Error("O servidor está sem as chaves VAPID configuradas.");

      const existente = await reg.pushManager.getSubscription();
      const inscricao =
        existente ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: paraUint8(chave) as BufferSource,
        }));

      const json = inscricao.toJSON() as { endpoint?: string; keys?: Record<string, string> };
      const envio = await fetch("/api/push", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          agente: navigator.userAgent.slice(0, 400),
        }),
      });
      if (!envio.ok) throw new Error((await envio.json()).erro ?? "Falha ao registrar");

      const dados = (await envio.json()) as { dispositivos: number };
      setDispositivos(dados.dispositivos);
      setEstado("ligado");
    } catch (e) {
      setErro((e as Error).message || "Não consegui ativar as notificações.");
    } finally {
      setOcupado(false);
    }
  }, []);

  const desativar = useCallback(async () => {
    setOcupado(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const inscricao = await reg?.pushManager.getSubscription();
      if (inscricao) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: inscricao.endpoint }),
        });
        await inscricao.unsubscribe();
      }
      setEstado("desligado");
      setDispositivos((n) => Math.max(0, n - 1));
    } finally {
      setOcupado(false);
    }
  }, []);

  const testar = useCallback(async () => {
    setErro("");
    setOcupado(true);
    try {
      const r = await fetch("/api/push/testar", { method: "POST" });
      if (!r.ok) setErro((await r.json()).erro ?? "Falha ao enviar o teste.");
    } finally {
      setOcupado(false);
    }
  }, []);

  return { estado, dispositivos, erro, ocupado, ativar, desativar, testar, sincronizar };
}

/* ------------------------------ componentes ----------------------------- */

const PASSOS_IOS = [
  "Abra este site no Safari (não funciona no Chrome do iPhone).",
  "Toque no botão Compartilhar — o quadrado com a seta para cima.",
  "Role e toque em “Adicionar à Tela de Início”.",
  "Abra o Marco pelo ícone novo e volte aqui para ativar.",
];

/** Cartão completo, usado na aba Perfil. */
export function CartaoNotificacoes() {
  const { estado, dispositivos, erro, ocupado, ativar, desativar, testar } = usarPush();

  return (
    <div className="cartao p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold">Notificações</h2>
          <p className="mt-1 text-[13px] text-apagado">
            É assim que cada marco atingido chega até você.
          </p>
        </div>
        <Selo estado={estado} />
      </div>

      {estado === "instalar-primeiro" && (
        <div className="mt-4 rounded-2xl border border-brand/20 bg-brand/[0.07] p-4">
          <p className="text-[14px] font-medium text-brand-forte">
            No iPhone, notificações só funcionam com o app instalado.
          </p>
          <ol className="mt-3 space-y-2">
            {PASSOS_IOS.map((passo, i) => (
              <li key={passo} className="flex gap-3 text-[13.5px] text-suave">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[11px] font-semibold text-brand">
                  {i + 1}
                </span>
                {passo}
              </li>
            ))}
          </ol>
        </div>
      )}

      {estado === "bloqueado" && (
        <p className="mt-4 rounded-2xl border border-perigo/20 bg-perigo/[0.08] p-4 text-[13.5px] text-perigo">
          As notificações estão bloqueadas para este site. No iPhone: Ajustes → Notificações →
          Marco → permitir. Depois volte aqui.
        </p>
      )}

      {estado === "ligado" && (
        <p className="mt-4 text-[13.5px] text-suave">
          Ativas em {dispositivos} {dispositivos === 1 ? "aparelho" : "aparelhos"}. Pode fechar o
          app — os avisos chegam mesmo com ele fechado.
        </p>
      )}

      {erro && <p className="mt-3 text-[13px] text-perigo">{erro}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {estado === "desligado" && (
          <Botao onClick={ativar} carregando={ocupado}>
            Ativar notificações
          </Botao>
        )}
        {estado === "ligado" && (
          <>
            <Botao variante="vazio" onClick={testar} carregando={ocupado}>
              Enviar teste
            </Botao>
            <Botao variante="fantasma" onClick={desativar} disabled={ocupado}>
              Desativar
            </Botao>
          </>
        )}
      </div>
    </div>
  );
}

/** Faixa compacta que aparece no topo da aba Marcos enquanto o push está off. */
export function BannerNotificacoes() {
  const { estado, ocupado, ativar } = usarPush();

  if (estado === "ligado" || estado === "carregando" || estado === "sem-suporte") return null;

  if (estado === "instalar-primeiro") {
    return (
      <Link
        href="/perfil"
        className="surge mb-4 flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand/[0.07] px-4 py-3.5"
      >
        <span className="text-xl">📲</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-brand-forte">
            Instale na tela de início
          </span>
          <span className="block text-[12.5px] text-brand-forte/60">
            É o que libera as notificações no iPhone. Ver como →
          </span>
        </span>
      </Link>
    );
  }

  return (
    <div className="surge mb-4 flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand/[0.07] px-4 py-3">
      <span className="text-xl">🔔</span>
      <span className="min-w-0 flex-1 text-[13.5px] text-brand-forte">
        Ative as notificações para receber cada marco.
      </span>
      <button
        onClick={ativar}
        disabled={ocupado}
        className="shrink-0 rounded-xl bg-brand px-3.5 py-2 text-[13px] font-semibold text-brand-ink disabled:opacity-50"
      >
        {ocupado ? "..." : "Ativar"}
      </button>
    </div>
  );
}

function Selo({ estado }: { estado: EstadoPush }) {
  const mapa: Record<EstadoPush, { texto: string; cor: string }> = {
    carregando: { texto: "...", cor: "bg-white/8 text-suave" },
    ligado: { texto: "Ativas", cor: "bg-brand/15 text-brand" },
    desligado: { texto: "Desligadas", cor: "bg-white/8 text-suave" },
    bloqueado: { texto: "Bloqueadas", cor: "bg-perigo/15 text-perigo" },
    "instalar-primeiro": { texto: "Instale o app", cor: "bg-brand/15 text-brand" },
    "sem-suporte": { texto: "Sem suporte", cor: "bg-white/8 text-apagado" },
  };
  const { texto, cor } = mapa[estado];
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${cor}`}>
      {texto}
    </span>
  );
}

/**
 * Rede de segurança: ao abrir (ou voltar para) o app, pede ao servidor que
 * verifique os marcos vencidos deste usuário. Cobre atrasos do cron.
 */
export function VerificarAoAbrir() {
  useEffect(() => {
    let ultima = 0;
    const verificar = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - ultima < 60_000) return;
      ultima = Date.now();
      void fetch("/api/notificacoes/verificar", { method: "POST" }).catch(() => {});
    };
    verificar();
    document.addEventListener("visibilitychange", verificar);
    return () => document.removeEventListener("visibilitychange", verificar);
  }, []);

  return null;
}

/** Registra o service worker cedo, para o push funcionar já na primeira vez. */
export function RegistrarSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { CartaoMarco } from "@/components/CartaoMarco";
import { BannerNotificacoes } from "@/components/Push";
import { ResumoGeral } from "@/components/ResumoGeral";

export const dynamic = "force-dynamic";

export default async function PaginaMarcos() {
  const uid = (await usuarioId())!;
  const [user, marcos] = await Promise.all([
    prisma.user.findUnique({ where: { id: uid }, select: { nome: true } }),
    prisma.marco.findMany({
      where: { userId: uid, arquivadoEm: null },
      orderBy: [{ ativo: "desc" }, { criadoEm: "asc" }],
    }),
  ]);

  const agora = Date.now();

  return (
    <main>
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-apagado">Olá, {user?.nome.split(" ")[0]}</p>
          <h1 className="text-[26px] font-semibold tracking-tight">Meus marcos</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/conquistas"
            className="flex size-11 items-center justify-center rounded-full border border-borda bg-white/[0.04] text-lg active:bg-white/[0.08]"
            aria-label="Conquistas"
          >
            🏆
          </Link>
          <Link
            href="/marcos/novo"
            className="flex size-11 items-center justify-center rounded-full bg-brand text-2xl font-light text-brand-ink shadow-lg shadow-brand/20 active:bg-brand-escuro"
            aria-label="Novo marco"
          >
            +
          </Link>
        </div>
      </header>

      <BannerNotificacoes />

      <ResumoGeral agora={agora} marcos={marcos.map((m) => ({ ...m, melhorMs: Number(m.melhorMs) }))} />

      {marcos.length === 0 ? (
        <Vazio />
      ) : (
        <div className="space-y-3.5">
          {marcos.map((m) => (
            <CartaoMarco
              key={m.id}
              agora={agora}
              marco={{
                id: m.id,
                titulo: m.titulo,
                preset: m.preset,
                emoji: m.emoji,
                cicloInicio: m.cicloInicio.toISOString(),
                ativo: m.ativo,
                unidadesPorDia: m.unidadesPorDia,
                gastoDiario: m.gastoDiario,
              }}
            />
          ))}
        </div>
      )}

      {marcos.length > 0 && (
        <Link
          href="/ajuda?sos=1"
          className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-perigo/25 bg-perigo/10 py-4 text-[15px] font-semibold text-perigo active:bg-perigo/20"
        >
          Estou com vontade agora
        </Link>
      )}
    </main>
  );
}

function Vazio() {
  return (
    <div className="cartao px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-2xl">
        🔥
      </div>
      <h2 className="text-[17px] font-semibold">O relógio começa quando você quiser</h2>
      <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-apagado">
        Escolha o que você quer largar. A partir do toque no botão, cada hora passa a contar — e
        eu te aviso a cada marco.
      </p>
      <Link
        href="/marcos/novo"
        className="mt-5 inline-flex rounded-2xl bg-brand px-5 py-3.5 text-[15px] font-semibold text-brand-ink active:bg-brand-escuro"
      >
        Criar meu primeiro marco
      </Link>
    </div>
  );
}

/**
 * Persistência do registro de sono.
 *
 * O ponto delicado é a sobreposição. "Conferir se já existe um registro nesse
 * intervalo" e depois "criar" são dois passos; num duplo toque em Salvar, as
 * duas requisições conferem ao mesmo tempo, as duas acham o caminho livre e as
 * duas gravam. Por isso conferir+gravar roda dentro de uma transação que antes
 * pega uma trava de aviso do Postgres por usuário: a segunda requisição espera
 * a primeira terminar e então enxerga o registro dela.
 */
import type { PrismaClient } from "@prisma/client";
import {
  interpretarSono,
  resumirSono,
  type EntradaSono,
  type ResumoSono,
} from "../sono.ts";

/** Precisa de $transaction e $executeRaw, então é o cliente inteiro. */
export type Db = Pick<PrismaClient, "sono" | "$transaction">;

export type Falha = { ok: false; erro: string; status: number };
export type Saida<T> = { ok: true; valor: T } | Falha;

const NAO_ENCONTRADO: Falha = { ok: false, erro: "Registro não encontrado.", status: 404 };

type Cliente = Pick<PrismaClient, "sono" | "$executeRaw">;

/** Serializa o que vem a seguir, por usuário, até o fim da transação. */
async function comTrava<T>(db: Db, uid: string, fn: (tx: Cliente) => Promise<T>): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"sono:" + uid}))`;
    return fn(tx);
  });
}

function descreverConflito(c: { dormiuEm: Date; acordouEm: Date }, tz: string): string {
  const f = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Esse período se sobrepõe a outro registro (${f.format(c.dormiuEm)} até ${f.format(c.acordouEm)}). Edite aquele ou ajuste os horários.`;
}

async function conflito(
  tx: Cliente,
  uid: string,
  dormiuEm: Date,
  acordouEm: Date,
  ignorarId?: string
) {
  return tx.sono.findFirst({
    where: {
      userId: uid,
      ...(ignorarId ? { id: { not: ignorarId } } : {}),
      // intervalos se sobrepõem quando cada um começa antes de o outro terminar
      dormiuEm: { lt: acordouEm },
      acordouEm: { gt: dormiuEm },
    },
    select: { dormiuEm: true, acordouEm: true },
  });
}

export async function criarSono(
  db: Db,
  uid: string,
  entrada: EntradaSono,
  tz: string,
  agora: number = Date.now()
) {
  const dados = interpretarSono(entrada, tz, agora);
  if (!dados.ok) return { ok: false, erro: dados.erro, status: 400 } satisfies Falha;

  return comTrava(db, uid, async (tx) => {
    const c = await conflito(tx, uid, dados.valor.dormiuEm, dados.valor.acordouEm);
    if (c) return { ok: false, erro: descreverConflito(c, tz), status: 409 } satisfies Falha;
    const criado = await tx.sono.create({ data: { userId: uid, ...dados.valor } });
    return { ok: true, valor: criado } as const;
  });
}

export async function editarSono(
  db: Db,
  uid: string,
  id: string,
  entrada: EntradaSono,
  tz: string,
  agora: number = Date.now()
) {
  const dados = interpretarSono(entrada, tz, agora);
  if (!dados.ok) return { ok: false, erro: dados.erro, status: 400 } satisfies Falha;

  return comTrava(db, uid, async (tx) => {
    const c = await conflito(tx, uid, dados.valor.dormiuEm, dados.valor.acordouEm, id);
    if (c) return { ok: false, erro: descreverConflito(c, tz), status: 409 } satisfies Falha;

    const r = await tx.sono.updateMany({ where: { id, userId: uid }, data: dados.valor });
    if (r.count === 0) return NAO_ENCONTRADO;
    const atual = await tx.sono.findFirst({ where: { id, userId: uid } });
    return atual ? ({ ok: true, valor: atual } as const) : NAO_ENCONTRADO;
  });
}

export async function excluirSono(db: Db, uid: string, id: string): Promise<Saida<null>> {
  const r = await db.sono.deleteMany({ where: { id, userId: uid } });
  return r.count === 0 ? NAO_ENCONTRADO : { ok: true, valor: null };
}

export async function obterSono(db: Pick<PrismaClient, "sono">, uid: string, id: string) {
  return db.sono.findFirst({ where: { id, userId: uid } });
}

/** Histórico, do mais recente para o mais antigo. */
export async function listarSono(
  db: Pick<PrismaClient, "sono">,
  uid: string,
  { limite = 60 }: { limite?: number } = {}
) {
  return db.sono.findMany({
    where: { userId: uid },
    orderBy: { dormiuEm: "desc" },
    take: Math.min(Math.max(1, limite), 500),
  });
}

/**
 * Tudo que a tela de sono mostra: o histórico recente e o resumo dos últimos
 * 7 dias. O resumo só precisa do que acordou na janela (com folga de 2 dias
 * para a virada de fuso), então não relê a vida inteira.
 */
export async function carregarSono(
  db: Pick<PrismaClient, "sono">,
  uid: string,
  tz: string,
  agora: number = Date.now()
): Promise<{ historico: Awaited<ReturnType<typeof listarSono>>; resumo: ResumoSono }> {
  const desde = new Date(agora - 9 * 24 * 60 * 60_000);
  const [historico, janela] = await Promise.all([
    listarSono(db, uid, { limite: 60 }),
    db.sono.findMany({
      where: { userId: uid, acordouEm: { gte: desde } },
      select: { dormiuEm: true, acordouEm: true, qualidade: true },
    }),
  ]);
  return { historico, resumo: resumirSono(janela, tz, agora, 7) };
}

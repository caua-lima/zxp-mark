/**
 * Persistência da progressão: o que a pessoa já viu comemorar e o que ela
 * mesma disse sobre como está se sentindo.
 *
 * Três regras que este arquivo garante, e que os testes de integração provam:
 *
 *  1. Celebração não repete. Cada (usuário, item, etapa, ciclo) é único no
 *     banco; marcar duas vezes — clique duplo, duas abas, recarregar — não
 *     cria nada novo.
 *  2. Corrigir um registro não premia. Um ciclo novo (data de início corrigida,
 *     recaída) começa sem a linha "_base"; no primeiro olhar, tudo que já
 *     estava atingido vira "visto" em silêncio, sem celebração retroativa.
 *  3. O servidor não confia no navegador. Quais etapas foram atingidas é
 *     recalculado aqui a partir dos dados do próprio usuário.
 */
import type { PrismaClient } from "@prisma/client";
import {
  CHAVE_BASE,
  EPOCA,
  alcancadas,
  etapasDoAcompanhamento,
  etapasDoMarco,
  etapasDoSono,
  type Etapa,
  type TipoProgresso,
} from "../progressao.ts";
import { diasComRegistro } from "../sono.ts";
import { fusoSeguro } from "../datas.ts";

export type Db = Pick<
  PrismaClient,
  "marco" | "acompanhamento" | "sono" | "user" | "conquistaVista" | "percepcao"
>;

export type Falha = { ok: false; erro: string; status: number };
export type Saida<T> = { ok: true; valor: T } | Falha;

const NAO_ENCONTRADO: Falha = { ok: false, erro: "Item não encontrado.", status: 404 };

export function ehTipo(v: unknown): v is TipoProgresso {
  return v === "marco" || v === "acompanhamento" || v === "sono";
}

export type Referencia = {
  tipo: TipoProgresso;
  refId: string;
  /** o "ciclo" é o que, ao mudar, recomeça a trilha em silêncio */
  ciclo: Date;
  etapas: Etapa[];
  /** ms decorridos (marco, acompanhamento) ou noites registradas (sono) */
  valor: number;
};

/**
 * Resolve um item PELO DONO. Retorna null tanto para "não existe" quanto para
 * "é de outra pessoa" — de fora, indistinguíveis.
 */
export async function resolverReferencia(
  db: Db,
  uid: string,
  tipo: TipoProgresso,
  refId: string,
  agora: number = Date.now()
): Promise<Referencia | null> {
  if (tipo === "marco") {
    const m = await db.marco.findFirst({ where: { id: refId, userId: uid, arquivadoEm: null } });
    if (!m) return null;
    return {
      tipo,
      refId,
      ciclo: m.cicloInicio,
      etapas: etapasDoMarco(m.preset),
      valor: Math.max(0, agora - m.cicloInicio.getTime()),
    };
  }

  if (tipo === "acompanhamento") {
    const a = await db.acompanhamento.findFirst({ where: { id: refId, userId: uid } });
    if (!a) return null;
    return {
      tipo,
      refId,
      ciclo: a.inicio,
      etapas: etapasDoAcompanhamento(),
      valor: Math.max(0, agora - a.inicio.getTime()),
    };
  }

  // sono: a trilha é da conta inteira, então o "item" é o próprio usuário
  if (refId !== uid) return null;
  const [user, registros] = await Promise.all([
    db.user.findUnique({ where: { id: uid }, select: { timezone: true } }),
    db.sono.findMany({ where: { userId: uid }, select: { acordouEm: true } }),
  ]);
  return {
    tipo,
    refId,
    ciclo: EPOCA,
    etapas: etapasDoSono(),
    valor: diasComRegistro(registros, fusoSeguro(user?.timezone)),
  };
}

/**
 * Chamado ao abrir a tela. Devolve as etapas atingidas que a pessoa ainda não
 * viu comemorar — e, no primeiro olhar de um ciclo, semeia tudo como visto.
 */
export async function prepararProgresso(
  db: Db,
  uid: string,
  ref: Referencia
): Promise<{ atingidas: string[]; vistas: Set<string>; pendentes: string[] }> {
  const atingidas = alcancadas(ref.etapas, ref.valor);
  const linhas = await db.conquistaVista.findMany({
    where: { userId: uid, refId: ref.refId, ciclo: ref.ciclo },
    select: { chave: true },
  });
  const vistas = new Set(linhas.map((l) => l.chave));

  if (!vistas.has(CHAVE_BASE)) {
    // Primeiro olhar neste ciclo: o que já passou não comemora retroativamente.
    await db.conquistaVista.createMany({
      data: [CHAVE_BASE, ...atingidas].map((chave) => ({
        userId: uid,
        tipo: ref.tipo,
        refId: ref.refId,
        chave,
        ciclo: ref.ciclo,
      })),
      skipDuplicates: true,
    });
    return { atingidas, vistas: new Set([CHAVE_BASE, ...atingidas]), pendentes: [] };
  }

  return { atingidas, vistas, pendentes: atingidas.filter((c) => !vistas.has(c)) };
}

/**
 * Marca etapas como vistas. Só vale o que de fato foi atingido (recalculado
 * aqui) e só de itens do próprio usuário. Idempotente por construção.
 */
export async function marcarVistas(
  db: Db,
  uid: string,
  tipo: TipoProgresso,
  refId: string,
  chaves: string[],
  agora: number = Date.now()
): Promise<Saida<{ marcadas: number }>> {
  const ref = await resolverReferencia(db, uid, tipo, refId, agora);
  if (!ref) return NAO_ENCONTRADO;

  const validas = new Set(alcancadas(ref.etapas, ref.valor));
  const aMarcar = [...new Set(chaves)].filter((c) => validas.has(c));
  if (aMarcar.length === 0) return { ok: true, valor: { marcadas: 0 } };

  const r = await db.conquistaVista.createMany({
    data: aMarcar.map((chave) => ({ userId: uid, tipo, refId, chave, ciclo: ref.ciclo })),
    skipDuplicates: true,
  });
  return { ok: true, valor: { marcadas: r.count } };
}

/* ------------------------------ percepção --------------------------------- */

export const NOTA_MAXIMA = 300;

export type EntradaPercepcao = {
  tipo: TipoProgresso;
  refId: string;
  chave: string;
  humor?: number | null;
  nota?: string | null;
};

export type PercepcaoSalva = { humor: number | null; nota: string | null };

/**
 * "Como você está se sentindo?" — opcional e por etapa. Humor e nota vazios
 * apagam o registro: deixar em branco é uma resposta válida, não um erro.
 */
export async function salvarPercepcao(
  db: Db,
  uid: string,
  e: EntradaPercepcao,
  agora: number = Date.now()
): Promise<Saida<PercepcaoSalva | null>> {
  const ref = await resolverReferencia(db, uid, e.tipo, e.refId, agora);
  if (!ref) return NAO_ENCONTRADO;

  // Anotar só faz sentido numa etapa que a pessoa já alcançou (a abertura vale).
  const alcancou = ref.etapas.some((et) => et.chave === e.chave && et.limiar <= ref.valor);
  if (!alcancou) {
    return { ok: false, erro: "Você ainda não chegou a essa etapa.", status: 400 };
  }

  const humor = e.humor ?? null;
  if (humor !== null && (!Number.isInteger(humor) || humor < 1 || humor > 5)) {
    return { ok: false, erro: "Escolha um valor de 1 a 5.", status: 400 };
  }
  const nota = (e.nota ?? "").trim();
  if (nota.length > NOTA_MAXIMA) {
    return { ok: false, erro: `A nota aceita até ${NOTA_MAXIMA} caracteres.`, status: 400 };
  }

  const where = { userId: uid, refId: e.refId, chave: e.chave, ciclo: ref.ciclo };

  if (humor === null && !nota) {
    await db.percepcao.deleteMany({ where });
    return { ok: true, valor: null };
  }

  const salva = await db.percepcao.upsert({
    where: { userId_refId_chave_ciclo: where },
    create: { ...where, tipo: e.tipo, humor, nota: nota || null },
    update: { humor, nota: nota || null },
    select: { humor: true, nota: true },
  });
  return { ok: true, valor: salva };
}

/** Percepções do ciclo atual, por chave de etapa. */
export async function listarPercepcoes(
  db: Db,
  uid: string,
  ref: Referencia
): Promise<Record<string, PercepcaoSalva>> {
  const linhas = await db.percepcao.findMany({
    where: { userId: uid, refId: ref.refId, ciclo: ref.ciclo },
    select: { chave: true, humor: true, nota: true },
  });
  return Object.fromEntries(linhas.map((l) => [l.chave, { humor: l.humor, nota: l.nota }]));
}

/**
 * Preferências de privacidade dos dados de saúde.
 *
 * Duas decisões de segurança moram aqui:
 *
 *  1. PADRÃO DESLIGADO. Sem linha, ou com a tabela ainda inexistente, a leitura devolve
 *     "o assistente NÃO usa meus registros". Nunca falha para o lado de ligar.
 *  2. DIREITO DE REMOVER. `apagarDadosDeSaude` apaga, de uma vez, tudo que o módulo de
 *     saúde guarda da pessoa — e só dela.
 */
import type { PrismaClient } from "@prisma/client";
import { naoEncontrado, ok } from "./comum.ts";

export type Db = Pick<PrismaClient, "preferenciaSaude">;
export type DbApagar = Pick<PrismaClient, "habitoAcompanhado" | "tratamento" | "registroHumor" | "preferenciaSaude">;

/** O banco ainda não recebeu as tabelas novas (db push pendente). */
export function tabelaAusente(e: unknown): boolean {
  const codigo = typeof e === "object" && e !== null ? (e as { code?: string }).code : undefined;
  return codigo === "P2021" || codigo === "P2022";
}

export async function lerPreferenciaSaude(db: Db, uid: string): Promise<{ assistenteUsaSaude: boolean }> {
  try {
    const p = await db.preferenciaSaude.findUnique({ where: { userId: uid } });
    return { assistenteUsaSaude: p?.assistenteUsaSaude === true };
  } catch (e) {
    if (tabelaAusente(e)) return { assistenteUsaSaude: false };
    throw e;
  }
}

export async function definirAssistenteUsaSaude(db: Db, uid: string, valor: boolean) {
  const p = await db.preferenciaSaude.upsert({
    where: { userId: uid },
    create: { userId: uid, assistenteUsaSaude: valor },
    update: { assistenteUsaSaude: valor },
  });
  return ok({ assistenteUsaSaude: p.assistenteUsaSaude });
}

/**
 * Apaga os acompanhamentos de hábito (com os registros), os de medicamento (com tomadas,
 * doses e efeitos) e o "como estou" — e desliga o uso pelo assistente. O sono, as
 * contagens e os marcos têm os próprios botões de apagar.
 */
export async function apagarDadosDeSaude(db: DbApagar, uid: string) {
  const [habitos, tratamentos, humores] = await Promise.all([
    db.habitoAcompanhado.deleteMany({ where: { userId: uid } }),
    db.tratamento.deleteMany({ where: { userId: uid } }),
    db.registroHumor.deleteMany({ where: { userId: uid } }),
  ]);
  await db.preferenciaSaude.deleteMany({ where: { userId: uid } });
  const total = habitos.count + tratamentos.count + humores.count;
  return total === 0 ? naoEncontrado("Dados de saúde") : ok({ habitos: habitos.count, tratamentos: tratamentos.count, humores: humores.count });
}

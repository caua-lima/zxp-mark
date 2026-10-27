/**
 * Cola comum das rotas do módulo de saúde: sessão válida, fuso do usuário, corpo validado,
 * tradução de `Saida` em resposta HTTP e o aviso claro enquanto o banco ainda não recebeu
 * as tabelas novas (db push pendente), em vez de um erro 500 opaco.
 */
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { sessaoValida } from "@/lib/auth";
import { fusoDoUsuario } from "@/lib/usuario";
import type { Saida } from "@/lib/servicos/comum";
import { tabelaAusente } from "@/lib/servicos/preferencias";

export type Contexto = { uid: string; tz: string };

const NAO_AUTENTICADO = () => NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

export function resposta<T>(r: Saida<T>, extra: (v: T) => Record<string, unknown> = (v) => ({ valor: v })) {
  if (!r.ok) return NextResponse.json({ erro: r.erro }, { status: r.status });
  return NextResponse.json({ ok: true, ...extra(r.valor) });
}

/** Executa `fn` com sessão e fuso; tabela inexistente vira 503 com a instrução, não 500. */
export async function comSessao(fn: (c: Contexto) => Promise<NextResponse>): Promise<NextResponse> {
  const uid = await sessaoValida();
  if (!uid) return NAO_AUTENTICADO();
  try {
    return await fn({ uid, tz: await fusoDoUsuario(uid) });
  } catch (e) {
    if (tabelaAusente(e)) {
      return NextResponse.json(
        { erro: "Esta função ainda não está disponível: o banco precisa ser atualizado (npm run db:push)." },
        { status: 503 }
      );
    }
    throw e;
  }
}

export async function corpo<T>(req: Request, esquema: ZodType<T>): Promise<{ ok: true; valor: T } | { ok: false; res: NextResponse }> {
  const r = esquema.safeParse(await req.json().catch(() => null));
  return r.success ? { ok: true, valor: r.data } : { ok: false, res: NextResponse.json({ erro: "Dados inválidos" }, { status: 400 }) };
}

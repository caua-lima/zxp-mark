/**
 * "Como estou" e o cruzamento do humor com sono e hábitos.
 *
 * Princípio: o app DESCREVE os registros da pessoa e para aí. Ele nunca escreve
 * "o escitalopram melhorou seu sono", "você dorme melhor porque parou de roer unha"
 * nem nada que afirme causa a partir de dois números que andaram juntos. Cada
 * observação:
 *   - só aparece se houver dias suficientes dos DOIS lados;
 *   - diz quantos dias sustentam o que diz;
 *   - termina lembrando que descreve registros e não mostra causa.
 *
 * Puro e sem alias.
 */
import { diaLocalDe, instanteLocal } from "../datas.ts";
import { somarDias } from "./episodios.ts";

export type EntradaHumor = {
  dia?: string;
  humor: number;
  energia?: number | null;
  ansiedade?: number | null;
  nota?: string | null;
};
export type HumorValido = { dia: string; humor: number; energia: number | null; ansiedade: number | null; nota: string | null };
type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string };

const escala = (v: number | null | undefined, nome: string, obrigatorio = false): Resultado<number | null> => {
  if (v === null || v === undefined) {
    return obrigatorio ? { ok: false, erro: `${nome}: escolha de 1 a 5.` } : { ok: true, valor: null };
  }
  return Number.isInteger(v) && v >= 1 && v <= 5 ? { ok: true, valor: v } : { ok: false, erro: `${nome}: escolha de 1 a 5.` };
};

export function validarHumor(e: EntradaHumor, agora: number, tz: string): Resultado<HumorValido> {
  const hoje = diaLocalDe(agora, tz);
  const dia = e.dia ?? hoje;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || !instanteLocal(dia, tz)) return { ok: false, erro: "Escolha uma data válida." };
  if (dia > hoje) return { ok: false, erro: "Esse dia ainda não chegou." };
  const humor = escala(e.humor, "Humor", true);
  if (!humor.ok) return humor;
  const energia = escala(e.energia, "Energia");
  if (!energia.ok) return energia;
  const ansiedade = escala(e.ansiedade, "Ansiedade");
  if (!ansiedade.ok) return ansiedade;
  const nota = (e.nota ?? "").trim() || null;
  if (nota && nota.length > 300) return { ok: false, erro: "A nota aceita até 300 caracteres." };
  return { ok: true, valor: { dia, humor: humor.valor as number, energia: energia.valor, ansiedade: ansiedade.valor, nota } };
}

/* ------------------------------ comparações -------------------------------- */

export type ValorDoDia = { dia: string; valor: number };

const media = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const f1 = (n: number) => n.toFixed(1).replace(".", ",");

export type ComparacaoSemanas = {
  atual: { media: number; n: number };
  anterior: { media: number; n: number };
  /** > 0: a semana atual teve média maior */
  diferenca: number;
};

/**
 * Compara a média dos últimos 7 dias (terminando hoje) com a dos 7 anteriores.
 * Só devolve algo se cada semana tiver pelo menos `minimo` dias registrados:
 * com menos, qualquer diferença é ruído.
 */
export function compararSemanas(valores: ValorDoDia[], hoje: string, minimo = 3): ComparacaoSemanas | null {
  const fimAtual = hoje;
  const iniAtual = somarDias(hoje, -6);
  const fimAnterior = somarDias(hoje, -7);
  const iniAnterior = somarDias(hoje, -13);
  const atual = valores.filter((v) => v.dia >= iniAtual && v.dia <= fimAtual).map((v) => v.valor);
  const anterior = valores.filter((v) => v.dia >= iniAnterior && v.dia <= fimAnterior).map((v) => v.valor);
  if (atual.length < minimo || anterior.length < minimo) return null;
  const a = media(atual) as number;
  const b = media(anterior) as number;
  return { atual: { media: a, n: atual.length }, anterior: { media: b, n: anterior.length }, diferenca: a - b };
}

/** Frase neutra sobre a mudança entre duas semanas. Vazio se não há base. */
export function descreverComparacao(rotulo: string, c: ComparacaoSemanas | null, tolerancia = 0.3): string | null {
  if (!c) return null;
  const base = `${c.atual.n} dias nesta semana contra ${c.anterior.n} na anterior`;
  if (Math.abs(c.diferenca) < tolerancia) {
    return `A média de ${rotulo} registrada ficou parecida nas duas semanas (${f1(c.atual.media)} e ${f1(c.anterior.media)}; ${base}).`;
  }
  const direcao = c.diferenca > 0 ? "maior" : "menor";
  return `A média de ${rotulo} registrada nesta semana foi ${direcao} (${f1(c.atual.media)} contra ${f1(c.anterior.media)} na semana anterior; ${base}).`;
}

export const AVISO_SEM_CAUSA = "Isto descreve os seus registros; não mostra que uma coisa causa a outra.";

export type DiaCruzado = { dia: string; humor: number | null; sonoQualidade: number | null };

/** Humor e sono, dia a dia, nos últimos `dias` dias — a tabela lado a lado. */
export function cruzarHumorESono(
  humores: { dia: string; humor: number }[],
  sono: { dia: string; qualidade: number }[],
  hoje: string,
  dias = 14
): DiaCruzado[] {
  const h = new Map(humores.map((x) => [x.dia, x.humor]));
  const s = new Map(sono.map((x) => [x.dia, x.qualidade]));
  const saida: DiaCruzado[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const dia = somarDias(hoje, -i);
    saida.push({ dia, humor: h.get(dia) ?? null, sonoQualidade: s.get(dia) ?? null });
  }
  return saida;
}

export type ObservacaoCruzada = {
  /** dias com os DOIS registros */
  diasComAmbos: number;
  texto: string;
};

/**
 * Compara o humor registrado nos dias de sono de qualidade 4–5 com o dos dias de 1–3.
 * Exige pelo menos `minimoPorGrupo` dias em cada grupo; senão diz que ainda não há base.
 */
export function observarHumorPorSono(tabela: DiaCruzado[], minimoPorGrupo = 3): ObservacaoCruzada {
  const ambos = tabela.filter((d) => d.humor !== null && d.sonoQualidade !== null);
  const bom = ambos.filter((d) => (d.sonoQualidade as number) >= 4).map((d) => d.humor as number);
  const resto = ambos.filter((d) => (d.sonoQualidade as number) <= 3).map((d) => d.humor as number);

  if (bom.length < minimoPorGrupo || resto.length < minimoPorGrupo) {
    return {
      diasComAmbos: ambos.length,
      texto: `Ainda há poucos dias com humor e sono registrados juntos (${ambos.length}) para comparar. Com mais registros dos dois, o app mostra o que aparece nos seus números — sem concluir causa.`,
    };
  }
  return {
    diasComAmbos: ambos.length,
    texto: `Nos ${bom.length} dias em que você registrou sono de qualidade 4 ou 5, o humor médio registrado foi ${f1(media(bom) as number)}; nos ${resto.length} dias com qualidade de 1 a 3, foi ${f1(media(resto) as number)}. ${AVISO_SEM_CAUSA}`,
  };
}

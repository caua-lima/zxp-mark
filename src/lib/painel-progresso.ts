/**
 * Monta, no servidor, tudo que a trilha precisa para responder às quatro
 * perguntas da tela:
 *
 *   1. Onde estou?              → posição + etapa atual
 *   2. O que já conquistei?     → etapas concluídas, com a data
 *   3. Qual é o próximo passo?  → próxima etapa e quanto falta
 *   4. Por que vale continuar?  → benefício possível (com fonte) ou mensagem factual
 *
 * O resultado é 100% serializável: vai direto como prop para o componente de
 * cliente. Nada aqui depende do relógio do navegador.
 */
import { conteudoDaEtapa, type ConteudoEtapa } from "./beneficios.ts";
import {
  escolherCelebracao,
  posicionar,
  textoRetomada,
  type EstadoEtapa,
  type TipoProgresso,
} from "./progressao.ts";
import {
  listarPercepcoes,
  prepararProgresso,
  type Db,
  type PercepcaoSalva,
  type Referencia,
} from "./servicos/progresso.ts";
import { duracaoExtenso, rotuloMs } from "./formato.ts";

export type EtapaPainel = {
  chave: string;
  titulo: string;
  /** rótulo curto para caber embaixo da casa: "7 dias", "30" */
  curto: string;
  estado: EstadoEtapa;
  relevante: boolean;
  inicial: boolean;
  /** quando foi conquistada (ISO); null se ainda não ou se não dá para saber */
  quando: string | null;
};

export type CelebracaoPainel = {
  chave: string;
  titulo: string;
  nivel: "grande" | "discreta";
  outras: number;
  mensagem: string;
};

export type PainelProgresso = {
  tipo: TipoProgresso;
  refId: string;
  etapas: EtapaPainel[];
  concluidas: number;
  total: number;
  proximaTitulo: string | null;
  faltaTexto: string | null;
  /** 0..1 entre a última etapa concluída e o próximo alvo */
  progresso: number;
  conteudos: Record<string, ConteudoEtapa>;
  percepcoes: Record<string, PercepcaoSalva>;
  celebracao: CelebracaoPainel | null;
  /** chaves a marcar como vistas assim que a celebração aparecer */
  pendentes: string[];
  retomada: string | null;
};

export type OpcoesPainel = {
  presetId?: string;
  categoria?: string;
  /** só sono: dias desde o último registro, para a mensagem de retomada */
  diasSemRegistro?: number | null;
};

function rotuloCurto(tipo: TipoProgresso, limiar: number, inicial: boolean): string {
  if (inicial) return "Início";
  return tipo === "sono" ? String(limiar) : rotuloMs(limiar);
}

export async function montarPainel(
  db: Db,
  uid: string,
  ref: Referencia,
  opcoes: OpcoesPainel = {}
): Promise<PainelProgresso> {
  const { atingidas, vistas, pendentes } = await prepararProgresso(db, uid, ref);
  const posicao = posicionar(ref.etapas, ref.valor);
  const percepcoes = await listarPercepcoes(db, uid, ref);

  const conteudos: Record<string, ConteudoEtapa> = {};
  const etapas: EtapaPainel[] = posicao.etapas.map((e, i) => {
    const proxima = posicao.etapas[i + 1] ?? null;
    conteudos[e.chave] = conteudoDaEtapa({
      tipo: ref.tipo,
      presetId: opcoes.presetId,
      categoria: opcoes.categoria,
      etapa: e,
      proxima,
      noites: ref.tipo === "sono" ? e.limiar : undefined,
    });
    return {
      chave: e.chave,
      titulo: e.titulo,
      curto: rotuloCurto(ref.tipo, e.limiar, !!e.inicial),
      estado: e.estado,
      relevante: e.relevante,
      inicial: !!e.inicial,
      // Para tempo corrido a data é exata; para sono depende de qual noite foi a n-ésima.
      quando:
        ref.tipo !== "sono" && e.estado === "concluida"
          ? new Date(ref.ciclo.getTime() + e.limiar).toISOString()
          : null,
    };
  });

  const c = escolherCelebracao(ref.etapas, atingidas, vistas);
  const celebracao: CelebracaoPainel | null = c
    ? {
        chave: c.etapa.chave,
        titulo: c.etapa.titulo,
        nivel: c.nivel,
        outras: c.outras,
        mensagem: conteudos[c.etapa.chave].conquista,
      }
    : null;

  const faltaTexto = posicao.atual
    ? ref.tipo === "sono"
      ? `${posicao.falta} ${posicao.falta === 1 ? "noite" : "noites"}`
      : duracaoExtenso(posicao.falta)
    : null;

  return {
    tipo: ref.tipo,
    refId: ref.refId,
    etapas,
    concluidas: posicao.concluidas,
    total: posicao.total,
    proximaTitulo: posicao.atual?.titulo ?? null,
    faltaTexto,
    progresso: posicao.progresso,
    conteudos,
    percepcoes,
    celebracao,
    pendentes: celebracao ? pendentes : [],
    retomada: textoRetomada(ref.tipo, opcoes.diasSemRegistro ?? null),
  };
}

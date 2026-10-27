/**
 * Registro único de fontes. Toda `Afirmacao` do catálogo aponta para uma daqui.
 *
 * `verificacao` é a parte que mais importa: "pagina lida" significa que o texto
 * foi lido e comparado; "resumo de busca" significa que só o resumo do buscador
 * foi visto e a afirmação ligada a ela deve ser tratada com mais cautela.
 */
import type { Fonte } from "./tipos.ts";

const VERIFICADO = "2026-10-27";

function fonte(f: Omit<Fonte, "verificadoEm"> & { verificadoEm?: string }): Fonte {
  return { verificadoEm: VERIFICADO, ...f };
}

export const FONTES: Record<string, Fonte> = Object.fromEntries(
  [
    /* ----------------------------- já existentes ---------------------------- */
    fonte({
      id: "cdc",
      titulo: "Benefits of Quitting",
      orgao: "CDC (EUA)",
      url: "https://www.cdc.gov/tobacco/about/benefits-of-quitting.html",
      dataDaPagina: "2024-05-15",
      verificadoEm: "2026-10-26",
      verificacao: "pagina lida",
      pais: "EUA",
    }),
    fonte({
      id: "nhs",
      titulo: "Benefits of quitting smoking",
      orgao: "NHS (Reino Unido)",
      url: "https://www.nhs.uk/better-health/quit-smoking/benefits-of-quitting-smoking/",
      dataDaPagina: null,
      verificadoEm: "2026-10-26",
      verificacao: "pagina lida",
      pais: "Reino Unido",
    }),
    fonte({
      id: "lally",
      titulo: "How are habits formed: Modelling habit formation in the real world",
      orgao: "Lally et al., European Journal of Social Psychology, 2010",
      url: "https://bps.org.uk/research-digest/how-form-habit",
      dataDaPagina: null,
      verificadoEm: "2026-10-26",
      verificacao: "resumo de busca",
    }),

    /* -------------------------------- unhas --------------------------------- */
    fonte({
      id: "aad-unhas",
      titulo: "How to stop biting your nails",
      orgao: "American Academy of Dermatology (AAD)",
      url: "https://www.aad.org/public/everyday-care/nail-care-secrets/basics/stop-biting-nails",
      dataDaPagina: "2024-12-04",
      verificacao: "pagina lida",
      pais: "EUA",
      observacao:
        "A página não trata de recuperação das unhas após parar, nem de prazos, nem de dentes.",
    }),
    fonte({
      id: "bfrb-unhas",
      titulo: "How Nail Biting Affects Your Health",
      orgao: "The TLC Foundation for BFRBs",
      url: "https://www.bfrb.org/articles/how-nail-biting-affects-your-health",
      dataDaPagina: "2025-03-28",
      verificacao: "pagina lida",
      pais: "EUA",
      observacao:
        "Organização de apoio a comportamentos repetitivos focados no corpo; sem revisor listado. A página também não informa se ou quando as unhas se recuperam.",
    }),

    /* ----------------------------- escitalopram ----------------------------- */
    fonte({
      id: "bula-escitalopram-br",
      titulo: "Bula do paciente — oxalato de escitalopram, comprimidos revestidos (genérico, VP06)",
      orgao: "Novartis Biociências S.A. — Bula Padrão aprovada pela Anvisa em 05/12/2024",
      url: "https://portal.novartis.com.br/medicamentos/wp-content/uploads/2022/11/Bula-OXALATO-DE-ESCITALOPRAM-Comprimido-revestido-Paciente.pdf",
      dataDaPagina: "2024-12-05",
      verificacao: "pagina lida",
      pais: "Brasil",
      observacao:
        "Texto do fabricante do genérico. A versão vigente do SEU medicamento deve ser conferida na bula que acompanha a caixa e no Bulário Eletrônico da Anvisa, que não foi consultado.",
    }),
    fonte({
      id: "medlineplus-escitalopram",
      titulo: "Escitalopram",
      orgao: "MedlinePlus (Biblioteca Nacional de Medicina, EUA)",
      url: "https://www.medlineplus.gov/druginfo/meds/a603005.html",
      dataDaPagina: "2025-10-15",
      verificacao: "pagina lida",
      pais: "EUA",
      observacao: "Os telefones de emergência da página são dos EUA e não são usados pelo app.",
    }),
    fonte({
      id: "nhs-escitalopram",
      titulo: "Escitalopram",
      orgao: "NHS (Reino Unido)",
      url: "https://www.nhs.uk/medicines/escitalopram/",
      dataDaPagina: "2026-06-18",
      verificacao: "pagina lida",
      pais: "Reino Unido",
      observacao: "Os telefones de urgência da página (111, 999) são do Reino Unido e não são usados pelo app.",
    }),

    /* ------------------------------ outros temas ---------------------------- */
    fonte({
      id: "nhs-sono",
      titulo: "How to fall asleep faster and sleep better",
      orgao: "NHS — Every Mind Matters (Reino Unido)",
      url: "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/how-to-fall-asleep-faster-and-sleep-better/",
      dataDaPagina: null,
      verificacao: "pagina lida",
      pais: "Reino Unido",
      observacao: "A página não exibe data de revisão e não informa quantas horas de sono um adulto precisa.",
    }),
    fonte({
      id: "nhs-respiracao",
      titulo: "Breathing exercises for stress",
      orgao: "NHS (Reino Unido)",
      url: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/",
      dataDaPagina: "2026-06-12",
      verificacao: "pagina lida",
      pais: "Reino Unido",
    }),
    fonte({
      id: "nhs-atividade-adultos",
      titulo: "Physical activity guidelines for adults aged 19 to 64",
      orgao: "NHS (Reino Unido)",
      url: "https://www.nhs.uk/live-well/exercise/exercise-guidelines/physical-activity-guidelines-for-adults-aged-19-to-64/",
      dataDaPagina: "2024-05-22",
      verificacao: "pagina lida",
      pais: "Reino Unido",
    }),
    fonte({
      id: "guia-ms-atividade",
      titulo: "Ministério da Saúde do Brasil lança Guia de Atividade Física para a População Brasileira",
      orgao: "OPAS/OMS (notícia sobre o guia do Ministério da Saúde)",
      url: "https://www.paho.org/pt/noticias/30-6-2021-ministerio-da-saude-do-brasil-lanca-guia-atividade-fisica-para-populacao",
      dataDaPagina: "2021-06-30",
      verificacao: "resumo de busca",
      pais: "Brasil",
      observacao: "Usada só para indicar que o guia brasileiro existe; as metas citadas vêm do NHS.",
    }),
    fonte({
      id: "medlineplus-cafeina",
      titulo: "Caffeine",
      orgao: "MedlinePlus (Biblioteca Nacional de Medicina, EUA)",
      url: "https://medlineplus.gov/caffeine.html",
      dataDaPagina: "2021-09-08",
      verificacao: "pagina lida",
      pais: "EUA",
      observacao: "Página de 2021, sem data de revisão.",
    }),
    fonte({
      id: "nhs-higiene-bucal",
      titulo: "How to keep your teeth clean",
      orgao: "NHS (Reino Unido)",
      url: "https://www.nhs.uk/live-well/healthy-teeth-and-gums/how-to-keep-your-teeth-clean/",
      dataDaPagina: "2025-06-30",
      verificacao: "pagina lida",
      pais: "Reino Unido",
      observacao:
        "Orientações brasileiras citadas em reportagens variam (2 a 3 escovações por dia); não foi encontrada página oficial do Ministério da Saúde para conferir.",
    }),
    fonte({
      id: "nhs-terapias",
      titulo: "NHS talking therapies",
      orgao: "NHS (Reino Unido)",
      url: "https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/nhs-talking-therapies/",
      dataDaPagina: "2025-11-05",
      verificacao: "pagina lida",
      pais: "Reino Unido",
      observacao: "Descreve o serviço do Reino Unido; o caminho de acesso no Brasil (SUS, planos, clínicas) é diferente.",
    }),
    fonte({
      id: "nhs-5-passos",
      titulo: "5 steps to mental wellbeing",
      orgao: "NHS (Reino Unido)",
      url: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/five-steps-to-mental-wellbeing/",
      dataDaPagina: "2026-10-14",
      verificacao: "pagina lida",
      pais: "Reino Unido",
    }),
    fonte({
      id: "cvv",
      titulo: "Centro de Valorização da Vida",
      orgao: "CVV (Brasil)",
      url: "https://www.cvv.org.br/",
      dataDaPagina: null,
      verificacao: "pagina lida",
      pais: "Brasil",
    }),

    /* ------------- linha do tempo dos marcos (lidas em 2026-10-27) ------------ */
    fonte({
      id: "nhs-escitalopram-perguntas",
      titulo: "Common questions about escitalopram",
      orgao: "NHS (Reino Unido)",
      url: "https://www.nhs.uk/medicines/escitalopram/common-questions-about-escitalopram/",
      dataDaPagina: "2026-06-18",
      verificacao: "pagina lida",
      pais: "Reino Unido",
    }),
    fonte({
      id: "nhs-escitalopram-efeitos",
      titulo: "Side effects of escitalopram",
      orgao: "NHS (Reino Unido)",
      url: "https://www.nhs.uk/medicines/escitalopram/side-effects-of-escitalopram/",
      dataDaPagina: "2026-06-18",
      verificacao: "pagina lida",
      pais: "Reino Unido",
      observacao: "Os telefones de urgência da página são do Reino Unido e não são usados pelo app.",
    }),
    fonte({
      id: "bionumbers-unhas",
      titulo: "Average fingernail and toenail growth rate (BNID 112380)",
      orgao: "BioNumbers — Harvard Medical School (dado de Yaemsiri et al., J Eur Acad Dermatol Venereol, 2010)",
      url: "https://bionumbers.hms.harvard.edu/bionumber.aspx?id=112380",
      dataDaPagina: null,
      verificacao: "pagina lida",
      pais: "EUA",
      observacao:
        "Média de um estudo com adultos jovens saudáveis dos EUA. Foi lida a ficha do BioNumbers com o resumo do artigo; o artigo original não foi aberto (o PubMed pediu verificação).",
    }),
    fonte({
      id: "twohig-2003-unhas",
      titulo: "Evaluating the efficacy of habit reversal: comparison with a placebo control",
      orgao: "J Clin Psychiatry, 2003;64(1):40-48 (resumo do artigo)",
      url: "https://www.psychiatrist.com/jcp/evaluating-efficacy-habit-reversal-comparison-placebo/",
      dataDaPagina: "2003-01-01",
      verificacao: "pagina lida",
      pais: "EUA",
      observacao: "Foi lido o resumo. Estudo pequeno: 30 adultos que roíam unhas, 25 concluíram.",
    }),
    fonte({
      id: "ghanizadeh-2013-unhas",
      titulo: "Habit Reversal versus Object Manipulation Training for Treating Nail Biting: A Randomized Controlled Clinical Trial",
      orgao: "Iran J Psychiatry, 2013;8(2):61-67 (PMC3796295)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/3796295",
      dataDaPagina: "2013-01-01",
      verificacao: "pagina lida",
      pais: "Irã",
      observacao: "Foi lido o resumo. Estudo com crianças e adolescentes (91 participantes).",
    }),
    fonte({
      id: "nhs-abstinencia-nicotina",
      titulo: "Managing nicotine withdrawal symptoms",
      orgao: "NHS — Better Health (Reino Unido)",
      url: "https://www.nhs.uk/better-health/quit-smoking/staying-smoke-free/managing-nicotine-withdrawal-symptoms/",
      dataDaPagina: null,
      verificacao: "pagina lida",
      pais: "Reino Unido",
      observacao:
        "A página fala de parar de fumar. O app a usa também para o vape porque a abstinência é de nicotina, e o texto do marco diz isso.",
    }),
    fonte({
      id: "cdc-vape",
      titulo: "Health Effects of Vaping",
      orgao: "CDC (EUA)",
      url: "https://www.cdc.gov/tobacco/e-cigarettes/health-effects.html",
      dataDaPagina: "2025-01-31",
      verificacao: "pagina lida",
      pais: "EUA",
    }),
    fonte({
      id: "medlineplus-abstinencia-alcool",
      titulo: "Alcohol withdrawal",
      orgao: "MedlinePlus (Biblioteca Nacional de Medicina, EUA)",
      url: "https://medlineplus.gov/ency/article/000764.htm",
      dataDaPagina: "2025-01-01",
      verificacao: "pagina lida",
      pais: "EUA",
      observacao: "O telefone de emergência da página é dos EUA; o app usa o SAMU 192.",
    }),
    fonte({
      id: "nhs-reduzir-alcool",
      titulo: "Tips on cutting down alcohol",
      orgao: "NHS (Reino Unido)",
      url: "https://www.nhs.uk/live-well/alcohol-advice/tips-on-cutting-down-alcohol/",
      dataDaPagina: "2026-04-09",
      verificacao: "pagina lida",
      pais: "Reino Unido",
    }),
  ].map((f) => [f.id, f])
);

/**
 * Fontes indicadas que NÃO foi possível ler. Ficam registradas para ninguém
 * achar que foram consultadas — e nenhuma afirmação do catálogo pode usá-las.
 */
export const FONTES_PENDENTES: { id: string; url: string; motivo: string }[] = [
  {
    id: "hse-escitalopram",
    url: "https://www2.hse.ie/medicines/escitalopram/",
    motivo: "HTTP 403 ao acessar; conteúdo não lido. Além disso, é um serviço da Irlanda.",
  },
  {
    id: "bvs-onicofagia",
    url: "https://bvsms.saude.gov.br/habito-de-roer-as-unhas-onicofagia/",
    motivo: "HTTP 503 em duas tentativas; conteúdo não lido. Seria a fonte brasileira para unhas.",
  },
  {
    id: "anvisa-bulario",
    url: "https://consultas.anvisa.gov.br/#/bulario/",
    motivo: "Bulário Eletrônico não consultado (aplicação dinâmica). A bula usada é a do fabricante, cópia da bula padrão.",
  },
];

export function fontePorId(id: string): Fonte | undefined {
  return FONTES[id];
}

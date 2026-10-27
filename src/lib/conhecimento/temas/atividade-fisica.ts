import type { Tema } from "../tipos.ts";

/**
 * Caminhar e se movimentar; pausas para levantar.
 *
 * Fontes lidas: NHS "Physical activity guidelines for adults aged 19 to 64" (revisada em 22/05/2024) e
 * NHS "5 steps to mental wellbeing". O guia do Ministério da Saúde do Brasil só foi visto por resumo de busca
 * e não é citado aqui: as metas abaixo são as do NHS e dizem isso.
 */
export const atividadeFisica: Tema = {
  id: "atividade-fisica",
  categoria: "rotina",
  titulo: "Caminhar e se movimentar",
  nomesAlternativos: ["caminhada", "caminhar", "atividade fisica", "exercicio", "pausas", "levantar do computador", "sedentarismo", "sentado o dia todo"],
  termos: ["caminhada", "caminhar", "exercicio", "treino", "pausa", "sentado", "sedentario", "academia", "mexer", "movimento"],
  descricao:
    "Movimentar-se com regularidade e interromper longos períodos sentado. Aqui estão metas de uma fonte oficial do Reino Unido para adultos e ideias para encaixar movimento na rotina de trabalho ou estudo, sem exigir academia.",
  objetivos: [
    "Incluir movimento na maioria dos dias da semana",
    "Fazer pausas para levantar durante o trabalho ou estudo",
    "Escolher atividades de que você goste, para durar",
  ],
  beneficios: [
    {
      id: "risco-cardiaco",
      texto: "A fonte afirma que se exercitar uma ou duas vezes por semana já pode reduzir o risco de doença do coração e de AVC.",
      fontes: ["nhs-atividade-adultos"],
    },
    {
      id: "humor",
      texto: "A atividade física pode aumentar a autoestima, ajudar a definir e alcançar metas e causar mudanças químicas no cérebro que podem melhorar o humor.",
      fontes: ["nhs-5-passos"],
    },
    {
      id: "sono",
      texto: "A atividade física regular pode ajudar a dormir melhor, e até pequenas quantidades ajudam.",
      fontes: ["nhs-sono"],
    },
    {
      id: "equilibrio",
      texto: "Exercícios de força e de flexibilidade podem construir músculo, melhorar o equilíbrio e reduzir dor nas articulações.",
      fontes: ["nhs-5-passos"],
    },
  ],
  marcos: [],
  estrategias: [
    { id: "meta-semanal", titulo: "Uma meta semanal simples", texto: "A fonte sugere, para adultos, pelo menos 150 minutos de atividade moderada por semana (ou 75 de intensa), distribuídos em 4 a 5 dias ou todos os dias, mais força em 2 dias. Se ainda estiver longe, comece por menos e vá somando aos poucos.", quando: ["quanto exercicio", "meta", "minutos por semana"], fontes: ["nhs-atividade-adultos"] },
    { id: "caminhada-rapida", titulo: "Caminhada em passo rápido", texto: "A fonte classifica a caminhada rápida como atividade moderada. Dá para caminhar até o trabalho, descer um ponto antes ou fazer uma volta após o almoço.", quando: ["caminhar", "caminhada", "sem tempo"], fontes: ["nhs-atividade-adultos"] },
    { id: "pausas", titulo: "Quebre o tempo sentado", texto: "Passe menos tempo sentado ou deitado e interrompa longos períodos de inatividade com algum movimento: levantar para beber água, alongar, atender uma ligação em pé.", quando: ["sentado", "computador", "estudando o dia todo", "pausa"], fontes: ["nhs-atividade-adultos"] },
    { id: "gosto", titulo: "Escolha o que você gosta", texto: "Não é preciso passar horas na academia. Escolha atividades de que goste e encaixe-as na rotina; assim é mais provável que durem.", quando: ["nao gosto", "academia", "preguica", "motivacao"], fontes: ["nhs-5-passos"] },
    { id: "gradual", titulo: "Vá ampliando aos poucos", texto: "Quem está começando pode somar poucos minutos por dia e ir ampliando gradualmente. Registrar o que fez ajuda a ver o próprio caminho.", quando: ["comecar", "sedentario", "voltar a treinar"], fontes: ["nhs-sono"] },
  ],
  faq: [
    { id: "quanto-por-semana", pergunta: "Quanto de atividade devo fazer por semana?", resposta: "A fonte do Reino Unido para adultos de 19 a 64 anos indica pelo menos 150 minutos de atividade moderada ou 75 minutos de atividade intensa por semana, em 4 a 5 dias ou todos os dias, mais atividades de força em pelo menos 2 dias. Essas metas não levam em conta condições de saúde individuais: converse com um profissional se tiver dúvida.", termos: ["quanto exercicio", "minutos por semana", "meta", "recomendacao"], fontes: ["nhs-atividade-adultos"] },
    { id: "caminhada-conta", pergunta: "Caminhar conta como exercício?", resposta: "A caminhada rápida é listada pela fonte como atividade moderada. Subir escadas aparece como atividade intensa.", termos: ["caminhada", "caminhar", "andar", "escada"], fontes: ["nhs-atividade-adultos"] },
    { id: "pouco-tempo", pergunta: "Se eu fizer pouco, adianta?", resposta: "A fonte afirma que se exercitar uma ou duas vezes por semana já pode reduzir o risco de doença do coração e de AVC. Mais regularidade amplia o que se descreve, mas começar pequeno conta.", termos: ["pouco tempo", "adianta", "uma vez por semana", "sem tempo"], fontes: ["nhs-atividade-adultos"] },
    { id: "pausa-trabalho", pergunta: "Como fazer pausas durante o trabalho ou estudo?", resposta: "A fonte orienta reduzir o tempo sentado e interromper longos períodos de inatividade com movimento. Pode ser levantar, alongar ou andar um pouco; o app não define uma duração ou frequência exatas, pois a fonte não as traz.", termos: ["pausa", "sentado", "computador", "levantar", "trabalho", "estudo"], fontes: ["nhs-atividade-adultos"] },
  ],
  dificuldades: [
    { id: "falta-tempo", titulo: "Falta de tempo", texto: "Blocos curtos espalhados no dia também contam como movimento. Pensar em encaixar, e não em reservar uma hora inteira, costuma ajudar." },
    { id: "desanimo", titulo: "Desânimo para começar", texto: "A vontade muitas vezes aparece depois que você começa. Combinar com alguém ou escolher algo de que goste torna o primeiro passo mais leve." },
    { id: "semana-ruim", titulo: "Uma semana sem conseguir", texto: "Interromper acontece. Retomar com menos do que antes é melhor do que esperar o momento perfeito." },
  ],
  sinaisDeAjuda: [
    { texto: "Se você sente dor no peito, falta de ar fora do esperado ou tontura ao se exercitar, pare e procure atendimento médico. Se for forte ou repentino, ligue SAMU 192.", nivel: "urgencia" },
    { texto: "Se você tem uma condição de saúde, está há muito tempo sem se exercitar ou tem dores recorrentes, converse com um profissional antes de aumentar a intensidade.", nivel: "converse-com-profissional" },
  ],
  limites: [
    "O app não prescreve exercício nem avalia se uma atividade é adequada para a sua condição de saúde.",
    "As metas vêm do NHS (Reino Unido); o guia do Ministério da Saúde do Brasil não foi lido por inteiro e não é usado como fonte.",
    "Registrar movimento não mede condicionamento físico nem saúde.",
  ],
  oQueObservar: [
    "Em quais dias da semana você conseguiu se movimentar e o que ajudou nesses dias.",
    "Quanto tempo você costuma ficar sentado de uma vez e se consegue quebrar esse período.",
    "Como você percebe o seu humor e o seu sono nos dias com mais movimento, sem tirar conclusões de causa.",
  ],
  rastreio: { tipo: "nenhum" },
  versao: 1,
  revisadoEm: "2026-10-27",
  status: "fontes-conferidas",
  notaEditorial:
    "Fontes: NHS (guia de atividade para adultos, revisão de 22/05/2024) e NHS (5 passos para o bem-estar, sem data). Metas do Reino Unido; não foi lida uma fonte brasileira completa. Os sinais de urgência desta página são orientação geral de bom senso e não foram retirados da fonte; não houve revisão por profissional de saúde.",
};

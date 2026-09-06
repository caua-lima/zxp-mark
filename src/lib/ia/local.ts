/**
 * Motor local — responde sem nenhuma API, de graça e instantaneamente.
 *
 * Não é um LLM: é um classificador de intenção por palavra-chave que monta a
 * resposta com os NÚMEROS REAIS do retrato. Ele nunca inventa nada e nunca
 * fica fora do ar, então serve tanto como modo gratuito padrão quanto como
 * rede de segurança quando um provedor externo falha ou estoura o limite.
 */
import { duracaoExtenso, reais, rotuloMs } from "@/lib/formato";
import { DIA } from "@/lib/habitos";
import { marcoPrincipal, type Retrato, type RetratoMarco } from "@/lib/ia/contexto";

/* ------------------------------ utilidades ------------------------------ */

function normalizar(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const tem = (t: string, ...termos: string[]) => termos.some((x) => t.includes(x));

/**
 * A pergunta e sobre uma contagem regressiva? Precisa vir antes de
 * "quanto tempo", senao "quantos dias faltam pra viagem" e lido como
 * pergunta sobre o habito.
 */
function ehSobreContagem(r: Retrato, t: string): boolean {
  if (tem(t, "contagem", "regressiva", "quando chega", "quando e a", "quando e o")) return true;
  const palavras = r.contagens
    .flatMap((c) => normalizar(c.titulo).split(" "))
    .filter((w) => w.length >= 4);
  return palavras.some((w) => t.includes(w));
}

/** Escolha estável mas variada: mesma pergunta seguida não repete a resposta. */
function escolher<T>(lista: T[], semente: number): T {
  return lista[Math.abs(Math.floor(semente)) % lista.length];
}

/* ------------------------- ações de 5 minutos ---------------------------- */

const ACOES_MADRUGADA = [
  "Sai da cama, vai até a cozinha e bebe um copo de água inteiro, de uma vez.",
  "Lava o rosto com água fria. Só isso, agora.",
  "Deixa o celular longe da cama e deita de lado. Decidir deitado no escuro nunca dá certo.",
  "Respiração 4-7-8: inspira em 4, segura 7, solta em 8. Quatro ciclos.",
];

const ACOES_MANHA = [
  "Toma banho agora. A vontade da manhã é a mais previsível e a que mais some no chuveiro.",
  "Escova os dentes. Sério: muda o gosto da boca e quebra o automático.",
  "Sai pra caminhar 5 minutos, mesmo que seja na calçada da frente.",
  "Bebe dois copos de água antes do café. A fissura da manhã costuma vir junto com desidratação.",
];

const ACOES_TARDE = [
  "Copo de água gelada de uma vez. Depois 20 agachamentos.",
  "Sai do ambiente por 3 minutos. Muda de cômodo, de andar, de calçada — só sai.",
  "20 flexões ou uma escada subida e descida. O corpo ocupado desliga a cabeça.",
  "Chiclete, bala de menta ou uma fruta. A boca ocupada resolve boa parte.",
];

const ACOES_NOITE = [
  "Escova os dentes e não come mais nada. Fecha o dia.",
  "Lava a louça, arruma uma gaveta, dobra roupa. Mão ocupada por 5 minutos.",
  "Banho, mesmo que rápido. Depois do banho a vontade quase nunca volta igual.",
  "Manda mensagem pra alguém que te conhece. Não precisa falar do assunto.",
];

function acaoAgora(hora: number, semente: number): string {
  if (hora < 6) return escolher(ACOES_MADRUGADA, semente);
  if (hora < 12) return escolher(ACOES_MANHA, semente);
  if (hora < 18) return escolher(ACOES_TARDE, semente);
  return escolher(ACOES_NOITE, semente);
}

const FECHOS = [
  "Me conta em 5 minutos como ficou?",
  "Consegue fazer isso agora e me dizer?",
  "O que estava acontecendo logo antes da vontade bater?",
  "Onde você está agora — em casa, na rua, no trabalho?",
  "Tenta e volta aqui. Eu fico.",
];

/* ---------------------------- peças de texto ----------------------------- */

function statusDe(m: RetratoMarco): string {
  return `${duracaoExtenso(m.decorridoMs)} ${m.sufixo}`;
}

function oQueSePerde(m: RetratoMarco): string {
  const partes = [`${duracaoExtenso(m.decorridoMs)} de sequência`];
  if (m.dinheiro && m.dinheiro >= 1) partes.push(`${reais(m.dinheiro)} economizados`);
  if (m.unidades && m.unidades >= 1) partes.push(`${m.unidades} ${m.unidadeNome} que você não consumiu`);
  return partes.join(", ");
}

function proximoEmFrase(m: RetratoMarco): string | null {
  if (!m.proximo || m.faltaMs === null) return null;
  return `"${m.proximo.titulo}" — faltam ${duracaoExtenso(m.faltaMs)}`;
}

const SEM_MARCO =
  "Você ainda não tem nenhum marco cadastrado, então não sei do que estamos falando. Cria um na aba Marcos que eu passo a acompanhar o seu tempo de verdade — e a partir daí eu respondo com os seus números, não com conselho genérico.";

/* ------------------------------- respostas ------------------------------- */

function respVontade(r: Retrato, m: RetratoMarco, s: number): string {
  const l: string[] = [];

  l.push(
    escolher(
      [
        "A vontade é química e vem em onda: sobe, estoura e cai em 3 a 5 minutos. Ela não cresce pra sempre.",
        "Isso que você está sentindo tem prazo. Onda de fissura dura poucos minutos — o que você faz nesses minutos é que decide.",
        "Normal, esperado, e temporário. Não é fraqueza sua: é o corpo cobrando um hábito antigo.",
      ],
      s
    )
  );

  l.push("");
  l.push(`Você está com ${oQueSePerde(m)}. Isso tudo zera junto se você ceder agora.`);

  const prox = proximoEmFrase(m);
  if (prox && m.faltaMs !== null && m.faltaMs < 2 * DIA) {
    l.push(`E olha o que está logo ali: ${prox}.`);
  }

  if (m.porque) {
    l.push("");
    l.push(`Você escreveu, com as suas palavras: "${m.porque}"`);
  }

  l.push("");
  l.push(`Próximos 5 minutos: ${acaoAgora(r.hora, s)}`);
  l.push("");
  l.push(escolher(FECHOS, s + 1));

  return l.join("\n");
}

function respPorqueNao(r: Retrato, m: RetratoMarco, s: number): string {
  const l: string[] = [];
  l.push(`Porque você está com ${statusDe(m)} e um único deslize apaga tudo isso de uma vez.`);

  if (m.anterior) {
    l.push("");
    l.push(`O último marco que você bateu foi "${m.anterior.titulo}". ${m.anterior.corpo}`);
  }

  const prox = proximoEmFrase(m);
  if (prox) {
    l.push("");
    l.push(`E o próximo é ${prox}. Você não está no começo — está no meio de algo.`);
  }

  if (m.dinheiro && m.dinheiro >= 5) {
    l.push("");
    l.push(`Sem contar os ${reais(m.dinheiro)} que ficaram no seu bolso nesta sequência.`);
  }

  l.push("");
  l.push(
    escolher(
      [
        'O "só um" é a única porta de volta ao dia zero. Não existe versão pequena disso.',
        "Ceder agora não resolve a vontade: adia ela pra daqui a duas horas, com o contador zerado.",
        "A vontade vai passar de qualquer jeito. A diferença é se ela passa com você inteiro ou no dia zero.",
      ],
      s
    )
  );

  return l.join("\n");
}

function respQuantoTempo(r: Retrato, s: number): string {
  const l: string[] = [];
  for (const m of r.marcos) {
    const prox = proximoEmFrase(m);
    l.push(`${m.emoji} ${m.titulo}: ${statusDe(m)}.${prox ? ` Próximo: ${prox}.` : ""}`);
  }
  const p = r.marcos[0];
  l.push("");
  l.push(
    p.melhorMs > p.decorridoMs
      ? `Seu recorde é ${duracaoExtenso(p.melhorMs)}. Dá pra passar.`
      : escolher(
          [
            "E esse é o seu recorde. Você está no melhor momento até hoje.",
            "Nenhuma sequência sua durou mais que essa. Está escrevendo o recorde agora.",
          ],
          s
        )
  );
  return l.join("\n");
}

function respCorpo(m: RetratoMarco): string {
  const l: string[] = [];
  if (m.anterior) {
    l.push(`Você passou por "${m.anterior.titulo}". ${m.anterior.corpo}`);
  } else {
    l.push(`Você está há ${duracaoExtenso(m.decorridoMs)} — ainda nas primeiras horas, que são as mais barulhentas.`);
  }
  if (m.proximo && m.faltaMs !== null) {
    l.push("");
    l.push(`Daqui a ${duracaoExtenso(m.faltaMs)} chega "${m.proximo.titulo}": ${m.proximo.corpo}`);
  }
  if (m.minutosVida && m.minutosVida > 60) {
    l.push("");
    l.push(`Estimativa acumulada nesta sequência: cerca de ${Math.round(m.minutosVida / 60)} horas de vida de volta.`);
  }
  l.push("");
  l.push("Tem a linha do tempo inteira do seu hábito na tela do marco, marco a marco.");
  return l.join("\n");
}

function respRecaida(r: Retrato, m: RetratoMarco, s: number): string {
  const l: string[] = [];
  l.push(
    escolher(
      [
        "Recaída é dado, não fracasso. O que importa agora é o que você faz nos próximos 10 minutos, não o que aconteceu.",
        "Aconteceu. Isso não apaga o que você já provou que consegue — apaga só o contador.",
        "Uma recaída não desfaz o aprendizado. Desfaz o número, e número a gente reconstrói.",
      ],
      s
    )
  );

  if (m.recaidas.length) {
    const gatilhos = m.recaidas.map((x) => x.gatilho).filter(Boolean) as string[];
    if (gatilhos.length) {
      const contagem = new Map<string, number>();
      for (const g of gatilhos) contagem.set(g, (contagem.get(g) ?? 0) + 1);
      const [top, n] = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0];
      l.push("");
      l.push(
        n > 1
          ? `Olhando o seu histórico: "${top}" já apareceu ${n} vezes como gatilho. Esse é o padrão a atacar — não a força de vontade.`
          : `No seu histórico o gatilho registrado foi "${top}". Vale planejar o que fazer da próxima vez que isso aparecer.`
      );
    }
    const maisLonga = Math.max(...m.recaidas.map((x) => x.duracaoMs), m.melhorMs);
    l.push("");
    l.push(`Sua maior sequência foi ${duracaoExtenso(maisLonga)}. Você já foi até lá — o caminho existe.`);
  }

  l.push("");
  l.push('Registra no botão "Registrar recaída" com o gatilho. É o que faz a próxima tentativa ser diferente desta.');
  return l.join("\n");
}

function respDinheiro(r: Retrato): string {
  const comGasto = r.marcos.filter((m) => m.dinheiro && m.dinheiro > 0);
  if (comGasto.length === 0) {
    return "Você ainda não preencheu quanto o hábito te custava por dia. Coloca isso nos ajustes do marco (R$ por dia) que eu passo a somar em tempo real — costuma ser o número que mais impressiona.";
  }
  const total = comGasto.reduce((a, m) => a + (m.dinheiro ?? 0), 0);
  const l: string[] = [];
  for (const m of comGasto) {
    const porMes = (m.dinheiro! / (m.decorridoMs / DIA)) * 30;
    l.push(
      `${m.emoji} ${m.titulo}: ${reais(m.dinheiro!)} nesta sequência${
        m.decorridoMs > DIA ? ` — no ritmo atual, ${reais(porMes)} por mês` : ""
      }.`
    );
  }
  if (comGasto.length > 1) {
    l.push("");
    l.push(`Total: ${reais(total)}.`);
  }
  const m0 = comGasto[0];
  if (m0.unidades) {
    l.push("");
    l.push(`E ${m0.unidades} ${m0.unidadeNome} que simplesmente não entraram em você.`);
  }
  return l.join("\n");
}

function respProximo(m: RetratoMarco): string {
  if (!m.proximo || m.faltaMs === null) {
    return `Você bateu todos os ${m.totalMarcos} marcos de "${m.titulo}". Não tem mais topo nessa lista — agora é só manter, e manter é o mais difícil e o mais valioso.`;
  }
  return [
    `Próximo: "${m.proximo.titulo}" (${rotuloMs(m.proximo.ms)}).`,
    `Faltam ${duracaoExtenso(m.faltaMs)}.`,
    "",
    m.proximo.corpo,
    "",
    `Já são ${m.atingidos.length} de ${m.totalMarcos} conquistados.`,
  ].join("\n");
}

function respContagem(r: Retrato): string {
  const futuras = r.contagens.filter((c) => c.faltaMs > 0);
  if (futuras.length === 0) {
    return "Você não tem nenhuma contagem em aberto. Marca uma data na aba Contagens — viagem, aniversário, prova — que eu conto os dias e te aviso quando estiver chegando.";
  }
  const l = futuras.map((c) => {
    const dias = Math.ceil(c.faltaMs / DIA);
    return `${c.emoji} ${c.titulo}: ${dias === 0 ? "é hoje!" : `faltam ${dias} ${dias === 1 ? "dia" : "dias"}`}${
      c.descricao ? ` — ${c.descricao}` : ""
    }`;
  });
  const prim = futuras[0];
  const p = marcoPrincipal(r);
  if (p && prim.faltaMs > 0) {
    const naData = p.decorridoMs + prim.faltaMs;
    l.push("");
    l.push(`Detalhe bom: quando "${prim.titulo}" chegar, você vai estar com ${duracaoExtenso(naData)} ${p.sufixo}.`);
  }
  return l.join("\n");
}

function respMotivacao(r: Retrato, m: RetratoMarco, s: number): string {
  const l: string[] = [];
  l.push(`${statusDe(m)}. Isso não foi sorte — foi decisão repetida, muitas vezes, inclusive hoje.`);
  if (m.porque) {
    l.push("");
    l.push(`Foi por isso que você começou: "${m.porque}"`);
  }
  l.push("");
  l.push(
    escolher(
      [
        `Você já conquistou ${m.atingidos.length} marcos. Ninguém te deu nenhum deles.`,
        "Desanimar faz parte. Desistir é outra coisa — e você não fez isso hoje.",
        "Não precisa estar motivado. Precisa só não ceder nas próximas horas. Motivação vem depois, não antes.",
      ],
      s
    )
  );
  const prox = proximoEmFrase(m);
  if (prox) {
    l.push("");
    l.push(`Foco curto: ${prox}.`);
  }
  return l.join("\n");
}

function respSaudacao(r: Retrato, s: number): string {
  const saud = r.hora < 12 ? "Bom dia" : r.hora < 18 ? "Boa tarde" : "Boa noite";
  const m = marcoPrincipal(r);
  if (!m) return `${saud}, ${r.primeiroNome}. ${SEM_MARCO}`;
  return [
    `${saud}, ${r.primeiroNome}. Você está com ${statusDe(m)}.`,
    proximoEmFrase(m) ? `Próximo: ${proximoEmFrase(m)}.` : "",
    "",
    escolher(
      ["Como você está agora?", "Tudo tranquilo hoje?", "Precisa de alguma coisa ou é só o check?"],
      s
    ),
  ]
    .filter(Boolean)
    .join("\n");
}

function respFallback(r: Retrato, m: RetratoMarco | null, s: number): string {
  const l: string[] = [];
  if (m) {
    l.push(`Você está com ${statusDe(m)}${proximoEmFrase(m) ? `, e o próximo é ${proximoEmFrase(m)}` : ""}.`);
    l.push("");
  }
  l.push("Não peguei exatamente o que você quis dizer. Posso te ajudar com:");
  l.push("");
  l.push("· Estou com vontade — te dou um plano pros próximos 5 minutos");
  l.push("· Por que não devo ceder agora");
  l.push("· Quanto tempo eu já aguentei");
  l.push("· O que está acontecendo no meu corpo");
  l.push("· Quanto já economizei");
  l.push("· Recaí, e agora");
  l.push("");
  l.push(escolher(["Escreve do seu jeito que eu entendo.", "Pode falar com as suas palavras."], s));
  return l.join("\n");
}

function respSoUm(m: RetratoMarco, s: number): string {
  return [
    escolher(
      [
        'Não existe "só um". Existe o primeiro — e o segundo vem sozinho, mais fácil, mais rápido.',
        'O "só um" não é uma dose menor. É o botão que zera o contador e devolve o hábito inteiro.',
        "Se um fosse suficiente, você não estaria contando os dias. Você já testou essa hipótese antes.",
      ],
      s
    ),
    "",
    `Na prática: você troca ${duracaoExtenso(m.decorridoMs)} por poucos minutos. E amanhã recomeça do zero, com a vontade igualzinha.`,
    "",
    "O que costuma funcionar é adiar, não negociar. Diz pra você mesmo: agora não, daqui a 20 minutos eu decido. Quase sempre não chega a decidir.",
  ].join("\n");
}

function respDuracao(): string {
  return [
    "Uma onda de fissura dura de 3 a 5 minutos. Não meia hora, não a tarde inteira — minutos.",
    "",
    "Ela sobe rápido, estoura e cai. O erro clássico é achar que vai piorar pra sempre e ceder no pico, que é justo o momento em que ela já ia começar a descer.",
    "",
    "Marca no relógio da próxima vez. Ver o tempo passar tira o poder dela.",
  ].join("\n");
}

function respGatilho(m: RetratoMarco): string {
  const gatilhos = m.recaidas.map((r) => r.gatilho).filter(Boolean) as string[];
  if (gatilhos.length === 0) {
    return [
      "Você ainda não registrou nenhum gatilho, então não tenho o seu padrão — só os comuns.",
      "",
      `Para ${m.rotulo.toLowerCase()}, os que mais aparecem são: ${m.contextoClinico.split("Gatilhos clássicos:")[1]?.trim() || "estresse, tédio, álcool e estar sozinho."}`,
      "",
      "Da próxima vez que a vontade bater forte, anota o que estava acontecendo. Três anotações e o padrão aparece sozinho.",
    ].join("\n");
  }

  const contagem = new Map<string, number>();
  for (const g of gatilhos) contagem.set(g, (contagem.get(g) ?? 0) + 1);
  const ordenado = [...contagem.entries()].sort((a, b) => b[1] - a[1]);
  const [top, n] = ordenado[0];

  return [
    `Pelo seu histórico, o seu gatilho principal é "${top}"${n > 1 ? ` — apareceu ${n} vezes` : ""}.`,
    ...(ordenado.length > 1
      ? [`Depois vêm: ${ordenado.slice(1).map(([g, c]) => `${g} (${c}x)`).join(", ")}.`]
      : []),
    "",
    "Gatilho não se enfrenta na hora, se planeja antes. Decide agora, com a cabeça fria, o que você faz da próxima vez que isso aparecer — e deixa decidido.",
    "",
    "Qual é a próxima situação em que ele provavelmente vai aparecer?",
    // Sem filter(Boolean) aqui: as strings vazias são as linhas em branco
    // que separam os parágrafos.
  ].join("\n");
}

function respFesta(m: RetratoMarco, s: number): string {
  return [
    "Evento social é onde mais gente cai — e é o mais fácil de planejar, porque você sabe que vem.",
    "",
    "Três coisas que funcionam:",
    "· Decide antes de sair, não lá dentro. Lá dentro você já negociou.",
    "· Bebida na mão o tempo todo, mesmo que seja água ou refrigerante. Mão ocupada, boca ocupada.",
    "· Combina uma saída: se apertar, você vai embora. Sem culpa, sem explicação.",
    "",
    `Você chega lá com ${duracaoExtenso(m.decorridoMs)}. Sair de lá com esse número inteiro é uma vitória bem maior do que parece.`,
    "",
    escolher(
      ["Quem vai estar com você?", "Que horas você vai?", "Alguém lá sabe que você parou?"],
      s
    ),
  ].join("\n");
}

function respAnsiedade(s: number): string {
  return [
    "Ansiedade nos primeiros dias é esperada: o que te acalmava saiu de cena e o corpo ainda não recompôs o resto.",
    "",
    "Ela diminui sozinha em algumas semanas. Enquanto isso, o que ajuda de verdade é o corpo, não a cabeça:",
    "",
    `· Respiração 4-7-8: inspira em 4, segura 7, solta em 8. Quatro ciclos, agora.`,
    "· Caminhada de 10 minutos, mesmo sem destino.",
    "· Menos cafeína — ela imita ansiedade e você não vai saber diferenciar.",
    "",
    escolher(
      ["Consegue fazer os quatro ciclos agora e me dizer como ficou?", "Dá pra sair pra caminhar agora?"],
      s
    ),
  ].join("\n");
}

function respSono(): string {
  return [
    "Sono bagunçado é dos efeitos mais comuns e dos mais chatos, porque você fica sem energia justo quando precisa dela.",
    "",
    "Costuma normalizar entre 1 e 3 semanas. Até lá:",
    "· Nada de cafeína depois das 14h.",
    "· Sol na cara pela manhã, nem que sejam 10 minutos.",
    "· Se acordar de madrugada com vontade, levanta e sai do quarto. Não decide nada deitado no escuro.",
    "",
    "Aguentar essas semanas de sono ruim é o preço de entrada. Ele acaba.",
  ].join("\n");
}

function respPeso(m: RetratoMarco): string {
  return [
    "Preocupação legítima, e vale colocar na proporção certa: o ganho médio ao parar de fumar fica em poucos quilos, e some com o tempo. O dano de voltar a fumar não some.",
    "",
    "Parte disso é a boca procurando o que fazer, não fome. Ajuda ter à mão: água gelada, chiclete sem açúcar, cenoura, maçã, gelo pra mastigar.",
    "",
    `E tem um bônus: ${m.decorridoMs > 7 * DIA ? "sua capacidade pulmonar já melhorou o suficiente pra caminhada e corrida ficarem mais fáceis" : "em uma semana sua respiração já melhora e exercício fica mais viável"}.`,
    "",
    "Uma coisa de cada vez. Primeiro o hábito, depois o peso.",
  ].join("\n");
}

function respProfissional(): string {
  return [
    "Boa pergunta, e a resposta é sim — procurar ajuda profissional aumenta muito a chance de dar certo, e não é sinal de fraqueza nenhuma.",
    "",
    "· No SUS, a Unidade Básica de Saúde mais perto tem programa de cessação de tabagismo, gratuito, com acompanhamento e medicação quando indicado.",
    "· Psicólogo ou psiquiatra ajuda principalmente quando o hábito está grudado em ansiedade ou depressão.",
    "· Grupos como AA e NA existem em quase toda cidade e não custam nada.",
    "",
    "Eu sou um app: eu conto o seu tempo e fico do seu lado às 3 da manhã. Não substituo nenhum dos três.",
  ].join("\n");
}

function respRespiracao(): string {
  return [
    "Vamos fazer agora. Respiração 4-7-8, quatro ciclos:",
    "",
    "1. Solta todo o ar pela boca.",
    "2. Inspira pelo nariz contando até 4.",
    "3. Segura contando até 7.",
    "4. Solta pela boca contando até 8, devagar.",
    "",
    "Repete quatro vezes. Leva pouco mais de um minuto e derruba a frequência cardíaca — que é justo o que sobe na fissura.",
    "",
    "Tem um contador guiado no botão aqui embaixo, se preferir seguir na tela.",
  ].join("\n");
}

/* ------------------------------- segurança ------------------------------- */

/**
 * Sinais de risco. Regex e não `includes` de propósito: "não quero mais
 * viver" não bate com a string "não quero viver", e um falso negativo aqui é
 * inaceitável. Um falso positivo custa uma mensagem a mais — sai barato.
 */
const RISCO_VIDA: RegExp[] = [
  /suicid/,
  /\bme (mat|acab|elimin)/,
  /\b(quero|queria|vou|penso em|pensando em|pensei em|to a fim de) (me )?(morrer|matar|sumir)\b/,
  /\bnao (quero|queria) (mais )?(viver|estar (aqui|vivo|viva))\b/,
  /\bnao (aguento|guento|suporto) (mais )?viver\b/,
  /\bacabar com (tudo|isso tudo|a minha vida|minha vida)\b/,
  /\b(dar|por|colocar) (um )?fim (na|a|em) (minha |essa |tudo)/,
  /\btirar (a )?(minha )?(propria )?vida\b/,
  /\bme (machucar|cortar|ferir|furar)\b/,
  /\b(sumir|desaparecer) (pra|para) sempre\b/,
  /\b(a )?vida nao (vale|faz sentido|tem sentido)/,
  /\bmelhor (se eu |eu )?(morrer|sumir|nao existir|nao estar)/,
  /\bnao vejo (mais )?saida\b/,
];

const EMERGENCIA_MEDICA: RegExp[] = [
  /\btremendo (muito|demais|sem parar)/,
  /\bconvuls/,
  /\balucin/,
  /\b(vendo|ouvindo) coisas\b/,
  /\bnao (paro|consigo parar) de tremer\b/,
  /\b(muito|super|todo) confuso\b/,
];

/**
 * Se houver sinal de risco, devolve a resposta que precisa sair. Vale tanto
 * para o motor local quanto para o caminho com LLM: assim o número do CVV
 * aparece sempre, independentemente de qual provedor está ativo.
 */
export function alertaDeCrise(mensagem: string): string | null {
  const t = normalizar(mensagem);

  if (RISCO_VIDA.some((re) => re.test(t))) {
    return [
      "Para tudo um segundo. O que você acabou de escrever é sério e eu não vou passar por cima disso.",
      "",
      "Liga agora para o CVV: 188. É gratuito, funciona 24 horas e a pessoa do outro lado é treinada exatamente para isso. Se preferir escrever, é cvv.org.br.",
      "",
      "Tem alguém que possa ficar perto de você agora? Chama essa pessoa. Não fica sozinho com isso.",
      "",
      "Eu sou um app — não substituo ajuda de verdade, e você merece ajuda de verdade.",
    ].join("\n");
  }

  if (EMERGENCIA_MEDICA.some((re) => re.test(t))) {
    return [
      "Isso pode ser abstinência grave e não é caso de aguentar firme sozinho.",
      "",
      "Procura atendimento médico agora: SAMU 192 ou o pronto-socorro mais perto.",
      "",
      "Pedir ajuda médica não é recaída. É a decisão certa.",
    ].join("\n");
  }

  return null;
}

/* ------------------------------- entrada -------------------------------- */

export type OpcoesLocal = {
  /** número de mensagens já trocadas — varia as respostas repetidas */
  turno?: number;
};

export function responderLocal(r: Retrato, mensagem: string, ops: OpcoesLocal = {}): string {
  const t = normalizar(mensagem);
  const s = (ops.turno ?? 0) + r.hora;
  const m = marcoPrincipal(r);

  // Segurança primeiro, sempre — antes de qualquer classificação.
  const crise = alertaDeCrise(mensagem);
  if (crise) return crise;

  if (!m && !ehSobreContagem(r, t) && !tem(t, "faltam", "dias para", "dias pra")) {
    return SEM_MARCO;
  }

  if (tem(t, "quanto tempo dura", "dura quanto", "quanto dura a vontade", "quanto dura a fissura", "passa em quanto")) {
    return respDuracao();
  }

  if (
    tem(
      t,
      "vontade",
      "fissura",
      "to com vontade",
      "quero fumar",
      "quero beber",
      "vou ceder",
      "nao aguento",
      "nao consigo mais",
      "socorro",
      "difici",
      "ta dificil",
      "crise",
      "me ajuda",
      "segurar"
    )
  ) {
    return m ? respVontade(r, m, s) : SEM_MARCO;
  }

  if (tem(t, "por que nao", "porque nao", "pq nao", "vale a pena", "por que parei", "devo ceder", "nao devo")) {
    return m ? respPorqueNao(r, m, s) : SEM_MARCO;
  }

  if (ehSobreContagem(r, t)) {
    return respContagem(r);
  }

  if (tem(t, "quanto tempo", "ha quanto", "quantos dias", "quantas horas", "faz quanto", "meu tempo")) {
    return r.marcos.length ? respQuantoTempo(r, s) : SEM_MARCO;
  }

  if (tem(t, "meu porque", "porque eu comecei", "me lembra", "lembrar por que", "esqueci por que")) {
    if (m?.porque) {
      return [
        `Você escreveu isto quando começou:`,
        "",
        `"${m.porque}"`,
        "",
        `Isso foi há ${duracaoExtenso(m.decorridoMs)}. Continua valendo.`,
      ].join("\n");
    }
    return "Você não escreveu o seu porquê ainda. Vale muito a pena: abre o marco, toca em Ajustes e escreve com as suas palavras. É o texto que eu te devolvo quando a vontade apertar.";
  }

  if (tem(t, "meu corpo", "corpo", "pulm", "saude", "acontecendo comigo", "o que acontece", "fisic", "melhora")) {
    return m ? respCorpo(m) : SEM_MARCO;
  }

  if (tem(t, "recai", "recaida", "fumei", "bebi", "cedi", "falhei", "estraguei", "voltei a", "perdi tudo", "zerou")) {
    return m ? respRecaida(r, m, s) : SEM_MARCO;
  }

  if (tem(t, "dinheiro", "economiz", "grana", "quanto poupei", "quanto guardei", "reais", "custou")) {
    return respDinheiro(r);
  }

  if (tem(t, "proximo marco", "proxima meta", "falta quanto", "quanto falta", "proximo")) {
    return m ? respProximo(m) : SEM_MARCO;
  }

  if (tem(t, "contagem", "viagem", "faltam", "dias para", "dias pra", "quando chega")) {
    return respContagem(r);
  }

  if (tem(t, "motiva", "desanim", "cansado", "sem forca", "vale mesmo", "to mal", "triste", "animo")) {
    return m ? respMotivacao(r, m, s) : SEM_MARCO;
  }

  if (tem(t, "obrigad", "valeu", "brigado", "top", "boa")) {
    return escolher(
      [
        "Tô aqui. Volta quando precisar — inclusive de madrugada.",
        "É pra isso que eu existo. Segue firme.",
        "Qualquer hora. E quando apertar, não espera passar sozinho: escreve.",
      ],
      s
    );
  }

  if (/^(oi|ola|opa|eae|e ai|bom dia|boa tarde|boa noite|salve|hey)\b/.test(t) || t.length <= 4) {
    return respSaudacao(r, s);
  }

  if (tem(t, "so um", "so uma", "posso fumar um", "um so", "um cigarro so", "so hoje", "so dessa vez", "diminuir em vez")) {
    return m ? respSoUm(m, s) : SEM_MARCO;
  }

  if (tem(t, "gatilho", "o que me faz", "por que eu recaio", "sempre caio", "padrao")) {
    return m ? respGatilho(m) : SEM_MARCO;
  }

  if (tem(t, "festa", "churrasco", "balada", "aniversario", "bar", "evento", "casamento", "vou sair", "confraterniza", "reuniao de familia")) {
    return m ? respFesta(m, s) : SEM_MARCO;
  }

  if (tem(t, "ansios", "ansiedade", "nervos", "agitado", "irritad", "estress", "no limite")) {
    return respAnsiedade(s);
  }

  if (tem(t, "dormir", "sono", "insonia", "acordando de madrugada", "nao durmo", "acordo cansado")) {
    return respSono();
  }

  if (tem(t, "engordar", "engordando", "peso", "comendo muito", "fome", "gordo", "balanca")) {
    return m ? respPeso(m) : SEM_MARCO;
  }

  if (tem(t, "psicolog", "psiquiatra", "terapia", "medico", "remedio", "adesivo", "tratamento", "grupo de apoio", "profissional")) {
    return respProfissional();
  }

  if (tem(t, "respira", "respirar", "4-7-8", "exercicio de respira")) {
    return respRespiracao();
  }

  return respFallback(r, m, s);
}

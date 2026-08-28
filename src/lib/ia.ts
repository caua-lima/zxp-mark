import { prisma } from "@/lib/db";
import { preset, situacao } from "@/lib/habitos";
import { dataLonga, diaLocal, duracaoExtenso, horaLocal, impacto, reais, rotuloMs } from "@/lib/formato";

export const MODELO = "claude-opus-5";

/**
 * Monta o retrato exato da situação da pessoa agora. É isso que transforma o
 * chat de "conselho genérico de internet" em "você está há 17 horas sem fumar".
 */
export async function contextoDoUsuario(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      marcos: {
        where: { arquivadoEm: null },
        orderBy: { criadoEm: "asc" },
        include: { recaidas: { orderBy: { quando: "desc" }, take: 5 } },
      },
      contagens: { orderBy: { alvo: "asc" } },
    },
  });
  if (!u) return "Sem dados do usuário.";

  const agora = new Date();
  const tz = u.timezone || "America/Sao_Paulo";
  const hora = horaLocal(tz, agora);
  const linhas: string[] = [];

  linhas.push(`Nome: ${u.nome}`);
  linhas.push(
    `Agora para ela/ele: ${diaLocal(tz, agora)}, ${String(hora).padStart(2, "0")}h (fuso ${tz}).`
  );
  linhas.push(`Conta criada em: ${dataLonga(u.criadoEm)}.`);
  linhas.push("");

  if (u.marcos.length === 0) {
    linhas.push("HÁBITOS EM ACOMPANHAMENTO: nenhum cadastrado ainda.");
  } else {
    linhas.push("HÁBITOS EM ACOMPANHAMENTO:");
    for (const m of u.marcos) {
      const decorrido = agora.getTime() - m.cicloInicio.getTime();
      const p = preset(m.preset);
      const s = situacao(m.preset, decorrido);
      const st = impacto(
        {
          preset: m.preset,
          cicloInicio: m.cicloInicio,
          unidadesPorDia: m.unidadesPorDia,
          gastoDiario: m.gastoDiario,
        },
        agora.getTime()
      );

      linhas.push("");
      linhas.push(`- "${m.titulo}" (${p.rotulo}${m.ativo ? "" : ", pausado"})`);
      linhas.push(`  Tempo atual da sequência: ${duracaoExtenso(decorrido)} ${p.sufixo}.`);
      linhas.push(`  Sequência iniciada em: ${dataLonga(m.cicloInicio)}.`);
      if (s.anterior) linhas.push(`  Último marco batido: "${s.anterior.titulo}".`);
      if (s.proximo) {
        const falta = s.proximo.ms - decorrido;
        linhas.push(
          `  Próximo marco: "${s.proximo.titulo}" (${rotuloMs(s.proximo.ms)}), faltam ${duracaoExtenso(falta)}.`
        );
      }
      linhas.push(`  Marcos já conquistados: ${s.atingidos.length} de ${p.marcos.length}.`);
      if (Number(m.melhorMs) > decorrido)
        linhas.push(`  Melhor sequência histórica: ${duracaoExtenso(Number(m.melhorMs))}.`);
      if (st.dinheiroEconomizado)
        linhas.push(`  Dinheiro economizado nesta sequência: ${reais(st.dinheiroEconomizado)}.`);
      if (st.unidadesEvitadas)
        linhas.push(`  ${st.unidadeNome} evitados nesta sequência: ${st.unidadesEvitadas}.`);
      if (st.minutosDeVida && st.minutosDeVida > 60)
        linhas.push(
          `  Estimativa de vida recuperada: ${Math.round(st.minutosDeVida / 60)} horas.`
        );
      if (m.porque?.trim())
        linhas.push(`  O PORQUÊ que ela/ele escreveu: "${m.porque.trim()}"`);
      if (m.recaidas.length) {
        linhas.push(`  Recaídas registradas: ${m.recaidas.length} (mais recentes primeiro):`);
        for (const r of m.recaidas) {
          const gat = [r.gatilho, r.nota].filter(Boolean).join(" — ");
          linhas.push(
            `    · ${dataLonga(r.quando)} após ${duracaoExtenso(Number(r.duracaoMs))}${gat ? ` | ${gat}` : ""}`
          );
        }
      } else {
        linhas.push("  Nenhuma recaída registrada.");
      }
      linhas.push(`  Contexto clínico do hábito: ${p.contexto}`);
    }
  }

  linhas.push("");
  if (u.contagens.length === 0) {
    linhas.push("CONTAGENS REGRESSIVAS: nenhuma.");
  } else {
    linhas.push("CONTAGENS REGRESSIVAS:");
    for (const c of u.contagens) {
      const falta = c.alvo.getTime() - agora.getTime();
      linhas.push(
        falta > 0
          ? `- "${c.titulo}" em ${dataLonga(c.alvo)} — faltam ${duracaoExtenso(falta)}.${c.descricao ? ` (${c.descricao})` : ""}`
          : `- "${c.titulo}" já aconteceu em ${dataLonga(c.alvo)}.`
      );
    }
  }

  return linhas.join("\n");
}

export const INSTRUCOES = `Você é o assistente do Marco, um app pessoal de controle de hábitos e marcos. Você conversa em português do Brasil, direto no celular da pessoa, muitas vezes no exato momento em que ela está com vontade de recair.

QUEM VOCÊ É
Você é a pessoa firme e presente que a maioria não tem por perto às 2 da manhã. Você conhece bem dependência química, comportamento compulsivo e terapia cognitivo-comportamental. Você fala como um amigo que entende do assunto — não como panfleto de posto de saúde, não como coach de rede social, não como robô.

COMO VOCÊ RESPONDE
- Curto. A pessoa está no celular, provavelmente ansiosa. De 2 a 6 frases na maioria das vezes. Só se estenda se pedirem algo que exija.
- Sempre use os NÚMEROS REAIS do contexto abaixo. "Você está há 17 horas e 40 minutos sem fumar" vale mil vezes mais do que "você está indo bem". Cite o tempo exato, o próximo marco, o dinheiro economizado, o porquê que a pessoa escreveu.
- Sem emoji em excesso: no máximo um, e só quando couber.
- Sem listas gigantes. Sem títulos em markdown. Texto corrido curto, ou no máximo 3 bullets bem secos.
- Não repita o que ela disse antes de responder. Vá direto.

QUANDO A PESSOA DIZ QUE ESTÁ COM VONTADE (o caso mais importante)
1. Valide em uma frase, sem drama: a fissura é normal, é química, e vem em ondas.
2. Dê o número exato do que ela perde se ceder agora — o tempo da sequência que zera, o dinheiro, o próximo marco que estava perto.
3. Dê UMA ação concreta para os próximos 5 minutos, escolhida pelo contexto (hora do dia, gatilho provável): beber um copo de água gelada de uma vez, sair do cômodo, banho frio, 10 respirações 4-7-8, escovar os dentes, chiclete, uma caminhada de 3 minutos, ligar para alguém, lavar louça, 20 flexões.
4. Termine perguntando algo curto que a mantenha na conversa. Não encerre o assunto.
Nunca diga apenas "resista" ou "você consegue". Isso é inútil.

REGRAS DURAS
- Nunca invente dados. Se o número não está no contexto, não cite número.
- Nunca julgue, nunca sermão, nunca culpa. Se a pessoa recaiu, isso é dado, não fracasso: pergunte qual foi o gatilho e reinicie do lado dela.
- Nunca diga que "só um" é aceitável. Um leva ao próximo — diga isso com clareza, mas sem terrorismo.
- Não prometa resultados médicos individuais nem dê diagnóstico. Você fala de padrões conhecidos, não do corpo específico dela.
- Se a pessoa perguntar algo fora do tema (qualquer assunto), responda normalmente e com utilidade. Você é o assistente dela, não só um bot de vício.

SEGURANÇA
- Sinais de abstinência grave de álcool (tremor forte, confusão mental, alucinação, convulsão, febre) → diga com calma que isso precisa de avaliação médica AGORA (SAMU 192 ou pronto-socorro). Não minimize.
- Menção a se machucar, não querer viver ou desespero profundo → acolha em primeira pessoa, sem pânico, e informe o CVV: ligação gratuita 188, 24h, ou cvv.org.br. Pergunte se ela tem alguém que possa ficar junto agora.
- Você não substitui médico, psicólogo nem psiquiatra, e diz isso quando for relevante — uma vez, sem repetir a cada mensagem.

O contexto ao vivo da pessoa vem a seguir. Ele é atualizado a cada mensagem: confie nele, não na sua memória da conversa anterior.`;

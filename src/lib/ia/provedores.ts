/**
 * Camada de provedores do chat.
 *
 * O app funciona sem nenhuma chave: nesse caso responde o motor local, que é
 * gratuito, instantâneo e sempre correto sobre os números da pessoa. Se
 * houver uma chave de um provedor com nível gratuito (Groq, Gemini,
 * OpenRouter), a conversa fica mais natural — e se esse provedor falhar ou
 * estourar o limite, cai de volta no motor local sem quebrar nada.
 */

export type ProvedorId = "local" | "groq" | "gemini" | "openrouter" | "anthropic";

export type Provedor = {
  id: ProvedorId;
  rotulo: string;
  modelo: string;
  /** true = não gera cobrança dentro do nível gratuito do provedor */
  gratuito: boolean;
  /** de onde tirar a chave, para mostrar na tela de perfil */
  comoObter?: string;
};

const MODELOS_PADRAO: Record<ProvedorId, string> = {
  local: "motor local",
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.0-flash",
  openrouter: "meta-llama/llama-3.3-70b-instruct:free",
  anthropic: "claude-opus-5",
};

const ROTULOS: Record<ProvedorId, string> = {
  local: "Motor local",
  groq: "Groq",
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
  anthropic: "Anthropic",
};

function chaveDe(id: ProvedorId): string | undefined {
  switch (id) {
    case "groq":
      return process.env.GROQ_API_KEY;
    case "gemini":
      return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    case "openrouter":
      return process.env.OPENROUTER_API_KEY;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "local":
      return "sempre";
  }
}

/** Ordem de preferência: os gratuitos primeiro, o mais rápido na frente. */
const ORDEM: ProvedorId[] = ["groq", "gemini", "openrouter", "anthropic"];

export function provedorAtivo(): Provedor {
  const forcado = (process.env.IA_PROVEDOR || "").trim().toLowerCase() as ProvedorId;
  const escolhido: ProvedorId =
    forcado && forcado in MODELOS_PADRAO && chaveDe(forcado)
      ? forcado
      : (ORDEM.find((id) => chaveDe(id)) ?? "local");

  return {
    id: escolhido,
    rotulo: ROTULOS[escolhido],
    modelo: process.env.IA_MODELO?.trim() || MODELOS_PADRAO[escolhido],
    gratuito: escolhido !== "anthropic",
    comoObter:
      escolhido === "local"
        ? "console.groq.com/keys (grátis) ou aistudio.google.com/apikey (grátis)"
        : undefined,
  };
}

export type Turno = { papel: "user" | "assistant"; conteudo: string };

/* ---------------------------- leitor de SSE ------------------------------ */

async function* linhasSSE(corpo: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const leitor = corpo.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let corte: number;
      while ((corte = buffer.indexOf("\n")) >= 0) {
        const linha = buffer.slice(0, corte).trim();
        buffer = buffer.slice(corte + 1);
        if (linha.startsWith("data:")) yield linha.slice(5).trim();
      }
    }
  } finally {
    leitor.releaseLock();
  }
}

async function conferir(r: Response, provedor: string): Promise<void> {
  if (r.ok) return;
  const detalhe = (await r.text().catch(() => "")).slice(0, 300);
  throw new Error(`${provedor} respondeu ${r.status}: ${detalhe}`);
}

/* -------------------- adaptador compatível com OpenAI -------------------- */

/** Serve Groq e OpenRouter — ambos falam o mesmo dialeto. */
async function* viaOpenAI(
  url: string,
  chave: string,
  modelo: string,
  sistema: string,
  turnos: Turno[],
  cabecalhosExtra: Record<string, string> = {}
): AsyncGenerator<string> {
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${chave}`,
      ...cabecalhosExtra,
    },
    body: JSON.stringify({
      model: modelo,
      stream: true,
      temperature: 0.7,
      max_tokens: 1200,
      messages: [
        { role: "system", content: sistema },
        ...turnos.map((t) => ({
          role: t.papel === "user" ? "user" : "assistant",
          content: t.conteudo,
        })),
      ],
    }),
  });
  await conferir(r, "provedor");
  if (!r.body) throw new Error("provedor não devolveu corpo");

  for await (const dado of linhasSSE(r.body)) {
    if (dado === "[DONE]") return;
    try {
      const j = JSON.parse(dado);
      const texto = j?.choices?.[0]?.delta?.content;
      if (typeof texto === "string" && texto) yield texto;
    } catch {
      // linha de keep-alive ou fragmento — ignora
    }
  }
}

/* ---------------------------- adaptador Gemini --------------------------- */

async function* viaGemini(
  chave: string,
  modelo: string,
  sistema: string,
  turnos: Turno[]
): AsyncGenerator<string> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}` +
    `:streamGenerateContent?alt=sse&key=${encodeURIComponent(chave)}`;

  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: sistema }] },
      contents: turnos.map((t) => ({
        role: t.papel === "user" ? "user" : "model",
        parts: [{ text: t.conteudo }],
      })),
      generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
    }),
  });
  await conferir(r, "Gemini");
  if (!r.body) throw new Error("Gemini não devolveu corpo");

  for await (const dado of linhasSSE(r.body)) {
    if (!dado || dado === "[DONE]") continue;
    try {
      const j = JSON.parse(dado);
      for (const parte of j?.candidates?.[0]?.content?.parts ?? []) {
        if (typeof parte?.text === "string" && parte.text) yield parte.text;
      }
    } catch {
      // ignora fragmento
    }
  }
}

/* --------------------------- adaptador Anthropic ------------------------- */

async function* viaAnthropic(
  modelo: string,
  sistema: string,
  turnos: Turno[]
): AsyncGenerator<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const stream = client.messages.stream({
    model: modelo,
    max_tokens: 4000,
    output_config: { effort: "low" },
    system: sistema,
    messages: turnos.map((t) => ({
      role: t.papel === "user" ? ("user" as const) : ("assistant" as const),
      content: t.conteudo,
    })),
  });

  for await (const evento of stream) {
    if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
      yield evento.delta.text;
    }
  }
}

/* -------------------------------- entrada -------------------------------- */

/**
 * Transmite a resposta do provedor ativo. Lança se falhar — quem chama
 * decide cair no motor local.
 */
export function transmitir(
  provedor: Provedor,
  sistema: string,
  turnos: Turno[]
): AsyncGenerator<string> {
  const chave = chaveDe(provedor.id);
  if (!chave) throw new Error(`sem chave para ${provedor.id}`);

  switch (provedor.id) {
    case "groq":
      return viaOpenAI(
        "https://api.groq.com/openai/v1/chat/completions",
        chave,
        provedor.modelo,
        sistema,
        turnos
      );
    case "openrouter":
      return viaOpenAI(
        "https://openrouter.ai/api/v1/chat/completions",
        chave,
        provedor.modelo,
        sistema,
        turnos,
        {
          "http-referer": process.env.APP_URL || "https://zxp-mark.vercel.app",
          "x-title": "Marco",
        }
      );
    case "gemini":
      return viaGemini(chave, provedor.modelo, sistema, turnos);
    case "anthropic":
      return viaAnthropic(provedor.modelo, sistema, turnos);
    case "local":
      throw new Error("motor local não transmite por aqui");
  }
}

/**
 * Deduz coisas a partir do que a pessoa escreveu, para ela não ter que
 * escolher de uma lista: o ícone da contagem regressiva e o tipo de hábito
 * do marco (que é o que carrega a linha do tempo certa).
 */
import { PRESETS } from "@/lib/habitos";

function normalizar(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Termo de uma palavra só casa apenas como palavra inteira — senão "mar"
 * dispara em "maratona" e "coca" em "cocada". Frase com espaço casa como
 * trecho mesmo, que é o comportamento esperado ali.
 */
function contem(texto: string, termo: string): boolean {
  const t = normalizar(termo);
  if (t.includes(" ")) return texto.includes(t);
  return new RegExp(`(^|[^a-z0-9])${t}([^a-z0-9]|$)`).test(texto);
}

/* ------------------------- ícone da contagem ----------------------------- */

/** Primeiro que casar ganha, então o mais específico vem antes. */
const ICONES: [string, string[]][] = [
  ["✈️", ["viagem", "viajar", "voo", "aviao", "passagem", "embarque", "ferias", "trip", "eurotrip"]],
  ["🏖️", ["praia", "litoral", "mar", "resort", "cruzeiro", "ilha"]],
  ["🎂", ["aniversario", "niver", "bday", "fazer anos"]],
  ["💍", ["casamento", "noivado", "casar", "noiva", "noivo", "bodas"]],
  ["👶", ["bebe", "nascimento", "gravidez", "parto", "gestacao", "cha de bebe"]],
  ["🎓", ["formatura", "faculdade", "colar grau", "tcc", "defesa", "diploma"]],
  ["📝", ["prova", "vestibular", "enem", "concurso", "exame", "simulado", "redacao"]],
  ["🏠", ["mudanca", "casa nova", "apartamento", "reforma", "chaves", "imovel"]],
  ["🚗", ["carro", "moto", "cnh", "habilitacao", "veiculo"]],
  ["🎄", ["natal", "ceia"]],
  ["🎆", ["ano novo", "reveillon", "virada"]],
  ["🎉", ["festa", "aniversario de", "comemoracao", "confraternizacao"]],
  ["🎤", ["show", "festival", "rock in rio", "concerto", "turne"]],
  ["⚽", ["jogo", "futebol", "final", "campeonato", "copa", "classico"]],
  ["🩺", ["consulta", "medico", "dentista", "cirurgia", "exame de sangue", "retorno", "clinica"]],
  ["💼", ["entrevista", "emprego", "trabalho", "reuniao", "apresentacao", "entrega", "deadline", "prazo"]],
  ["💰", ["pagamento", "salario", "divida", "quitar", "parcela", "boleto", "decimo"]],
  ["🏃", ["corrida", "maratona", "treino", "academia", "competicao", "meia maratona"]],
  ["🎬", ["filme", "serie", "estreia", "cinema", "temporada"]],
  ["🎮", ["lancamento", "jogo novo", "game"]],
  ["🐶", ["cachorro", "gato", "pet", "adocao"]],
  ["⛺", ["camping", "trilha", "acampamento", "montanha"]],
  ["🍖", ["churrasco", "almoco", "jantar"]],
  ["❤️", ["namoro", "encontro", "date", "reencontro", "aniversario de namoro"]],
  ["🚭", ["parar de fumar", "sem fumar", "sem cigarro"]],
  ["📅", ["reuniao", "compromisso", "agenda", "evento"]],
];

/** Ícone de uma contagem, deduzido do título (e da descrição, se houver). */
export function iconePara(titulo: string, descricao?: string | null): string {
  const t = normalizar(`${titulo} ${descricao ?? ""}`);
  for (const [emoji, termos] of ICONES) {
    if (termos.some((termo) => contem(t, termo))) return emoji;
  }
  return "🎯";
}

/* --------------------------- tipo do hábito ------------------------------ */

const HABITOS: [string, string[]][] = [
  ["cigarro", ["fumar", "cigarro", "cigarros", "nicotina", "tabaco", "maco", "fumo", "fumante"]],
  ["vape", ["vape", "vapear", "pod", "juul", "ignite", "cigarro eletronico", "vaporizador"]],
  ["alcool", ["beber", "bebida", "alcool", "cerveja", "vodka", "whisky", "cachaca", "vinho", "alcoolico", "bebo"]],
  ["acucar", ["acucar", "doce", "doces", "chocolate", "refrigerante", "sobremesa", "besteira", "ultraprocessado"]],
  ["pornografia", ["pornografia", "porno", "pornô", "masturbacao", "nofap", "conteudo adulto"]],
  ["redes", ["rede social", "redes sociais", "instagram", "tiktok", "celular", "twitter", "facebook", "scroll", "telas", "reels"]],
  ["apostas", ["apostar", "aposta", "apostas", "bet", "cassino", "tigrinho", "jogo do bicho", "blaze", "bets"]],
  ["cafeina", ["cafeina", "cafe", "energetico", "red bull", "monster", "coca"]],
];

export type Deteccao = {
  preset: string;
  rotulo: string;
  emoji: string;
  totalMarcos: number;
  /** false = não reconheceu e caiu no genérico */
  reconhecido: boolean;
};

/** Descobre de qual hábito a pessoa está falando pelo título que escreveu. */
export function detectarHabito(titulo: string, porque?: string | null): Deteccao {
  const t = normalizar(`${titulo} ${porque ?? ""}`);

  for (const [id, termos] of HABITOS) {
    if (termos.some((termo) => contem(t, termo))) {
      const p = PRESETS.find((x) => x.id === id)!;
      return {
        preset: p.id,
        rotulo: p.rotulo,
        emoji: p.emoji,
        totalMarcos: p.marcos.length,
        reconhecido: true,
      };
    }
  }

  const generico = PRESETS.find((x) => x.id === "personalizado")!;
  return {
    preset: generico.id,
    rotulo: "Hábito personalizado",
    emoji: generico.emoji,
    totalMarcos: generico.marcos.length,
    reconhecido: false,
  };
}

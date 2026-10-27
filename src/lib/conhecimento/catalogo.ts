/**
 * O catálogo de temas. Cada tema vive no seu arquivo em ./temas/ e é registrado
 * aqui. Os testes percorrem esta lista inteira: tema novo entra já validado.
 */
import type { Tema } from "./tipos.ts";
import { unhas } from "./temas/unhas.ts";
import { escitalopram } from "./temas/escitalopram.ts";
import { sono } from "./temas/sono.ts";
import { atividadeFisica } from "./temas/atividade-fisica.ts";
import { cafeina } from "./temas/cafeina.ts";
import { higieneBucal } from "./temas/higiene-bucal.ts";
import { respiracao } from "./temas/respiracao.ts";
import { pararDeFumar } from "./temas/parar-de-fumar.ts";
import { autocuidado } from "./temas/autocuidado.ts";
import { terapia } from "./temas/terapia.ts";

export const TEMAS: Tema[] = [
  unhas,
  escitalopram,
  sono,
  atividadeFisica,
  cafeina,
  higieneBucal,
  respiracao,
  pararDeFumar,
  autocuidado,
  terapia,
];

export function temaPorId(id: string, temas: Tema[] = TEMAS): Tema | undefined {
  return temas.find((t) => t.id === id);
}

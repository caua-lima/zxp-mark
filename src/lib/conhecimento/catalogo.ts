/**
 * O catálogo de temas. Cada tema vive no seu arquivo em ./temas/ e é registrado
 * aqui. Os testes percorrem esta lista inteira: tema novo entra já validado.
 */
import type { Tema } from "./tipos.ts";
import { unhas } from "./temas/unhas.ts";
import { escitalopram } from "./temas/escitalopram.ts";

export const TEMAS: Tema[] = [unhas, escitalopram];

export function temaPorId(id: string, temas: Tema[] = TEMAS): Tema | undefined {
  return temas.find((t) => t.id === id);
}

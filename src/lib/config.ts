/**
 * Cadastro público está aberto?
 *
 * Com `CADASTRO_ABERTO=false`, ninguém cria conta sozinho pela tela de
 * cadastro — só um admin cria acessos pela aba Acesso. Sem a variável, segue
 * aberto (comportamento original).
 *
 * O primeiro acesso é sempre permitido: senão um banco vazio ficaria sem
 * nenhuma forma de entrar.
 */
export function cadastroAberto(): boolean {
  return (process.env.CADASTRO_ABERTO ?? "true").trim().toLowerCase() !== "false";
}

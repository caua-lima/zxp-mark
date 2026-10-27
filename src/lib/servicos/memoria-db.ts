/**
 * Banco em memória para testes dos serviços. NADA disto é importado pelo app.
 *
 * Existe porque os testes de integração com o Postgres real dependem de as
 * tabelas existirem no banco (e, no Neon de produção, isso exige um `db push`
 * que o projeto não aplica sozinho). Este fake obedece às mesmas regras que
 * importam para os serviços:
 *   - cláusulas `where` (igualdade, null, in, not, lt/lte/gt/gte, OR/AND);
 *   - restrições de unicidade (P2002), inclusive as compostas;
 *   - `upsert`, `createMany({ skipDuplicates })`, `updateMany`/`deleteMany` que
 *     devolvem `count`, e cascata ao apagar um pai.
 *
 * Limite honesto: não simula transações isoladas nem travas. O que ele prova é
 * a lógica de autorização e de deduplicação dos serviços; concorrência real e
 * integridade referencial continuam sendo coisa do teste com o Postgres.
 */

type Linha = Record<string, unknown>;
type Where = Record<string, unknown>;

function igual(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return a === b;
}

function compara(a: unknown, b: unknown): number {
  const x = a instanceof Date ? a.getTime() : (a as number | string);
  const y = b instanceof Date ? b.getTime() : (b as number | string);
  return x < y ? -1 : x > y ? 1 : 0;
}

export function casa(linha: Linha, where: Where | undefined): boolean {
  if (!where) return true;
  return Object.entries(where).every(([chave, valor]) => {
    if (chave === "OR") return (valor as Where[]).some((w) => casa(linha, w));
    if (chave === "AND") return (valor as Where[]).every((w) => casa(linha, w));
    if (chave === "NOT") return !casa(linha, valor as Where);
    const atual = linha[chave];
    if (valor === null) return atual === null || atual === undefined;
    if (valor !== null && typeof valor === "object" && !(valor instanceof Date)) {
      const op = valor as Record<string, unknown>;
      return Object.entries(op).every(([o, v]) => {
        switch (o) {
          case "equals": return igual(atual, v);
          case "not": return v === null ? !(atual === null || atual === undefined) : !igual(atual, v);
          case "in": return (v as unknown[]).some((x) => igual(atual, x));
          case "notIn": return !(v as unknown[]).some((x) => igual(atual, x));
          case "lt": return compara(atual, v) < 0;
          case "lte": return compara(atual, v) <= 0;
          case "gt": return compara(atual, v) > 0;
          case "gte": return compara(atual, v) >= 0;
          case "startsWith": return String(atual).startsWith(String(v));
          case "endsWith": return String(atual).endsWith(String(v));
          default: throw new Error(`memoria-db: operador não suportado: ${o}`);
        }
      });
    }
    return igual(atual, valor);
  });
}

class ErroUnico extends Error {
  code = "P2002";
}

let contador = 0;
const novoId = () => `id${(++contador).toString(36).padStart(6, "0")}`;

export class Tabela {
  linhas: Linha[] = [];
  // Campos explícitos (e não "parameter properties"): o Node roda este arquivo só
  // removendo os tipos, e esse modo não aceita aquela sintaxe.
  private nome: string;
  /** cada item é um conjunto de colunas que não pode se repetir */
  private unicos: string[][];
  /** valores padrão de coluna */
  private padroes: () => Linha;
  /** filhos a apagar junto: [tabela, coluna que aponta para esta] */
  private filhos: () => [Tabela, string][];

  constructor(
    nome: string,
    unicos: string[][] = [],
    padroes: () => Linha = () => ({}),
    filhos: () => [Tabela, string][] = () => []
  ) {
    this.nome = nome;
    this.unicos = unicos;
    this.padroes = padroes;
    this.filhos = filhos;
  }

  private violaUnico(nova: Linha, ignorar?: Linha): boolean {
    return this.unicos.some((cols) =>
      this.linhas.some((l) => l !== ignorar && cols.every((c) => igual(l[c], nova[c])))
    );
  }

  private ordenar(l: Linha[], orderBy: unknown): Linha[] {
    const ordens = (Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : []) as Record<string, "asc" | "desc">[];
    if (ordens.length === 0) return l;
    return [...l].sort((a, b) => {
      for (const o of ordens) {
        const [col, dir] = Object.entries(o)[0];
        const c = compara(a[col], b[col]);
        if (c !== 0) return dir === "desc" ? -c : c;
      }
      return 0;
    });
  }

  async findMany(args: { where?: Where; orderBy?: unknown; take?: number; select?: unknown } = {}) {
    let r = this.ordenar(this.linhas.filter((l) => casa(l, args.where)), args.orderBy);
    if (args.take !== undefined) r = r.slice(0, args.take);
    return r.map((l) => ({ ...l }));
  }
  async findFirst(args: { where?: Where; orderBy?: unknown; select?: unknown } = {}) {
    return (await this.findMany({ ...args, take: 1 }))[0] ?? null;
  }
  async findUnique(args: { where: Where }) {
    return (await this.findMany({ where: this.achatar(args.where) }))[0] ?? null;
  }
  async count(args: { where?: Where } = {}) {
    return this.linhas.filter((l) => casa(l, args.where)).length;
  }

  /** `{ userId_temaId: { userId, temaId } }` → `{ userId, temaId }` */
  private achatar(where: Where): Where {
    const saida: Where = {};
    for (const [k, v] of Object.entries(where)) {
      if (v && typeof v === "object" && !(v instanceof Date) && k.includes("_")) Object.assign(saida, v);
      else saida[k] = v;
    }
    return saida;
  }

  async create(args: { data: Linha; select?: unknown }) {
    const nova: Linha = { id: novoId(), criadoEm: new Date(), ...this.padroes(), ...args.data };
    if (this.violaUnico(nova)) throw new ErroUnico(`Unique constraint failed em ${this.nome}`);
    this.linhas.push(nova);
    return { ...nova };
  }
  async createMany(args: { data: Linha[]; skipDuplicates?: boolean }) {
    let n = 0;
    for (const d of args.data) {
      try {
        await this.create({ data: d });
        n++;
      } catch (e) {
        if (!(args.skipDuplicates && (e as ErroUnico).code === "P2002")) throw e;
      }
    }
    return { count: n };
  }
  async update(args: { where: Where; data: Linha; select?: unknown }) {
    const alvo = this.linhas.find((l) => casa(l, this.achatar(args.where)));
    if (!alvo) throw new Error(`${this.nome}: registro não encontrado`);
    const depois = { ...alvo, ...args.data };
    if (this.violaUnico(depois, alvo)) throw new ErroUnico(`Unique constraint failed em ${this.nome}`);
    Object.assign(alvo, args.data, { atualizadaEm: new Date() });
    return { ...alvo };
  }
  async updateMany(args: { where?: Where; data: Linha }) {
    const alvos = this.linhas.filter((l) => casa(l, args.where));
    for (const a of alvos) Object.assign(a, args.data, { atualizadaEm: new Date() });
    return { count: alvos.length };
  }
  async upsert(args: { where: Where; create: Linha; update: Linha; select?: unknown }) {
    const existente = this.linhas.find((l) => casa(l, this.achatar(args.where)));
    if (existente) {
      Object.assign(existente, args.update, { atualizadaEm: new Date() });
      return { ...existente };
    }
    return this.create({ data: args.create });
  }
  async delete(args: { where: Where }) {
    const i = this.linhas.findIndex((l) => casa(l, this.achatar(args.where)));
    if (i < 0) throw new Error(`${this.nome}: registro não encontrado`);
    const [removida] = this.linhas.splice(i, 1);
    this.cascata([removida]);
    return removida;
  }
  async deleteMany(args: { where?: Where } = {}) {
    const alvos = this.linhas.filter((l) => casa(l, args.where));
    this.linhas = this.linhas.filter((l) => !alvos.includes(l));
    this.cascata(alvos);
    return { count: alvos.length };
  }
  private cascata(pais: Linha[]) {
    for (const [tabela, coluna] of this.filhos()) {
      const ids = pais.map((p) => p.id);
      // Um nível basta: nenhuma tabela filha daqui tem filhos.
      tabela.linhas = tabela.linhas.filter((l) => !ids.includes(l[coluna]));
    }
  }
}

/** O que os serviços de hábito e de tratamento usam, com as mesmas unicidades do schema. */
export function bancoEmMemoria() {
  const eventoHabito = new Tabela("EventoHabito");
  const habitoAcompanhado = new Tabela("HabitoAcompanhado", [["userId", "temaId"]], () => ({}), () => [[eventoHabito, "habitoId"]]);

  const doseTratamento = new Tabela("DoseTratamento");
  const tomadaDia = new Tabela("TomadaDia", [["tratamentoId", "dia"]]);
  const efeitoRegistrado = new Tabela("EfeitoRegistrado");
  const tratamento = new Tabela(
    "Tratamento",
    [],
    () => ({ lembrete: false, lembreteDetalhado: false, arquivadoEm: null }),
    () => [
      [doseTratamento, "tratamentoId"],
      [tomadaDia, "tratamentoId"],
      [efeitoRegistrado, "tratamentoId"],
    ]
  );
  const registroHumor = new Tabela("RegistroHumor", [["userId", "dia"]]);
  const preferenciaSaude = new Tabela("PreferenciaSaude", [["userId"]], () => ({ assistenteUsaSaude: false }));
  const user = new Tabela("User", [], () => ({ timezone: "America/Sao_Paulo", assistenteUsaSaude: false }));

  const tabelas = { user, habitoAcompanhado, eventoHabito, tratamento, doseTratamento, tomadaDia, efeitoRegistrado, registroHumor, preferenciaSaude };
  const db = {
    ...tabelas,
    // Sem isolamento nem trava: só o suficiente para os serviços rodarem.
    async $transaction<T>(fn: (tx: typeof tabelas) => Promise<T>): Promise<T> {
      return fn(tabelas);
    },
  };
  return db;
}

export type BancoEmMemoria = ReturnType<typeof bancoEmMemoria>;

import { test } from "node:test";
import assert from "node:assert/strict";
import { bancoEmMemoria } from "./memoria-db.ts";
import { apagarDadosDeSaude, definirAssistenteUsaSaude, lerPreferenciaSaude, tabelaAusente, type Db, type DbApagar } from "./preferencias.ts";
import { criarTratamento, type Db as DbTrat } from "./tratamento.ts";
import { iniciarHabito, registrarEvento, type Db as DbHab } from "./habitos.ts";
import { registrarHumor, type Db as DbHum } from "./humor.ts";
import { instanteLocal } from "../datas.ts";

const SP = "America/Sao_Paulo";
const agora = instanteLocal("2026-10-11T10:00", SP)!.getTime();

test("o padrão é DESLIGADO: sem linha, o assistente não usa os registros", async () => {
  const mem = bancoEmMemoria();
  assert.deepEqual(await lerPreferenciaSaude(mem as unknown as Db, "ana"), { assistenteUsaSaude: false });
});

test("ligar e desligar é por pessoa e não afeta as outras", async () => {
  const mem = bancoEmMemoria();
  const db = mem as unknown as Db;
  await definirAssistenteUsaSaude(db, "ana", true);
  assert.equal((await lerPreferenciaSaude(db, "ana")).assistenteUsaSaude, true);
  assert.equal((await lerPreferenciaSaude(db, "bia")).assistenteUsaSaude, false);
  await definirAssistenteUsaSaude(db, "ana", false);
  assert.equal((await lerPreferenciaSaude(db, "ana")).assistenteUsaSaude, false);
  assert.equal(mem.preferenciaSaude.linhas.length, 1, "ligar e desligar não duplica a linha");
});

test("se a tabela ainda não existe (db push pendente), a leitura cai para DESLIGADO em vez de quebrar", async () => {
  const quebrado = {
    preferenciaSaude: {
      findUnique: async () => {
        throw Object.assign(new Error("The table `public.PreferenciaSaude` does not exist"), { code: "P2021" });
      },
    },
  } as unknown as Db;
  assert.deepEqual(await lerPreferenciaSaude(quebrado, "ana"), { assistenteUsaSaude: false });
  assert.equal(tabelaAusente({ code: "P2021" }), true);
  assert.equal(tabelaAusente({ code: "P2022" }), true);
  assert.equal(tabelaAusente({ code: "P2002" }), false);
  assert.equal(tabelaAusente(new Error("outro")), false);
});

test("qualquer OUTRO erro do banco não é engolido", async () => {
  const quebrado = {
    preferenciaSaude: { findUnique: async () => { throw Object.assign(new Error("conexão caiu"), { code: "P1001" }); } },
  } as unknown as Db;
  await assert.rejects(() => lerPreferenciaSaude(quebrado, "ana"), /conexão caiu/);
});

test("apagar os dados de saúde remove tudo de quem pediu — e de mais ninguém", async () => {
  const mem = bancoEmMemoria();
  const hab = mem as unknown as DbHab;
  const trat = mem as unknown as DbTrat;
  const hum = mem as unknown as DbHum;
  const pref = mem as unknown as Db;

  for (const uid of ["ana", "bia"]) {
    await iniciarHabito(hab, uid, { temaId: "unhas" }, agora - 5 * 86_400_000);
    await registrarEvento(hab, uid, "unhas", { tipo: "episodio", nota: `de ${uid}` }, SP, agora);
    await criarTratamento(trat, uid, { nome: "escitalopram", inicio: "2026-09-11", dose: { descricao: "15 mg" } }, SP, agora);
    await registrarHumor(hum, uid, { humor: 3 }, SP, agora);
    await definirAssistenteUsaSaude(pref, uid, true);
  }
  assert.equal(mem.eventoHabito.linhas.length, 2);

  const r = await apagarDadosDeSaude(mem as unknown as DbApagar, "ana");
  assert.ok(r.ok);
  assert.deepEqual(r.ok && r.valor, { habitos: 1, tratamentos: 1, humores: 1 });

  // da Ana não sobrou nada, em tabela nenhuma (inclusive as filhas, por cascata):
  for (const t of [mem.habitoAcompanhado, mem.eventoHabito, mem.tratamento, mem.doseTratamento, mem.registroHumor, mem.preferenciaSaude]) {
    assert.ok(!t.linhas.some((l) => l.userId === "ana"), "sobrou linha da Ana");
  }
  assert.equal(mem.tomadaDia.linhas.filter((l) => l.userId === "ana").length, 0);
  // o consentimento volta a "desligado"
  assert.equal((await lerPreferenciaSaude(pref, "ana")).assistenteUsaSaude, false);

  // e a Bia continua exatamente como estava
  assert.equal(mem.eventoHabito.linhas.length, 1);
  assert.equal(mem.eventoHabito.linhas[0].nota, "de bia");
  assert.equal(mem.tratamento.linhas.length, 1);
  assert.equal(mem.doseTratamento.linhas.length, 1);
  assert.equal((await lerPreferenciaSaude(pref, "bia")).assistenteUsaSaude, true);
});

test("apagar quando não há nada devolve 'não encontrado' (e não finge que apagou)", async () => {
  const mem = bancoEmMemoria();
  const r = await apagarDadosDeSaude(mem as unknown as DbApagar, "ana");
  assert.equal(!r.ok && r.status, 404);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { resumirTratamento, situacaoDosCartoes } from "./medicamento.ts";
import { somarDias } from "./episodios.ts";
import { diaLocalDe } from "../datas.ts";
import { temaPorId } from "../conhecimento/catalogo.ts";

const tz = "America/Sao_Paulo";
const agora = Date.parse("2026-10-27T15:00:00Z");
const hoje = diaLocalDe(agora, tz);
const inicio = new Date(Date.parse("2026-10-16T15:00:00Z"));
const doses = [{ id: "d", descricao: "15 mg", mg: 15, desde: inicio }];
const dias = (de: number, ate: number, estado: string) =>
  Array.from({ length: ate - de + 1 }, (_, i) => ({ dia: somarDias(hoje, de + i), estado }));

test("esquecer um dia não derruba o tratamento: o dia do tratamento segue, só a sequência recomeça", () => {
  const sem = resumirTratamento(inicio, doses, [...dias(-9, -1, "tomou")], agora, tz);
  const com = resumirTratamento(inicio, doses, [...dias(-9, -4, "tomou"), { dia: somarDias(hoje, -3), estado: "nao_tomou" }, ...dias(-2, -1, "tomou")], agora, tz);
  assert.equal(com.desdeInicio.diaN, sem.desdeInicio.diaN, "o dia do tratamento não muda");
  assert.equal(com.doseAtual?.contagem.diaN, sem.doseAtual?.contagem.diaN, "o dia na dose também não");
  assert.equal(sem.sequenciaConfirmada, 9);
  assert.equal(com.sequenciaConfirmada, 2, "a sequência recomeça depois do dia esquecido");
  assert.equal(com.totalRegistrados, sem.totalRegistrados, "o dia esquecido continua registrado");
  assert.equal(com.totalNaoTomou, 1);
});

test("depois de esquecer, o título forte de 10 dias não aparece, e o texto não culpa", () => {
  const tema = temaPorId("escitalopram")!;
  const r = resumirTratamento(inicio, doses, [...dias(-9, -4, "tomou"), { dia: somarDias(hoje, -3), estado: "nao_tomou" }, ...dias(-2, -1, "tomou")], agora, tz);
  const c = situacaoDosCartoes(tema.marcos, r).find((x) => x.marco.limiar === 10)!;
  assert.notEqual(c.estado, "sustentado");
  if (c.estado === "so-tempo") assert.doesNotMatch(`${c.titulo} ${c.texto}`, /perdeu|falhou|culpa|recome[cç]ar do zero/i);
});

test("esquecer o registro (sem informação) também não conta como 'não tomei'", () => {
  const r = resumirTratamento(inicio, doses, [...dias(-9, -5, "tomou"), ...dias(-2, -1, "tomou")], agora, tz);
  assert.equal(r.totalNaoTomou, 0);
  assert.ok(r.diasSemInformacao >= 2);
});

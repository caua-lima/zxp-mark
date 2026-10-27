import { test } from "node:test";
import assert from "node:assert/strict";
import { resumirTratamento, situacaoDosCartoes } from "./medicamento.ts";
import { somarDias } from "./episodios.ts";
import { diaLocalDe } from "../datas.ts";
import { temaPorId } from "../conhecimento/catalogo.ts";

const tz = "America/Sao_Paulo";
const agora = Date.parse("2026-10-27T15:00:00Z");
const hoje = diaLocalDe(agora, tz);
const inicio = new Date(Date.parse("2026-10-16T15:00:00Z")); // 11 dias antes de hoje
const doses = [{ id: "d", descricao: "15 mg", mg: 15, desde: inicio }];
const esqueceu = (dias: number[]) => dias.map((d) => ({ dia: somarDias(hoje, d), estado: "nao_tomou" }));

test("sem marcar nada, o app presume que tomou todo dia: a sequência vai do início até ontem", () => {
  const r = resumirTratamento(inicio, doses, [], agora, tz);
  assert.equal(r.sequenciaConfirmada, 11);
  assert.equal(r.totalNaoTomou, 0);
  assert.equal(r.diasSemInformacao, 0, "no modelo presumido não existe dia sem informação");
});

test("esquecer um dia não derruba o tratamento: o dia do tratamento segue, só a sequência recomeça", () => {
  const sem = resumirTratamento(inicio, doses, [], agora, tz);
  const com = resumirTratamento(inicio, doses, esqueceu([-3]), agora, tz);
  assert.equal(com.desdeInicio.diaN, sem.desdeInicio.diaN, "o dia do tratamento não muda");
  assert.equal(com.doseAtual?.contagem.diaN, sem.doseAtual?.contagem.diaN, "o dia na dose também não");
  assert.equal(com.sequenciaConfirmada, 2, "ontem e anteontem, depois do dia esquecido");
  assert.equal(com.totalNaoTomou, 1);
});

test("esquecer ontem ou hoje zera a sequência de agora; o dia esquecido fica contado uma vez só", () => {
  assert.equal(resumirTratamento(inicio, doses, esqueceu([-1]), agora, tz).sequenciaConfirmada, 0);
  assert.equal(resumirTratamento(inicio, doses, esqueceu([0]), agora, tz).sequenciaConfirmada, 0);
  const duplicado = resumirTratamento(inicio, doses, [...esqueceu([-2]), ...esqueceu([-2])], agora, tz);
  assert.equal(duplicado.totalNaoTomou, 1);
});

test("depois de esquecer, o título forte da etapa não aparece, e o texto não culpa", () => {
  const tema = temaPorId("escitalopram")!;
  const r = resumirTratamento(inicio, doses, esqueceu([-3]), agora, tz);
  const c = situacaoDosCartoes(tema.marcos, r).find((x) => x.marco.limiar === 10)!;
  assert.notEqual(c.estado, "sustentado");
  if (c.estado === "so-tempo") {
    assert.equal(c.titulo, "10 dias de tratamento");
    assert.doesNotMatch(`${c.titulo} ${c.texto}`, /perdeu|falhou|culpa|do zero|recome[cç]ar o tratamento/i);
  }
});

test("os cartões deixam claro que o número vale o que a pessoa informou, e nunca pressionam", () => {
  const tema = temaPorId("escitalopram")!;
  for (const m of tema.marcos) {
    assert.doesNotMatch(`${m.titulo} ${m.texto} ${m.tituloSemRegistro} ${m.textoSemRegistro}`, /perder (a )?sequ[eê]ncia|n[aã]o perca|n[aã]o esque[cç]a/i, m.chave);
  }
  const dez = tema.marcos.find((m) => m.limiar === 10)!;
  assert.match(dez.texto, /conforme você informou/);
});

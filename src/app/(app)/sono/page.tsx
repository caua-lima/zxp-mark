import { prisma } from "@/lib/db";
import { usuarioId } from "@/lib/auth";
import { fusoDoUsuario } from "@/lib/usuario";
import { textoLocal } from "@/lib/datas";
import { carregarSono } from "@/lib/servicos/sono";
import { resolverReferencia } from "@/lib/servicos/progresso";
import { montarPainel } from "@/lib/painel-progresso";
import { diasDesdeUltimoRegistro, duracaoMs, sugestaoDeHorarios } from "@/lib/sono";
import { Sono, type RegistroSono } from "@/components/Sono";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sono" };

export default async function PaginaSono() {
  const uid = (await usuarioId())!;
  const agora = Date.now();
  const fuso = await fusoDoUsuario(uid);

  const { historico, resumo } = await carregarSono(prisma, uid, fuso, agora);

  const registros: RegistroSono[] = historico.map((s) => ({
    id: s.id,
    dormiuTexto: textoLocal(s.dormiuEm, fuso),
    acordouTexto: textoLocal(s.acordouEm, fuso),
    duracaoMs: duracaoMs(s),
    qualidade: s.qualidade,
    nota: s.nota,
  }));

  const ref = await resolverReferencia(prisma, uid, "sono", uid, agora);
  const trilha = ref
    ? await montarPainel(prisma, uid, ref, {
        diasSemRegistro: diasDesdeUltimoRegistro(historico, fuso, agora),
      })
    : null;

  return (
    <Sono
      registros={registros}
      resumo={resumo}
      trilha={trilha}
      sugestao={sugestaoDeHorarios(fuso, agora)}
      fuso={fuso}
    />
  );
}

import { Marca } from "@/components/Marca";

export const metadata = { title: "Sem conexão — Marco" };

export default function Offline() {
  return (
    <main className="area-topo area-baixo mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12 text-center">
      <div className="flex justify-center">
        <Marca />
      </div>

      <h1 className="mt-8 text-[24px] font-semibold">Você está sem conexão</h1>
      <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-suave">
        Mas o cronômetro não parou. Ele conta o tempo desde a data que você marcou — internet
        não muda isso.
      </p>

      <div className="cartao mt-8 p-5 text-left">
        <p className="text-[12px] font-medium tracking-wide text-apagado uppercase">
          Se a vontade bateu agora
        </p>
        <ul className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-tinta">
          <li>Um copo de água gelada, de uma vez.</li>
          <li>Sai do cômodo. Muda de ambiente por 3 minutos.</li>
          <li>Respira 4-7-8: inspira em 4, segura 7, solta em 8. Quatro ciclos.</li>
          <li>Escova os dentes.</li>
        </ul>
        <p className="mt-4 border-t border-borda pt-3 text-[13px] leading-relaxed text-suave">
          A onda de fissura dura de 3 a 5 minutos. Ela passa de qualquer jeito — a diferença é
          se passa com você inteiro.
        </p>
      </div>

      <p className="mt-6 text-[13px] text-apagado">
        Assim que a conexão voltar, é só puxar a tela para baixo.
      </p>

      <p className="mt-8 text-[12px] leading-relaxed text-fantasma">
        Precisa de ajuda agora? CVV — 188, gratuito, 24 horas.
      </p>
    </main>
  );
}

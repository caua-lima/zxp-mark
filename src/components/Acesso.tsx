"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Aviso, Botao, Campo, Chave } from "@/components/ui";
import { dataLonga } from "@/lib/formato";

export type Eu = { id: string; nome: string; email: string; admin: boolean; trocarSenha: boolean };

type Usuario = {
  id: string;
  nome: string;
  email: string;
  admin: boolean;
  trocarSenha: boolean;
  criadoEm: string;
  ultimoAcesso: string | null;
  _count: { marcos: number; contagens: number; inscricoes: number };
};

export function Acesso({ eu }: { eu: Eu }) {
  return (
    <main className="space-y-3.5">
      <header className="mb-5">
        <p className="text-[13px] text-apagado">Quem entra no ZXP Mark</p>
        <h1 className="text-[26px] font-semibold tracking-tight">Acesso</h1>
      </header>

      {eu.trocarSenha && (
        <p className="surge rounded-2xl border border-brand/25 bg-brand/[0.08] px-4 py-3.5 text-[13.5px] leading-relaxed text-brand">
          Sua senha foi definida por um administrador. Troque agora por uma só sua.
        </p>
      )}

      <MinhaSenha />

      {eu.admin ? (
        <Usuarios euId={eu.id} />
      ) : (
        <p className="cartao p-5 text-[13.5px] leading-relaxed text-apagado">
          Só administradores podem criar ou editar outros acessos. Se precisar de um acesso novo,
          fale com quem administra o app.
        </p>
      )}
    </main>
  );
}

/* ------------------------------ minha senha ------------------------------ */

function MinhaSenha() {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [conf, setConf] = useState("");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setOk(false);

    if (nova !== conf) {
      setErro("A confirmação não bate com a senha nova.");
      return;
    }

    setOcupado(true);
    try {
      const r = await fetch("/api/acesso/senha", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ senhaAtual: atual, senhaNova: nova }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErro(d.erro ?? "Não consegui trocar a senha.");
        return;
      }
      setAtual("");
      setNova("");
      setConf("");
      setOk(true);
      router.refresh();
      setTimeout(() => setOk(false), 3000);
    } catch {
      setErro("Sem conexão com o servidor.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} className="cartao space-y-3 p-5">
      <h2 className="text-[15px] font-semibold">Minha senha</h2>
      <Campo
        rotulo="Senha atual"
        type="password"
        value={atual}
        onChange={(e) => setAtual(e.target.value)}
        autoComplete="current-password"
        required
      />
      <Campo
        rotulo="Senha nova"
        type="password"
        value={nova}
        onChange={(e) => setNova(e.target.value)}
        autoComplete="new-password"
        minLength={8}
        dica="Mínimo de 8 caracteres."
        required
      />
      <Campo
        rotulo="Repita a senha nova"
        type="password"
        value={conf}
        onChange={(e) => setConf(e.target.value)}
        autoComplete="new-password"
        required
      />

      <Aviso>{erro}</Aviso>
      {ok && <p className="text-[13px] text-sucesso">Senha trocada. ✓</p>}

      <Botao type="submit" carregando={ocupado} className="w-full">
        Trocar senha
      </Botao>
    </form>
  );
}

/* -------------------------------- usuários ------------------------------- */

function Usuarios({ euId }: { euId: string }) {
  const [lista, setLista] = useState<Usuario[] | null>(null);
  const [erro, setErro] = useState("");
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch("/api/acesso/usuarios");
      const d = await r.json();
      if (!r.ok) {
        setErro(d.erro ?? "Não consegui carregar os acessos.");
        return;
      }
      setLista(d.usuarios);
      setErro("");
    } catch {
      setErro("Sem conexão com o servidor.");
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <>
      <section className="cartao p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold">
            Acessos {lista && <span className="text-apagado">({lista.length})</span>}
          </h2>
          <button
            onClick={() => {
              setCriando((v) => !v);
              setEditando(null);
            }}
            className="rounded-xl bg-brand px-3.5 py-2 text-[13px] font-semibold text-brand-ink active:bg-brand-escuro"
          >
            {criando ? "Cancelar" : "+ Novo"}
          </button>
        </div>

        <Aviso>{erro}</Aviso>

        {criando && (
          <FormUsuario
            aoSalvar={() => {
              setCriando(false);
              void carregar();
            }}
          />
        )}

        {lista === null ? (
          <p className="pulso mt-4 text-[13.5px] text-apagado">Carregando…</p>
        ) : (
          <div className="mt-4 divide-y divide-borda">
            {lista.map((u) => (
              <LinhaUsuario
                key={u.id}
                usuario={u}
                souEu={u.id === euId}
                aberto={editando === u.id}
                aoAbrir={() => setEditando(editando === u.id ? null : u.id)}
                aoMudar={() => {
                  setEditando(null);
                  void carregar();
                }}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function LinhaUsuario({
  usuario,
  souEu,
  aberto,
  aoAbrir,
  aoMudar,
}: {
  usuario: Usuario;
  souEu: boolean;
  aberto: boolean;
  aoAbrir: () => void;
  aoMudar: () => void;
}) {
  return (
    <div className="py-3.5">
      <button onClick={aoAbrir} className="flex w-full items-start justify-between gap-3 text-left">
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-medium text-tinta">{usuario.nome}</span>
            {usuario.admin && (
              <span className="shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand">
                ADMIN
              </span>
            )}
            {souEu && <span className="shrink-0 text-[10px] text-apagado">você</span>}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-apagado">{usuario.email}</span>
          <span className="mt-1 block text-[11.5px] text-fantasma">
            {usuario._count.marcos} marcos · {usuario._count.inscricoes} aparelhos ·{" "}
            {usuario.ultimoAcesso
              ? `último acesso ${dataLonga(usuario.ultimoAcesso)}`
              : "nunca entrou"}
          </span>
        </span>
        <span className={`shrink-0 text-apagado transition-transform ${aberto ? "rotate-90" : ""}`}>
          ›
        </span>
      </button>

      {aberto && <FormUsuario usuario={usuario} souEu={souEu} aoSalvar={aoMudar} />}
    </div>
  );
}

function FormUsuario({
  usuario,
  souEu,
  aoSalvar,
}: {
  usuario?: Usuario;
  souEu?: boolean;
  aoSalvar: () => void;
}) {
  const editando = !!usuario;
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [senha, setSenha] = useState("");
  const [admin, setAdmin] = useState(usuario?.admin ?? false);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setOcupado(true);
    try {
      const corpo: Record<string, unknown> = { nome: nome.trim(), email: email.trim(), admin };
      if (senha) corpo.senha = senha;

      const r = await fetch(
        editando ? `/api/acesso/usuarios/${usuario.id}` : "/api/acesso/usuarios",
        {
          method: editando ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(corpo),
        }
      );
      const d = await r.json();
      if (!r.ok) {
        setErro(d.erro ?? "Não consegui salvar.");
        return;
      }
      aoSalvar();
    } catch {
      setErro("Sem conexão com o servidor.");
    } finally {
      setOcupado(false);
    }
  }

  async function apagar() {
    setOcupado(true);
    setErro("");
    try {
      const r = await fetch(`/api/acesso/usuarios/${usuario!.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) {
        setErro(d.erro ?? "Não consegui apagar.");
        setConfirmando(false);
        return;
      }
      aoSalvar();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} className="surge mt-3.5 space-y-3 rounded-2xl bg-white/[0.03] p-4">
      <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required />
      <Campo
        rotulo="E-mail"
        type="email"
        inputMode="email"
        autoCapitalize="none"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Campo
        rotulo={editando ? "Nova senha" : "Senha"}
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        autoComplete="new-password"
        minLength={8}
        placeholder={editando ? "deixe vazio para manter" : "mínimo de 8 caracteres"}
        dica={editando ? "Preencha só se quiser redefinir." : undefined}
        required={!editando}
      />

      <div className="border-t border-borda pt-1">
        <Chave
          ligado={admin}
          aoMudar={setAdmin}
          rotulo="Administrador"
          descricao="Pode criar, editar e apagar acessos."
        />
      </div>

      <Aviso>{erro}</Aviso>

      <Botao type="submit" carregando={ocupado} className="w-full">
        {editando ? "Salvar alterações" : "Criar acesso"}
      </Botao>

      {editando && !souEu && (
        <div className="border-t border-borda pt-3">
          {confirmando ? (
            <div className="space-y-2.5">
              <p className="text-[13px] leading-relaxed text-perigo">
                Isso apaga o acesso de {usuario.nome} e junto os {usuario._count.marcos} marcos,
                as recaídas, as contagens e as conversas. Não dá para desfazer.
              </p>
              <div className="flex gap-2">
                <Botao variante="fantasma" onClick={() => setConfirmando(false)} className="flex-1">
                  Cancelar
                </Botao>
                <Botao variante="perigo" onClick={apagar} carregando={ocupado} className="flex-1">
                  Apagar mesmo assim
                </Botao>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="text-[13.5px] text-perigo/80 active:text-perigo"
            >
              Apagar este acesso
            </button>
          )}
        </div>
      )}
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Aviso, Botao, Campo } from "@/components/ui";

export function FormAuth({
  modo,
  cadastroAberto = true,
}: {
  modo: "entrar" | "criar";
  cadastroAberto?: boolean;
}) {
  const router = useRouter();
  const criando = modo === "criar";

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setOcupado(true);
    try {
      const r = await fetch(`/api/auth/${criando ? "registrar" : "entrar"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          criando
            ? {
                nome,
                email,
                senha,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              }
            : { email, senha }
        ),
      });
      const dados = await r.json();
      if (!r.ok) {
        setErro(dados.erro ?? "Algo deu errado. Tente de novo.");
        return;
      }
      // Conta nova cai direto na criação do primeiro marco: sem marco, o app
      // inteiro é uma tela vazia.
      router.replace(criando ? "/marcos/novo" : "/marcos");
      router.refresh();
    } catch {
      setErro("Sem conexão com o servidor.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      {criando && (
        <Campo
          rotulo="Como te chamo?"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoComplete="given-name"
          placeholder="Seu nome"
          required
        />
      )}
      <Campo
        rotulo="E-mail"
        type="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        autoCapitalize="none"
        placeholder="voce@email.com"
        required
      />
      <Campo
        rotulo="Senha"
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        autoComplete={criando ? "new-password" : "current-password"}
        placeholder={criando ? "Mínimo de 8 caracteres" : "Sua senha"}
        minLength={criando ? 8 : undefined}
        required
      />

      <Aviso>{erro}</Aviso>

      <Botao type="submit" carregando={ocupado} className="mt-2 w-full">
        {criando ? "Criar minha conta" : "Entrar"}
      </Botao>

      {(criando || cadastroAberto) && (
        <p className="pt-2 text-center text-[14px] text-apagado">
          {criando ? "Já tem conta? " : "Ainda não tem conta? "}
          <Link
            href={criando ? "/entrar" : "/criar-conta"}
            className="font-medium text-brand hover:text-brand-forte"
          >
            {criando ? "Entrar" : "Criar agora"}
          </Link>
        </p>
      )}
    </form>
  );
}

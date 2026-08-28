# Marco

App de marcos e contagens regressivas para iPhone. PWA instalável, com notificação push nativa do iOS, contas individuais e um chat que sabe exatamente há quanto tempo você está firme.

Identidade visual ZXP Solutions: preto + amarelo + branco.

---

## O que ele faz

**Marcos** — você escolhe o que quer largar (fumar, vape, álcool, açúcar, pornografia, redes, apostas, cafeína ou um hábito seu) e o cronômetro começa. Cada hábito tem uma linha do tempo própria, baseada no que de fato acontece no corpo: 20 minutos, 1h, 6h, 8h, 12h, 24h, 72h, 1 semana, 1 mês… até 15 anos. A cada marco atingido chega uma notificação com o que está acontecendo com você *naquele momento*.

> 🚭 **6 HORAS SEM FUMAR**
> Seu corpo já está se livrando da nicotina de verdade. Quando você acordar amanhã, ele vai pedir — é o pico matinal. Segure firme: passa em minutos e você volta a mandar.
> *R$ 3,00 economizados · 5 cigarros a menos*

**Contagens** — marque uma data (viagem dia 13 de novembro) e ela vira contagem regressiva ao vivo, com aviso em D-30, D-14, D-7, D-3, D-1 e no dia. Os marcos de aviso são configuráveis por contagem.

**Ajuda** — chat com Claude que recebe, a cada mensagem, o seu retrato exato: tempo da sequência atual, próximo marco e quanto falta, dinheiro economizado, histórico de recaídas e gatilhos, o "porquê" que você escreveu, e as contagens em aberto. Pergunte *"por que não devo fumar agora?"* e a resposta usa os seus números, não conselho genérico.

**Recaída** não é fracasso: registra o gatilho, guarda quanto durou a sequência, mantém o recorde pessoal e reinicia o relógio.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilo | Tailwind v4 com os tokens da ZXP |
| Banco | PostgreSQL via Prisma 6 |
| Auth | Sessão própria — scrypt + JWT (`jose`) em cookie httpOnly |
| Push | Web Push (VAPID) com service worker próprio |
| Chat | `@anthropic-ai/sdk`, modelo `claude-opus-5`, resposta em streaming |

Sem dependência de serviço externo de auth ou de push.

---

## Subir na Vercel — passo a passo

### 1. Banco de dados

Crie um Postgres (Neon, Supabase ou Vercel Postgres) e copie a **connection string com pool** (`-pooler`, `pgbouncer=true` ou equivalente). Serverless abre muita conexão; sem pool o banco derruba.

### 2. Segredos

```bash
npm install
npm run vapid
```

Isso cria o `.env.local` já com `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `AUTH_SECRET` e `CRON_SECRET`. Falta só colar o `DATABASE_URL` e o `ANTHROPIC_API_KEY` (pegue em [console.anthropic.com](https://console.anthropic.com)).

### 3. Criar as tabelas

```bash
npm run db:push
```

### 4. Rodar local

```bash
npm run dev
```

### 5. Deploy

Importe o repositório na Vercel e cole **todas** as variáveis do `.env.local` em Settings → Environment Variables. O build já roda `prisma generate`.

### 6. Ligar o cron ⚠️ *o passo que faz as notificações existirem*

O `vercel.json` vem com cron **diário**, porque é o máximo que o plano Hobby aceita. Só com ele, um marco de 6 horas só chegaria no dia seguinte.

**Plano Pro:** troque a linha no `vercel.json` e pronto.

```json
{ "crons": [{ "path": "/api/cron/tick", "schedule": "*/5 * * * *" }] }
```

**Plano Hobby (grátis):** use um cron externo. Em [cron-job.org](https://cron-job.org) (gratuito), crie um job a cada 5 minutos apontando para:

```
https://SEU-APP.vercel.app/api/cron/tick?chave=SEU_CRON_SECRET
```

Há ainda uma rede de segurança embutida: toda vez que o app é aberto, ele verifica os marcos vencidos daquele usuário e dispara o que faltou. Mesmo sem cron nenhum você não perde marcos — eles só chegam quando você abre o app em vez de na hora exata.

### 7. Conferir se ficou tudo de pé

```
https://SEU-APP.vercel.app/api/saude?chave=SEU_CRON_SECRET
```

Responde o que está configurado, o que falta e se o banco conecta.

---

## Instalar no iPhone

Notificação push no iOS **só funciona com o app na tela de início**. Não tem como contornar — é regra da Apple.

1. Abra o site no **Safari** (não funciona pelo Chrome do iPhone)
2. Botão **Compartilhar** → **Adicionar à Tela de Início**
3. Abra pelo ícone novo
4. Aba **Perfil** → **Ativar notificações** → permitir

Uma notificação de confirmação chega na hora. Se não chegar, use **Enviar teste** na mesma tela. Depois disso pode fechar o app: os avisos chegam com ele fechado.

O app também tem atalhos de toque longo no ícone: *Estou com vontade*, *Meus marcos* e *Contagens*.

---

## Estrutura

```
prisma/schema.prisma      modelo de dados
scripts/gerar-vapid.mjs   gera chaves e segredos no .env.local
scripts/gerar-icones.mjs  desenha os PNGs do PWA (sem dependência externa)
public/sw.js              service worker: recebe o push e abre o app no lugar certo
src/lib/habitos.ts        catálogo de hábitos e a linha do tempo de cada um
src/lib/motor.ts          decide o que está vencido e dispara — com dedupe
src/lib/ia.ts             instruções do chat + retrato ao vivo do usuário
src/lib/auth.ts           scrypt, JWT e sessão
src/app/(app)/            as quatro abas
src/app/api/              rotas
```

### Onde mexer para ajustar o conteúdo

- **Textos das notificações e marcos de cada hábito** → `src/lib/habitos.ts`. Cada entrada tem `chave`, `ms`, `titulo` e `corpo`. Adicionar um marco novo é adicionar um objeto ao array.
- **Personalidade e regras do chat** → a constante `INSTRUCOES` em `src/lib/ia.ts`.
- **Quando cada aviso dispara** → `src/lib/motor.ts`.
- **Cores** → os tokens em `src/app/globals.css`.

---

## Detalhes de implementação que importam

**Notificação nunca duplica.** Antes de enviar, o motor grava uma linha em `Enviada` com índice único em `(refId, chave, ciclo)`. Se dois ticks rodarem juntos, o segundo bate na constraint e desiste. Como a chave inclui o `cicloInicio` do marco, uma recaída libera todos os avisos de novo naturalmente.

**Nada de rajada.** Se o cron ficar horas parado e você tiver passado por vários marcos, só o mais recente vira notificação; os anteriores são registrados em silêncio. Marcos atingidos há mais de 6 horas também não notificam — chegar "6 horas sem fumar" no dia seguinte não ajuda ninguém.

**Fuso do usuário.** Resumo da manhã e avisos de contagem usam o fuso salvo no perfil, não o do servidor.

**Hidratação.** Os cronômetros renderizam vazios no servidor e só começam a contar depois de montados — o relógio do servidor nunca bate com o do celular.

**Chat com fallback.** Usa o fallback do lado do servidor da Anthropic; se a API não aceitar a flag, refaz a chamada sem ela, desde que nada tenha sido transmitido ainda. Limite de 60 mensagens por hora por conta.

---

## Aviso

O Marco não substitui médico, psicólogo ou psiquiatra. Abstinência grave de álcool pode ser perigosa e exige avaliação médica. Se precisar de ajuda agora: **CVV — 188**, gratuito, 24 horas.

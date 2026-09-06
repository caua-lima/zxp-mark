# Marco

App de marcos e contagens regressivas para iPhone. PWA instalável, com notificação push nativa do iOS, contas individuais e um chat que sabe exatamente há quanto tempo você está firme.

Identidade visual ZXP Solutions. O kit oficial está em `public/marca` e é a fonte de tudo: **onyx `#10100E`**, **dourado `#F4B942`**, **marfim `#F6F3E8`** e tipografia **Sora**. Os ícones do PWA são gerados do PNG oficial, não redesenhados.

---

## O que ele faz

**Marcos** — você escolhe o que quer largar (fumar, vape, álcool, açúcar, pornografia, redes, apostas, cafeína ou um hábito seu) e o cronômetro começa. Cada hábito tem uma linha do tempo própria, baseada no que de fato acontece no corpo: 20 minutos, 1h, 6h, 8h, 12h, 24h, 72h, 1 semana, 1 mês… até 15 anos. A cada marco atingido chega uma notificação com o que está acontecendo com você *naquele momento*.

> 🚭 **6 HORAS SEM FUMAR**
> Seu corpo já está se livrando da nicotina de verdade. Quando você acordar amanhã, ele vai pedir — é o pico matinal. Segure firme: passa em minutos e você volta a mandar.
> *R$ 3,00 economizados · 5 cigarros a menos*

**Contagens** — marque uma data (viagem dia 13 de novembro) e ela vira contagem regressiva ao vivo, com aviso em D-30, D-14, D-7, D-3, D-1 e no dia. Os marcos de aviso são configuráveis por contagem.

**Ajuda** — chat que recebe, a cada mensagem, o seu retrato exato: tempo da sequência atual, próximo marco e quanto falta, dinheiro economizado, histórico de recaídas e gatilhos, o "porquê" que você escreveu, e as contagens em aberto. Pergunte *"por que não devo fumar agora?"* e a resposta usa os seus números, não conselho genérico. **Funciona de graça, sem nenhuma API** — veja [Chat: quanto custa](#chat-quanto-custa-nada).

**Conquistas** — tudo que você já bateu, em ordem, com a data de cada uma. Mais recordes, o que está chegando e um botão de compartilhar.

**Funciona offline** — o app abre sem internet e a tela offline traz o protocolo de fissura, que não precisa de dado nenhum.

**Acesso** — aba própria para trocar a própria senha e, para quem é admin, criar, editar, promover e apagar acessos. Com `CADASTRO_ABERTO=false` o cadastro público fecha e só o admin abre porta.

**Recaída** não é fracasso: registra o gatilho, guarda quanto durou a sequência, mantém o recorde pessoal e reinicia o relógio.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilo | Tailwind v4 com os tokens da ZXP (Sora nos títulos, Inter no corpo) |
| Banco | PostgreSQL via Prisma 6 |
| Auth | Sessão própria — scrypt + JWT (`jose`) em cookie httpOnly |
| Push | Web Push (VAPID) com service worker próprio |
| Chat | motor local próprio + provedores opcionais (Groq, Gemini, OpenRouter, Anthropic) em streaming |

Sem dependência de serviço externo de auth ou de push.

---

## Subir na Vercel — passo a passo

### 1. Banco de dados

Crie um Postgres e copie a **connection string com pool**. Serverless abre muita conexão; sem pool o banco derruba.

| | `DATABASE_URL` (app) | `DIRECT_URL` (só migração) |
|---|---|---|
| **Neon** | a que tem `-pooler` no host | deixe vazio — é deduzida tirando o `-pooler` |
| **Supabase** | Transaction pooler, porta **6543**, + `?pgbouncer=true&connection_limit=1` | Session pooler, porta **5432** |

O `npm run db:push` avisa se você trocar as duas de lugar — o pooler de transação derruba o DDL no meio da migração.

### 2. Segredos

```bash
npm install
npm run vapid
```

Isso cria o `.env.local` já com `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `AUTH_SECRET` e `CRON_SECRET`. Falta só colar o `DATABASE_URL`.

Não precisa de chave de IA nenhuma: o chat funciona de graça no motor local.

### 3. Criar as tabelas

Cole a `DATABASE_URL` no `.env.local` e rode:

```bash
npm run db:push
```

(O script faz a ponte do `.env.local` para o Prisma CLI, que por padrão só lê `.env`.)

### 4. Rodar local

```bash
npm run dev
```

### 5. Deploy

Gere o bloco pronto e cole de uma vez:

```bash
npm run vercel-env
```

Isso escreve `VERCEL-ENV.txt` (fora do git) já sem o que só existe na máquina local. Na Vercel: Settings → Environment Variables → cole o arquivo inteiro → **Deployments → Redeploy**. O build já roda `prisma generate`.

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

Responde o que está configurado, o que falta, qual motor de chat está ativo e se o banco conecta.

---

## Chat: quanto custa? Nada.

O chat tem dois níveis, e o de baixo **nunca cobra e nunca cai**.

### Nível 1 — motor local (padrão, sem configurar nada)

Sem nenhuma chave de API, a aba Ajuda já funciona. Não é um modelo de linguagem: é um classificador de intenção em português que monta a resposta com os **seus números reais**. Reconhece fissura, "por que não devo", quanto tempo, seu porquê, o que está acontecendo no corpo, recaída, dinheiro, próximo marco, contagens, desânimo e saudação — e escolhe a ação de 5 minutos pela hora do dia (o que serve às 3 da manhã não é o que serve às 8).

Vantagens que um modelo pago não tem: responde na hora, funciona com internet ruim, custa zero e **nunca inventa um número**.

### Nível 2 — um provedor com nível gratuito (opcional, deixa a conversa mais solta)

Se quiser linguagem mais natural, ligue **uma** chave. Todas as opções abaixo têm nível gratuito e não pedem cartão:

| Provedor | Onde pegar a chave | Variável |
|---|---|---|
| **Groq** (recomendado — o mais rápido) | [console.groq.com/keys](https://console.groq.com/keys) | `GROQ_API_KEY` |
| **Google Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | `GEMINI_API_KEY` |
| **OpenRouter** (modelos `:free`) | [openrouter.ai/keys](https://openrouter.ai/keys) | `OPENROUTER_API_KEY` |

Cole a variável na Vercel e pronto — nada mais muda no código.

> Os níveis gratuitos têm limite de requisições por minuto e por dia, e cada provedor muda esses números quando quer. **Quando o limite estoura, o motor local assume no meio da conversa** e você não vê erro nenhum. É por isso que dá para depender disso sem medo.

`ANTHROPIC_API_KEY` também é aceita, mas a Anthropic **não tem nível gratuito** — só use se quiser mesmo pagar.

Para forçar um motor: `IA_PROVEDOR=local` (ou `groq`, `gemini`, `openrouter`, `anthropic`). Para trocar o modelo: `IA_MODELO=...`.

O cartão "Motor da aba Ajuda", no Perfil, mostra qual está ativo e se é grátis.

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
public/marca/             kit oficial da ZXP (SVG, PNG, favicon)
scripts/gerar-icones.mjs  reamostra os ícones do PWA a partir de public/marca
scripts/prisma-com-env.mjs  faz o Prisma CLI enxergar o .env.local
public/sw.js              push + cache do casco para funcionar offline
src/lib/habitos.ts        catálogo de hábitos e a linha do tempo de cada um
src/lib/motor.ts          decide o que está vencido e dispara — com dedupe
src/lib/ia/contexto.ts    retrato ao vivo do usuário (fonte única de verdade)
src/lib/ia/local.ts       motor local gratuito + detector de crise
src/lib/ia/provedores.ts  Groq, Gemini, OpenRouter e Anthropic em streaming
src/lib/ia/instrucoes.ts  personalidade e regras do chat
src/lib/senha.ts          scrypt puro, compartilhado com os scripts de CLI
src/lib/auth.ts           JWT e sessão
src/lib/admin.ts          guarda de rota para as ações de admin
scripts/criar-acesso.mjs  cria o primeiro admin direto no banco
src/app/(app)/            as quatro abas + conquistas
src/app/offline/          tela util quando nao ha conexao
src/app/api/              rotas
```

### Onde mexer para ajustar o conteúdo

- **Textos das notificações e marcos de cada hábito** → `src/lib/habitos.ts`. Cada entrada tem `chave`, `ms`, `titulo` e `corpo`. Adicionar um marco novo é adicionar um objeto ao array.
- **Respostas do motor gratuito** → `src/lib/ia/local.ts`. As ações de 5 minutos estão em `ACOES_MADRUGADA`/`MANHA`/`TARDE`/`NOITE`.
- **Personalidade do chat com LLM** → a constante `INSTRUCOES` em `src/lib/ia/instrucoes.ts`.
- **Quando cada aviso dispara** → `src/lib/motor.ts`.
- **Cores e tipografia** → os tokens em `src/app/globals.css`, tirados dos SVGs de `public/marca`.
- **Ícones do PWA** → `npm run icons` regenera tudo a partir de `public/marca/app-icon-onyx-1024.png`.

---

## Detalhes de implementação que importam

**Notificação nunca duplica.** Antes de enviar, o motor grava uma linha em `Enviada` com índice único em `(refId, chave, ciclo)`. Se dois ticks rodarem juntos, o segundo bate na constraint e desiste. Como a chave inclui o `cicloInicio` do marco, uma recaída libera todos os avisos de novo naturalmente.

**Nada de rajada.** Se o cron ficar horas parado e você tiver passado por vários marcos, só o mais recente vira notificação; os anteriores são registrados em silêncio. Marcos atingidos há mais de 6 horas também não notificam — chegar "6 horas sem fumar" no dia seguinte não ajuda ninguém.

**Fuso do usuário.** Resumo da manhã e avisos de contagem usam o fuso salvo no perfil, não o do servidor.

**Offline sem vazar.** O casco (tela offline, ícones, assets do build) fica em cache permanente; páginas com dado seu vão para um cache separado que o logout apaga por postMessage. Chamada de API nunca é cacheada — dado velho de marco é pior do que erro honesto.

**Hidratação.** Os cronômetros renderizam vazios no servidor e só começam a contar depois de montados — o relógio do servidor nunca bate com o do celular.

**Chat que não cai.** O provedor externo é a camada de cima, nunca a base. Se ele der erro, estourar o limite ou devolver vazio, o motor local completa a resposta na mesma requisição — sem mensagem de erro para o usuário. Limite de 120 mensagens por hora por conta.

**Crise tem resposta fixa.** Frases de risco de vida ou de abstinência grave são detectadas por regex antes de qualquer provedor ser chamado, e a resposta com CVV 188 / SAMU 192 sai sempre — não depende de o modelo lembrar do número. A detecção usa regex e não busca de substring de propósito: "não quero *mais* viver" não bate com a string "não quero viver", e um falso negativo aqui é inaceitável.

---

## Criar o primeiro acesso

Quando o banco está vazio não existe admin para usar a aba Acesso. Crie o primeiro pela linha de comando:

```bash
npm run acesso -- --email voce@dominio.com --nome "Seu Nome" --admin
```

Sem `--senha`, ele gera uma temporária forte e grava em `ACESSO-TEMPORARIO.txt` (fora do git). Entre no app, troque a senha na aba Acesso e apague o arquivo. Daí em diante todo acesso novo sai pela própria aba.

---

## Aviso

O Marco não substitui médico, psicólogo ou psiquiatra. Abstinência grave de álcool pode ser perigosa e exige avaliação médica. Se precisar de ajuda agora: **CVV — 188**, gratuito, 24 horas.

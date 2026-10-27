# ZXP Mark

App de marcos e contagens regressivas para iPhone. **ZXP Mark** — o nome do produto; "marco" no app é sempre a conquista, nunca o app. PWA instalável, com notificação push nativa do iOS, contas individuais e um chat que sabe exatamente há quanto tempo você está firme.

Parte da família **ZXP Solutions**. DNA comum: onyx `#10100E`, marfim `#F6F3E8` e tipografia Sora. Cor de assinatura deste app: **magenta `#EC4899`** — veja [Identidade visual](#identidade-visual--não-improvise).

---

## O que ele faz

**Marcos** — você **escreve** o que quer largar, com as suas palavras, e o sistema reconhece o hábito para carregar a linha do tempo certa ("quero largar o cigarro" → 27 marcos de cessação de nicotina). Não reconheceu, usa a linha geral. O cronômetro começa na hora. Cada hábito tem uma linha do tempo própria: 20 minutos, 1h, 6h, 8h, 12h, 24h, 72h, 1 semana, 1 mês… até 15 anos. A cada marco atingido chega uma notificação com constância, gatilhos e — **só para o cigarro, e só com fonte citada** — o que a literatura aponta como benefício possível (veja [Conteúdo de saúde](#conteúdo-de-saúde-fonte-ou-nada)).

> 🚭 **6 HORAS SEM FUMAR**
> Seu corpo já está eliminando a nicotina. Quando você acordar amanhã, é comum vir um pedido forte — segure firme: passa em minutos e você volta a mandar.
> *R$ 3,00 economizados · 5 cigarros a menos*

**Contagem** — uma aba com dois jeitos de contar, escolhidos pela URL (`/contagem?modo=desde` ou `?modo=regressiva`; sem parâmetro abre na Regressiva).

- **Desde o início** — o tempo corrido desde uma data: início de um tratamento, de uma rotina, de um projeto. O número grande são os **dias completos** (24 h vividas) e o **“dia N”** aparece ao lado, com o dia do início contado como dia 1. Antes de 24 h o destaque são as horas. Em **tratamento** a frase é “12 dias desde o início do tratamento” e o contador diz que não registra doses nem substitui orientação profissional. Não tem recaída, não tem “streak” e não manda notificação.
- **Regressiva** — marque uma data e ela vira contagem regressiva ao vivo. Quando o dia passa, o cartão mostra **Concluída · aconteceu há N dias** (nunca número negativo) e pode ser arquivado. O ícone é escolhido pelo sistema a partir do título ("Viagem para a praia" vira ✈️, "Prova do ENEM" vira 📝) e por padrão chega **um aviso por dia**: faltam 66 dias, faltam 65 dias, e assim por diante. Dá para trocar por avisos só em D-30, D-14, D-7, D-3, D-1 e no dia.

**Ajuda** — chat que recebe, a cada mensagem, o seu retrato exato: tempo da sequência atual, próximo marco e quanto falta, dinheiro economizado, histórico de recaídas e gatilhos, o "porquê" que você escreveu, e as contagens em aberto. Pergunte *"por que não devo fumar agora?"* e a resposta usa os seus números, não conselho genérico. **Funciona de graça, sem nenhuma API** — veja [Chat: quanto custa](#chat-quanto-custa-nada).

**Conquistas** — tudo que você já bateu, em ordem, com a data de cada uma. Mais recordes, o que está chegando e um botão de compartilhar.

**Funciona offline** — o app abre sem internet e a tela offline traz o protocolo de fissura, que não precisa de dado nenhum.

**Acesso** — aba própria para trocar a própria senha e, para quem é admin, criar, editar, promover e apagar acessos. Com `CADASTRO_ABERTO=false` o cadastro público fecha e só o admin abre porta.

**Recaída** não é fracasso: registra o gatilho, guarda quanto durou a sequência, mantém o recorde pessoal e reinicia o relógio.

**Trilha de progresso** — cada hábito e cada contagem desde o início tem uma trilha de etapas: onde você está, o que já conquistou, o próximo passo e por que vale continuar. Cada etapa separa três coisas que nunca se misturam: **conquista registrada** (dados do app), **benefício possível** (educativo, com fonte e data) e **melhora percebida** (o que *você* escreve, opcional, nunca obrigatório). Celebração grande só nas etapas relevantes (dia, semana, mês…); o resto é um aviso discreto. Não repete ao recarregar, não duplica com toque duplo, e corrigir uma data de início **não** gera recompensa retroativa.

**Sono** — acessado por um cartão em Marcos (não é uma aba nova). Registre quando dormiu e quando acordou (pode atravessar a meia-noite), com qualidade de 1 a 5 e observação opcional. Gráfico dos últimos 7 dias, média, noites registradas e histórico. Dia sem registro fica em branco — **nunca conta como zero hora** — e a média divide só pelos dias com dado. A duração é a do intervalo informado, não do sono em si. A trilha reconhece o hábito de **registrar**, nunca dormir mais, e pausas não apagam o que já foi registrado.

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

## Identidade visual — não improvise

O ZXP Mark é um dos 4 apps da **ZXP Solutions** (Market, Tasks, Finance, Mark). Todos compartilham o mesmo DNA visual; o que separa um do outro é **uma cor de assinatura**, como Gmail/Calendar/Drive fazem no Workspace.

### DNA da família (não muda)

| | |
|---|---|
| Fundo | onyx `#10100E` — **nunca preto puro** |
| Texto | marfim `#F6F3E8` — **nunca branco puro** |
| Tipografia | Sora (700-800) nos títulos; Inter (400-600) no corpo |
| Símbolo | o "Z" de **traço**, nunca preenchimento |

O Z tem geometria fixa: pontos `30,47 170,47 30,153 170,153`, espessura 34, junção em esquadria, ponta reta. Está em [Marca.tsx](src/components/Marca.tsx) como `MarcaZ`, `MarcaIcone` e `Marca`.

### Cor de assinatura deste app: magenta

| Token | Valor | Uso |
|---|---|---|
| `--color-brand` | `#EC4899` | ações primárias, estado ativo, foco, o Z |
| `--color-brand-escuro` | `#C2377A` | hover e pressed — o magenta **escurece**, não clareia |
| `--color-brand-ink` | `#10100E` | texto sobre magenta |

Sobre o `brand-ink`: onyx sobre magenta dá **5,4:1** e passa em AA; marfim daria 3,2:1 e falharia. Por isso botão magenta leva texto onyx, não marfim.

> ⚠️ **O dourado `#F4B942` pertence ao ZXP Market.** Não deve reaparecer aqui. Os arquivos em `public/marca` estão na cor dele e servem só como referência da família e fonte da geometria do Z — `npm run icons` recolore para magenta preservando o canal alfa, então a forma nunca é redesenhada.

### Regras

- Hexadecimal de marca vive **só** em [globals.css](src/app/globals.css). Componentes usam token (`text-brand`) ou `var(--color-brand)`. Única exceção: `themeColor` no metadata, que é meta tag e não aceita `var()`.
- `npm run icons` regenera ícones e favicons a partir do Z oficial.
- A cor da ferramenta não vaza para o que o app exporta: a exportação é JSON de dados, o compartilhar é texto e as notificações são texto — nenhum deles carrega cor.

Verificação de que nada saiu da linha:

```bash
grep -rnoiE "#f4b942|#ffd98a|#ec4899|#c2377a|text-white" src/ | grep -v globals.css
```

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
src/lib/beneficios.ts     benefícios possíveis, cada um com fonte, órgão e data de revisão
src/lib/datas.ts          regras de data e fuso: dia completo vs dia N, relógio de parede → instante
src/lib/progressao.ts     trilha de etapas e escolha da celebração (puro, testado)
src/lib/acompanhamento.ts regras da contagem crescente (puro, testado)
src/lib/sono.ts           validação, sobreposição e resumo de 7 dias (puro, testado)
src/lib/servicos/         persistência com autorização por dono + testes de integração
src/lib/conhecimento/    catálogo de temas com fontes, validador editorial, busca e assistente
src/lib/rastreio/         regras de acompanhamento: episódios, medicamento, humor, lembrete (puro, testado)
src/lib/api-saude.ts      sessão, fuso e erros comuns das rotas de saúde
src/lib/painel-progresso.ts monta, no servidor, tudo que a trilha mostra
src/lib/motor.ts          decide o que está vencido e dispara — com dedupe
src/lib/ia/contexto.ts    retrato ao vivo do usuário (fonte única de verdade)
src/lib/ia/local.ts       motor local gratuito + detector de crise
src/lib/ia/provedores.ts  Groq, Gemini, OpenRouter e Anthropic em streaming
src/lib/ia/instrucoes.ts  personalidade e regras do chat
src/lib/senha.ts          scrypt puro, compartilhado com os scripts de CLI
src/lib/auth.ts           JWT e sessão
src/lib/admin.ts          guarda de rota para as ações de admin
scripts/criar-acesso.mjs  cria o primeiro admin direto no banco
src/app/(app)/            as abas (marcos, contagem, ajuda, acesso, perfil) + conquistas, sono e temas
src/app/offline/          tela util quando nao ha conexao
src/app/api/              rotas
```

### Onde mexer para ajustar o conteúdo

- **Textos das notificações e marcos de cada hábito** → `src/lib/habitos.ts`. Cada entrada tem `chave`, `ms`, `titulo` e `corpo`. Adicionar um marco novo é adicionar um objeto ao array. **Não mude `chave`, `ms` nem `titulo` de um marco existente**: a chave deduplica notificações já enviadas. E leia antes a [política de conteúdo de saúde](#conteúdo-de-saúde-fonte-ou-nada).
- **Benefícios com fonte** → `src/lib/beneficios.ts`.
- **Temas educativos (unhas, escitalopram, sono…)** → `src/lib/conhecimento/temas/`. Leia antes [Temas, saúde e privacidade](#temas-saúde-e-privacidade).
- **Etapas da trilha** (marcos de engajamento, noites de sono) → `src/lib/progressao.ts`.
- **Respostas do motor gratuito** → `src/lib/ia/local.ts`. As ações de 5 minutos estão em `ACOES_MADRUGADA`/`MANHA`/`TARDE`/`NOITE`.
- **Reconhecimento de hábito e ícone** → `src/lib/deteccao.ts`. Adicionar um termo é acrescentar uma palavra numa lista.
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

**Celebração não repete.** Cada (usuário, item, etapa, ciclo) é único em `ConquistaVista`; a etapa é marcada como vista quando a celebração *aparece* (não quando é fechada), então recarregar não a traz de volta. O primeiro olhar a um ciclo semeia as etapas já atingidas em silêncio (linha `_base`) — é isso que impede data corrigida ou marco antigo de virar uma enxurrada de comemorações.

**Sono: duplo toque não duplica.** Conferir sobreposição e gravar rodam numa transação com `pg_advisory_xact_lock` por usuário. Sem a trava, duas requisições simultâneas conferem juntas, acham o caminho livre e gravam as duas.

**Hora digitada é do fuso do usuário.** O servidor roda em UTC; “23:00” digitado em São Paulo é convertido com o fuso do perfil (`instanteLocal` em `datas.ts`), que também recusa o que não existe (30/fev, horário pulado no horário de verão).

**Chat que não cai.** O provedor externo é a camada de cima, nunca a base. Se ele der erro, estourar o limite ou devolver vazio, o motor local completa a resposta na mesma requisição — sem mensagem de erro para o usuário. Limite de 120 mensagens por hora por conta.

**Crise tem resposta fixa.** Frases de risco de vida ou de abstinência grave são detectadas por regex antes de qualquer provedor ser chamado, e a resposta com CVV 188 / SAMU 192 sai sempre — não depende de o modelo lembrar do número. A detecção usa regex e não busca de substring de propósito: "não quero *mais* viver" não bate com a string "não quero viver", e um falso negativo aqui é inaceitável.

---

## Conteúdo de saúde: fonte ou nada

Nenhum texto do app promete recuperação, dá prazo universal ou afirma algo sobre o cérebro sem fonte. A regra, travada por testes (`src/lib/beneficios.test.ts`):

- O `corpo` de cada marco fala de **constância e gatilhos**. Afirmação de saúde só entra com fonte em `beneficios.ts` (órgão, URL, data da página, data da conferência e se a página foi lida ou só o resumo de busca) e o texto diz “segundo o CDC/NHS”.
- Hoje **só o cigarro** tem benefícios (CDC, *Benefits of Quitting*, página de 15/05/2024; NHS, *Benefits of quitting smoking*). Os demais hábitos têm mensagem factual sobre o registro.
- **Tratamento** nunca ganha benefício: o bloco se chama “O que esta etapa mostra” e diz que o contador mede só o tempo. **Sono** fala em observar o padrão, nunca em dormir mais ou melhor. **Viagem** fica com preparação e expectativa.
- Para revisar: abra a página da fonte, compare o prazo, atualize `verificadoEm`. Se a fonte mudar o que diz, o teste que compara prazos corrigidos (`as afirmações do corpo não contradizem as da fonte`) é o lugar de atualizar.

## Temas, saúde e privacidade

O catálogo (`src/lib/conhecimento`) guarda **só** informação educativa com fonte. As outras três naturezas de informação nascem do uso e nunca moram nele: o que a pessoa **registra** (banco), o que o app **calcula** a partir disso (regras puras em `src/lib/rastreio`) e o que ela **percebe** (“como estou”). Sugestões práticas são marcadas como sugestões, não como afirmação de saúde.

**Regras travadas por teste** (`npm test`): toda afirmação de benefício cita fonte que existe no registro; um tema só é "fontes-conferidas" se todas as suas fontes foram lidas por inteiro; o validador recusa promessa de resultado, instrução de dose, diagnóstico e telefone de emergência de outro país; nenhum tema se declara "revisado por profissional" (nenhuma revisão real aconteceu).

**Os números e títulos fortes dependem de registro.** “10 dias sem roer” e “10 dias consecutivos com tomada registrada” só aparecem com 10 dias consecutivos confirmados; sem isso o app mostra a versão fraca (“10 dias desde o início informado”) e diz quantos dias estão sem informação. No medicamento há quatro contadores separados (início do tratamento, dose informada, sequência confirmada, dias com registro); trocar de dose só acrescenta uma linha ao histórico.

**Privacidade**
- Dado pessoal (nome do medicamento, dose, horário) fica **só no banco, na conta da pessoa**; nenhum seed, fixture ou código compartilhado o contém (os testes usam valores fictícios).
- O assistente **não lê** registros de saúde por padrão. Ligar “Assistente e saúde” no Perfil é uma escolha da pessoa (tabela própria, `PreferenciaSaude`); mesmo ligado, só entram os registros necessários à pergunta. Se há provedor de IA externo, o Perfil avisa que trechos relevantes são enviados a ele.
- O lembrete de medicamento é opt-in, com horário informado pela pessoa. O texto padrão é neutro (“Seu lembrete de hoje”); nome e dose só aparecem na notificação se ela ligar o texto detalhado, e o registro de envios guarda sempre o texto neutro.
- Há “Apagar meus dados de saúde” no Perfil, apagar por registro e por acompanhamento, e o backup (`/api/exportar`) inclui tudo o que foi registrado.

**O que o conteúdo não é.** Educativo, não substitui avaliação, diagnóstico ou orientação de profissional; o app não recomenda iniciar, aumentar, reduzir nem parar medicamento e não interpreta os registros como resposta ao tratamento.

**Fontes e limites hoje**
- Lidas por inteiro: AAD e TLC Foundation (unhas), bula brasileira do oxalato de escitalopram (genérico, publicada no portal da Novartis Brasil), MedlinePlus e NHS (escitalopram, sono, respiração, atividade física, cafeína, higiene bucal, terapia, 5 passos), CDC e NHS (parar de fumar), CVV.
- **Não lidas:** HSE (HTTP 403), BVS/Ministério da Saúde sobre onicofagia (HTTP 503), Bulário da Anvisa. O guia brasileiro de atividade física só foi visto em resumo e não é usado como fonte.
- A maior parte das fontes é do Reino Unido ou dos EUA. Nos temas em que isso importa (terapia, atividade física) o próprio tema avisa, e o status de terapia é “parcial”.
- **Nenhum tema foi revisado por profissional de saúde.** Antes de tratar como definitivo, peça revisão (médico/psiquiatra para escitalopram; dermatologista e psicólogo para unhas) e confira a bula vigente no Bulário.

**Adicionar um tema:** crie `src/lib/conhecimento/temas/<id>.ts`, registre as fontes em `fontes.ts` (só depois de ler a página) e inclua o tema em `catalogo.ts`. `npm test` percorre o catálogo inteiro: tema novo já entra validado. Onde a fonte **não** diz algo, escreva isso em `limites` e `notaEditorial` em vez de completar.

## Testes

```bash
npm test                      # regras puras: datas, sono, progressão, catálogo, assistente, rastreio (sem banco)
ZXP_TESTE_DB=1 npm test      # inclui os de integração, contra o banco do .env.local
```

Os de integração (persistência, autorização entre contas, deduplicação, concorrência) **usam o banco do `.env.local`** — não há banco de teste separado. Eles só criam usuários `teste-…@zxpmark.local`, cada processo apaga apenas os que criou, e resíduos com mais de 1 h de execuções interrompidas. Sem a variável `ZXP_TESTE_DB=1` eles são pulados. Se você apontar o `.env.local` para produção, prefira rodá-los num momento calmo.

## Atualizando um banco já existente

**Branch de temas e acompanhamento de saúde (`feat/conhecimento-unhas-escitalopram`).** Adiciona 8 tabelas (`HabitoAcompanhado`, `EventoHabito`, `Tratamento`, `DoseTratamento`, `TomadaDia`, `EfeitoRegistrado`, `RegistroHumor`, `PreferenciaSaude`) e nenhuma coluna em tabela existente. **Rode `npm run db:push` antes de fazer o merge/deploy**: sem as tabelas o app não cai (as telas avisam que o acompanhamento está indisponível, o lembrete e o backup pulam o trecho de saúde, e o assistente trata como “sem permissão”), mas nada de saúde é salvo até o banco ser atualizado.

**Versão anterior.**

Esta versão **só adiciona**: 1 coluna nullable (`Contagem.arquivadoEm`) e 4 tabelas (`Acompanhamento`, `ConquistaVista`, `Percepcao`, `Sono`). Nenhum dado existente é alterado. Antes de publicar o código desta versão, rode uma vez:

```bash
npm run db:push
```

(sem `--accept-data-loss`: se algum dia o Prisma pedir isso, pare e leia o que ele vai apagar).

---

## Criar o primeiro acesso

Quando o banco está vazio não existe admin para usar a aba Acesso. Crie o primeiro pela linha de comando:

```bash
npm run acesso -- --email voce@dominio.com --nome "Seu Nome" --admin
```

Sem `--senha`, ele gera uma temporária forte e grava em `ACESSO-TEMPORARIO.txt` (fora do git). Entre no app, troque a senha na aba Acesso e apague o arquivo. Daí em diante todo acesso novo sai pela própria aba.

---

## Aviso

O ZXP Mark não substitui médico, psicólogo ou psiquiatra. Abstinência grave de álcool pode ser perigosa e exige avaliação médica. Se precisar de ajuda agora: **CVV — 188**, gratuito, 24 horas.

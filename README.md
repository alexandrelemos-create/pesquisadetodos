# Micropesquisa

MVP full-stack de uma plataforma de micropesquisas: um **widget** leve e não intrusivo
para o visitante final, e um **painel de gestão** completo para criar campanhas,
configurar lógica condicional e acompanhar resultados.

Stack: **Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (Radix)** no
front-end, com **API Routes** e **SQLite** (via `better-sqlite3`) como backend/persistência.

## Como rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. Um banco SQLite é criado automaticamente em `data/micropesquisa.db`
na primeira execução (a pasta `data/` não é versionada — veja `.gitignore`).

### Popular com dados de demonstração

Na tela inicial do painel (`/admin`), clique em **"Carregar demonstração"** — isso cria uma
campanha de NPS completa (com lógica condicional, gatilhos e ~30 respostas simuladas) para
explorar o dashboard sem precisar responder a pesquisa manualmente. O mesmo pode ser feito
via API:

```bash
curl -X POST http://localhost:3000/api/dev/seed
```

### Build de produção

```bash
npm run build
npm start
```

## Como instalar o widget no seu site (produção)

Este projeto é uma **aplicação separada** — não é um plugin que você copia para dentro do
código do seu site. Ele precisa ser hospedado em algum lugar com URL pública própria (ex.:
Vercel, Railway, uma VM, etc.). Depois de hospedado, você instala o widget nas páginas do
seu site com **uma única tag `<script>`**, sem tocar no restante do código do seu site.

**Passo 1 — hospede este projeto.** Faça o deploy (por exemplo `vercel deploy` na raiz do
projeto, ou qualquer outro serviço que rode Next.js) e anote o domínio público que você
recebeu, ex. `https://pesquisas.suaempresa.com`.

**Passo 2 — crie a campanha no painel admin** (`/admin` do domínio acima) e copie o ID da
campanha — ele aparece na URL do workspace da campanha (`/admin/campaigns/ID_DA_CAMPANHA/...`).

**Passo 3 — cole o snippet nas páginas do seu site onde a pesquisa deve poder aparecer**,
antes do `</body>`:

```html
<script
  src="https://pesquisas.suaempresa.com/widget.js"
  data-campaign-id="ID_DA_CAMPANHA"
  async
></script>
```

Isso funciona em qualquer site — WordPress, HTML estático, React, o que for — porque é só uma
tag `<script>` comum. Para controlar **em quais páginas** a pesquisa aparece, cole essa tag só
nos templates/páginas desejados (ex.: só na página de checkout, só no blog, etc.). Se quiser a
pesquisa em todo o site com controle fino de exibição, cole a tag em todo lugar (ex. no layout
base) e use os **gatilhos de exibição** e a **regra de frequência** já configuráveis no painel
(`/admin/campaigns/[id]/triggers`) para decidir quando ela de fato aparece — tempo na página,
% de rolagem, clique em elemento, intenção de saída, e "máximo N vezes por período".

**Como funciona por baixo dos panos:** o `widget.js` cria um `<iframe>` transparente que
inicialmente não ocupa espaço nenhum e não recebe cliques (`pointer-events: none`); o widget,
dentro do iframe, avisa via `postMessage` o tamanho real do card sempre que ele muda de estado
(escondido → recolhido → expandido), e o script ajusta o `<iframe>` para esse tamanho exato e
liga os cliques só naquela área. Assim o widget nunca bloqueia cliques no resto da sua página,
mesmo estando em um domínio diferente do seu site.

Parâmetros opcionais da tag `<script>`:

| Atributo | Para que serve | Padrão |
| --- | --- | --- |
| `data-campaign-id` | ID da campanha (obrigatório) | — |
| `data-api-base` | Domínio do micropesquisa, se diferente do `src` do script | origem do `src` |
| `data-offset-bottom` | Distância do card até a borda inferior da tela | `20px` |
| `data-offset-right` | Distância do card até a borda direita da tela | `20px` |

## Onde ver cada parte da especificação

| Especificação | Onde está |
| --- | --- |
| Widget (gatilho recuado, popover, submissão assíncrona) | `/demo` (simulação em uma página fake) e `src/components/widget/*` |
| Painel admin — tipos de pergunta | `/admin/campaigns/[id]/questions` — `src/components/admin/question-config-editor.tsx` |
| Lógica condicional (skip logic) | Editor por pergunta em `/questions` — motor puro em `src/lib/logic.ts` |
| Gatilhos de exibição e regra de frequência | `/admin/campaigns/[id]/triggers` |
| Editor no-code (drag-and-drop + preview desktop/mobile) | `/admin/campaigns/[id]/questions` — `src/components/admin/sortable-question-list.tsx` e `live-preview.tsx` |
| Métricas (taxa de resposta, NPS, distribuições) | `/admin/campaigns/[id]/analytics` |
| Respostas individuais + exportação CSV/JSON | `/admin/campaigns/[id]/responses` e `GET /api/campaigns/[id]/export` |
| Webhooks (CRM/Slack) | `/admin/campaigns/[id]/webhooks` |
| Embed do widget em qualquer site (script + iframe) | `public/widget.js` (snippet a instalar) + `src/app/embed/[id]` (página renderizada dentro do iframe) — ver seção "Como instalar o widget no seu site" acima |

## Estrutura do projeto

```
src/
  app/
    admin/                    painel de gestão (dashboard + workspace por campanha)
    api/
      campaigns/              CRUD de campanhas, perguntas, respostas, export, webhooks
      public/                 endpoints consumidos pelo widget (config, sessão, respostas)
      dev/seed/                popula dados de demonstração
    demo/                     página fake para simular o widget em contexto
    embed/[id]/                página mínima para embutir o widget via <iframe>
  components/
    ui/                       primitivos shadcn/ui
    widget/                   widget do visitante (card flutuante, painel de perguntas)
    admin/                    editores do painel (config de pergunta, skip logic, dnd, preview)
  lib/
    db.ts / repo.ts           conexão SQLite + camada de acesso a dados
    logic.ts                  motor de lógica condicional (puro, usado no client e no server)
    webhook.ts / export.ts    disparo de webhooks e exportação CSV/JSON
    seed.ts                    gerador de dados de demonstração
```

## Decisões e limitações do MVP

- Persistência em **SQLite local** (arquivo único) para simplicidade — trocar por Postgres/MySQL
  em produção exigiria apenas reescrever `src/lib/db.ts` e `src/lib/repo.ts`.
- O **widget** roda como componente React (usado em `/demo` e `/embed/[id]`); para embutir em um
  site 100% externo, hospede este projeto e instale o snippet `public/widget.js` nas páginas
  desejadas — ver "Como instalar o widget no seu site (produção)" acima. O snippet cria um
  `<iframe>` transparente e dinamicamente dimensionado (via `postMessage`), então ele nunca
  bloqueia cliques fora da área visível do widget.
- Autenticação do painel admin **não foi implementada** (fora do escopo definido) — em produção,
  proteger as rotas `/admin/*` e as APIs `/api/campaigns/*` com um provedor de auth.
- O motor de lógica condicional roda **no cliente** (para navegação instantânea entre perguntas) e
  **no servidor** (para consistência da sessão salva e disparo de webhooks) — ambos usam a mesma
  função pura em `src/lib/logic.ts`, então o comportamento é sempre idêntico.

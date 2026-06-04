# Link Analytics — Escopo

## Visão Geral

Encurtador de URLs com painel de analytics em tempo real. O foco do projeto não é a ideia em si (encurtador é commodity), mas a **engenharia por trás**: redirect com latência baixa via cache, aggregations no MongoDB e dashboard com dados ao vivo.

**Modelo do projeto:** open source no GitHub, **single-user self-hosted**. Quem quiser usar clona o repo, define uma senha de admin no `.env`, roda na própria infra. Não há cadastro de usuários — todas as URLs do sistema pertencem ao admin. Login serve apenas pra proteger o painel.

**Diferencial técnico declarado:** **redirect com latência abaixo de 50ms** usando Redis como cache de slug → URL original. Esse é o ponto a ser defendido em entrevista.

---

## Stack

- **Runtime:** Node.js + TypeScript
- **Servidor:** Express (sem firula)
- **Cache:** Redis (lookup de slug + contagem de cliques agregada)
- **Banco:** PostgreSQL com **Prisma ORM** (schema declarativo, migrations versionadas, type safety end-to-end)
- **Frontend:** React + Recharts (dashboard)
- **Real-time:** Server-Sent Events (SSE) — mesma stack do CVEngine, sem WebSocket fullduplex desnecessário
- **Auth admin:** JWT assinado com segredo do `.env`, senha única em `.env`
- **Deploy:** Docker Compose

---

## Funcionalidades — MVP

### Público (sem auth)
- **`GET /:slug`** — redirect 302 para a URL original
  - Cache hit no Redis: resposta em <50ms
  - Cache miss: busca no Mongo, popula Redis, redireciona
  - Click logging assíncrono (fire-and-forget) — não bloqueia o redirect

### Admin (auth via JWT)
- **Login** com senha única do `.env` → recebe JWT
- **Criar link curto** com slug customizável ou auto-gerado
- **Listar / editar / desativar links**
- **Definir expiração** (data) e **limite de cliques** (opcional)
- **Dashboard analítico:**
  - Total de cliques por link
  - Cliques por país, dispositivo (mobile/desktop/tablet), browser, OS
  - Cliques por hora/dia/semana (gráfico de linha)
  - Origem do tráfego (referrer)
  - Top links (mais acessados)
- **Stream em tempo real** via SSE: cada novo click empurra evento pro dashboard aberto

---

## Funcionalidades — Pós-MVP (Backlog)

- QR Code por link (gerado on-demand)
- Links com senha (página intermediária pedindo senha)
- Domínio customizado (CNAME apontando pra sua VPS)
- Importação em lote (CSV)
- Webhook que dispara quando algum link atinge X cliques
- Export de analytics em CSV/JSON

---

## Endpoints

### Públicos
| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/:slug` | Redirect 302 (ou 410 se expirado/desativado) |

### Admin (todos sob `/admin`, exigem JWT no header)
| Método | Rota | O que faz |
|---|---|---|
| `POST` | `/admin/login` | Recebe senha, devolve JWT |
| `POST` | `/admin/links` | Cria link curto |
| `GET` | `/admin/links` | Lista links com paginação |
| `GET` | `/admin/links/:id` | Detalhe + analytics agregado do link |
| `PATCH` | `/admin/links/:id` | Edita (URL, slug, expiração, status) |
| `DELETE` | `/admin/links/:id` | Desativa (soft delete) |
| `GET` | `/admin/analytics/overview` | Dashboard global agregado |
| `GET` | `/admin/analytics/stream` | SSE com cliques em tempo real |

---

## Modelo de Dados

### `.env` — config do admin
```env
# Auth
ADMIN_PASSWORD=                # senha única do painel
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Banco
DATABASE_URL=postgresql://user:pass@host:5432/linkanalytics
REDIS_URL=

# App
BASE_URL=https://seudominio.com   # usado pra montar a URL curta no painel
PORT=3000
```

### Schema Prisma

```prisma
model Link {
  id           String    @id @default(cuid())
  slug         String    @unique
  originalUrl  String
  customSlug   Boolean   @default(false)  // true se o admin escolheu, false se gerado
  expiresAt    DateTime?
  maxClicks    Int?
  clickCount   Int       @default(0)      // contador denormalizado (atualizado em batch via Redis)
  active       Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  clicks       Click[]

  @@index([active, expiresAt])             // filtro de listagem no admin
}

model Click {
  id          String    @id @default(cuid())
  linkId      String
  link        Link      @relation(fields: [linkId], references: [id], onDelete: Cascade)
  timestamp   DateTime  @default(now())
  ip          String
  country     String?
  city        String?
  deviceType  String    // "mobile" | "desktop" | "tablet" | "bot"
  browser     String
  os          String
  referrer    String?
  userAgent   String

  @@index([linkId, timestamp])             // analytics por link no tempo
  @@index([timestamp])                     // dashboard global
}
```

**Por que esses índices:**
- `Link.slug` é `@unique` → índice automático, usado em **todo** redirect (cache miss)
- `(linkId, timestamp)` composto → otimiza ranges de data por link (90% das queries do dashboard)
- `timestamp` simples → suporta queries "todos os cliques nas últimas 24h"
- `(active, expiresAt)` → listagem do admin filtrando links válidos

**Pós-MVP a considerar:**
- Particionamento da tabela `Click` por mês (se volume crescer muito)
- Extensão TimescaleDB pra time-series mais sério (overkill pro MVP)

---

## Integrações Externas

- **GeoIP:** [`geoip-lite`](https://www.npmjs.com/package/geoip-lite) (banco local, sem rate limit, sem API key) ou MaxMind GeoLite2
- **UA Parser:** [`ua-parser-js`](https://www.npmjs.com/package/ua-parser-js) pra extrair browser/OS/device do User-Agent
- **QR Code (pós-MVP):** [`qrcode`](https://www.npmjs.com/package/qrcode) — geração local, sem API externa

Nenhuma dependência de serviço externo pago. Tudo roda offline na VPS do usuário.

---

## Considerações Técnicas

### Estratégia de cache (o ponto central do projeto)

**Fluxo de redirect:**
```
1. GET /:slug chega
2. Tenta Redis: GET link:abc123
   ├─ HIT → redirect direto (~5-10ms total)
   └─ MISS → busca Postgres via Prisma, popula Redis com TTL, redireciona (~30-50ms)
3. Em paralelo (não bloqueia): enfileira evento de click
```

**TTL do cache:**
- Links ativos: TTL de 24h (renovado em cada hit)
- Quando link é editado/desativado no admin: `DEL link:slug` invalida cache imediatamente

**Counter de cliques:**
- Incrementa no Redis em cada hit (`INCR clickcount:abc123`)
- Worker periódico (a cada N segundos) lê os contadores do Redis e faz um `prisma.link.update({ data: { clickCount: { increment: N } } })` por link, então zera o contador no Redis
- Evita pressão de write no Postgres no hot path

### Click logging assíncrono

O redirect **não pode esperar o insert no Postgres**. Estratégias:
1. **Fire-and-forget** (`setImmediate` + `prisma.click.create`) — simples, mas perde clicks se o processo cair antes do insert
2. **Buffer em memória + `prisma.click.createMany` em batch** (a cada N clicks ou X segundos) — mais eficiente (insert único), mas perde tudo no buffer se cair
3. **Push pra Redis list, worker consome** — mais robusto, persistido entre quedas

Pro MVP: **opção 1 ou 2**. Opção 3 vale só se for ficar muito sério.

### Bots e crawlers

Bots inflam analytics e podem gerar tráfego falso. Mitigação:
- `ua-parser-js` identifica grande parte
- Lista de bot UAs comuns (Googlebot, Bingbot, etc.)
- Bots viram `deviceType: "bot"` e podem ser filtrados no dashboard

### Validação de URL

URL submetida pelo admin precisa ser validada:
- Formato (URL parseable)
- Protocolo permitido (http/https)
- Bloqueio de loopback / IPs privados (evita SSRF se algum dia houver preview)

### Idempotência de slug

Slug é unique. Se admin tenta criar slug que já existe → 409 Conflict.

### Real-time via SSE

Por que SSE e não WebSocket:
- Dashboard só precisa receber dados (uplink-only)
- SSE é HTTP, atravessa proxy/CDN sem config especial
- Já tem domínio dessa stack no CVEngine
- Reconexão automática nativa do browser

---

## Estrutura de Pastas

Monorepo simples (`api` + `web`), sem ferramentas tipo Turborepo/Nx — overkill pra esse tamanho. `docker-compose.yml` no root orquestra tudo, lendo o `.env` único.

```
link-analytics/
├── api/                        # backend Express
├── web/                        # frontend React (Vite)
├── docker-compose.yml          # postgres + redis + api + web
├── .env.example                # único env, compartilhado pela compose
├── README.md                   # setup self-hosted passo a passo
└── SCOPE.md
```

### `api/` — Backend

Organização **feature-based** (cada domínio numa pasta), não layer-based. Pra esse tamanho, agrupar por feature dá menos pula-pula entre pastas durante o desenvolvimento.

```
api/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/
│   │   ├── env.ts              # valida process.env com zod, exporta typed
│   │   ├── prisma.ts           # PrismaClient singleton
│   │   └── redis.ts            # Redis client singleton
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.middleware.ts    # JWT verifier reutilizável
│   │   ├── links/
│   │   │   ├── links.controller.ts
│   │   │   ├── links.service.ts
│   │   │   ├── links.routes.ts
│   │   │   └── links.schemas.ts      # schemas zod de input/output (types inferidos via z.infer)
│   │   ├── redirect/                 # endpoint público /:slug
│   │   │   ├── redirect.controller.ts
│   │   │   ├── redirect.service.ts   # lookup com cache Redis
│   │   │   └── redirect.routes.ts
│   │   ├── clicks/                   # sem controller — só logging interno
│   │   │   ├── clicks.service.ts     # buffer + enqueue
│   │   │   └── clicks.worker.ts      # flush periódico Redis → Postgres
│   │   └── analytics/
│   │       ├── analytics.controller.ts
│   │       ├── analytics.service.ts  # queries agregadas
│   │       ├── analytics.routes.ts
│   │       └── analytics.sse.ts      # stream em tempo real
│   ├── lib/                          # utilidades sem domínio
│   │   ├── geoip.ts
│   │   ├── ua-parser.ts
│   │   └── slug-generator.ts
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   └── request-logger.ts
│   ├── app.ts                        # configura Express (middlewares, rotas)
│   └── server.ts                     # bootstrap (start workers + listen)
├── tests/
│   ├── integration/                  # rotas end-to-end com banco real
│   └── unit/                         # serviços puros
├── .dockerignore
├── Dockerfile
├── package.json
└── tsconfig.json
```

**Regras de ouro:**
- `controller` só lida com HTTP (parse, status code, response)
- `service` tem a regra de negócio, recebe e devolve tipos do domínio
- `routes` só amarra rota → controller (+ middleware)
- Nenhum arquivo de feature importa de outra feature diretamente — se precisar, sobe pra `lib/` ou cria um service compartilhado

### `web/` — Frontend

```
web/
├── src/
│   ├── pages/
│   │   ├── login.tsx
│   │   ├── dashboard.tsx             # overview global
│   │   └── links/
│   │       ├── index.tsx             # lista
│   │       └── [id].tsx              # detalhe + analytics do link
│   ├── components/
│   │   ├── charts/
│   │   │   ├── ClicksOverTime.tsx
│   │   │   ├── CountryBreakdown.tsx
│   │   │   ├── DeviceBreakdown.tsx
│   │   │   └── TopLinks.tsx
│   │   ├── ui/                       # Button, Input, Card, etc.
│   │   └── layout/
│   ├── hooks/
│   │   ├── useLinks.ts
│   │   ├── useAnalytics.ts
│   │   └── useClickStream.ts         # consome SSE
│   ├── lib/
│   │   ├── api.ts                    # fetch wrapper + interceptor JWT
│   │   └── auth.ts                   # storage do token
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Roadmap

| Fase | Entrega |
|---|---|
| 1 | Setup (Express + Postgres + Prisma + Redis + Docker Compose) + `.env.example` + primeira migration |
| 2 | Endpoint público `/:slug` com cache Redis + click logging assíncrono |
| 3 | Auth admin (JWT) + CRUD de links |
| 4 | Endpoints de analytics agregados (overview + por link) |
| 5 | Dashboard React + Recharts consumindo as analytics |
| 6 | SSE de cliques em tempo real |
| 7 | Polimento, README com setup self-hosted, deploy de demo |

---

## O que demonstra no portfólio

- **Performance engineering real** (cache Redis no hot path, redirect <50ms verificável)
- **Aggregations SQL não-triviais** (GROUP BY país/device/hora, window functions pra top N, ranges de tempo com `DATE_TRUNC`)
- **Real-time data viz** com SSE — dashboard que atualiza sozinho enquanto cliques chegam
- **Separação clara entre hot path e cold path** (redirect rápido + logging assíncrono)
- **Decisões técnicas defensáveis** (SSE vs WebSocket, denormalização de counter, TTL de cache)
- **Projeto open source self-hosted** — coerente com o NFS-e Agent

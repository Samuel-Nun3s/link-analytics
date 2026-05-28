# Link Analytics

Encurtador de URLs **self-hosted** com painel de analytics em tempo real. O foco do projeto não é a ideia (encurtador é commodity) — é a **engenharia por trás**: redirect com latência baixa via cache, agregações no Postgres e dashboard com dados ao vivo.

> **Diferencial técnico:** redirect com latência abaixo de **50ms** usando Redis como cache de `slug → URL original`.

---

## Modelo

- **Open source, single-user, self-hosted.** Você clona, define uma senha de admin no `.env` e roda na sua própria infra.
- Não há cadastro de usuários — todas as URLs do sistema pertencem ao admin. Login serve apenas pra proteger o painel.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js + TypeScript |
| Servidor | Express |
| Banco | PostgreSQL + Prisma ORM |
| Cache | Redis |
| Frontend | React + Vite + Recharts |
| Real-time | Server-Sent Events (SSE) |
| Auth | JWT (segredo no `.env`) |
| Deploy | Docker Compose |

---

## Como rodar localmente

### Pré-requisitos
- Docker e Docker Compose
- Node.js 20+

### Passo a passo

```bash
# 1. Clone o repo
git clone https://github.com/<seu-usuario>/link-analytics.git
cd link-analytics

# 2. Configure o .env
cp .env.example .env
# Edite .env e defina ADMIN_PASSWORD, JWT_SECRET e senhas do Postgres
# Para gerar um JWT_SECRET seguro:
#   openssl rand -base64 32

# 3. Sobe Postgres + Redis
docker compose up -d

# 4. Instala dependências da API e roda as migrations
cd api
npm install
npm run prisma:migrate -- --name init

# 5. (Em outro terminal) instala o frontend
cd ../web
npm install

# 6. Roda em modo dev
# Terminal 1:
cd api && npm run dev
# Terminal 2:
cd web && npm run dev
```

API sobe em `http://localhost:3000`, dashboard em `http://localhost:5173` (porta padrão do Vite).

---

## Estrutura

```
link-analytics/
├── api/                  # backend Express + Prisma
│   ├── prisma/           # schema + migrations
│   └── src/              # código da API
├── web/                  # frontend React + Vite
├── docker-compose.yml    # postgres + redis
├── .env                  # config (não comitar)
└── .env.example          # template do .env
```

---

## Endpoints principais

### Públicos
| Método | Rota | Função |
|---|---|---|
| `GET` | `/:slug` | Redirect 302 para a URL original |

### Admin (JWT no header)
| Método | Rota | Função |
|---|---|---|
| `POST` | `/admin/login` | Recebe senha, devolve JWT |
| `POST` | `/admin/links` | Cria link curto |
| `GET` | `/admin/links` | Lista links com paginação |
| `GET` | `/admin/links/:id` | Detalhe + analytics do link |
| `PATCH` | `/admin/links/:id` | Edita link |
| `DELETE` | `/admin/links/:id` | Desativa (soft delete) |
| `GET` | `/admin/analytics/overview` | Dashboard global agregado |
| `GET` | `/admin/analytics/stream` | SSE com cliques em tempo real |

---

## Performance

Benchmark do endpoint público `/:slug` com cache aquecido.

| Cenário | p50 | p75 | p99 | Throughput |
|---|---|---|---|---|
| Cache hit (100 conexões concorrentes) | **47.60ms** | 49.13ms | 241ms¹ | 2012 req/s |
| Cache miss (single user, 10 amostras) | ~3.5ms | — | — | — |

Bench: `wrk -t4 -c100 -d30s --latency` rodando em localhost contra API single-threaded em Docker Compose.

¹ A cauda p99 corresponde aos ticks de 5s do worker assíncrono que persiste cliques em lote (`prisma.click.createMany`). Trade-off conhecido — ver [docs/SCOPE.md](docs/SCOPE.md) para o roadmap pós-MVP de migração para Redis list + consumer.

### Pipeline assíncrono — integridade
- 60.417 requests no bench
- 60.755 cliques registrados no banco (inclui warmups + testes anteriores)
- **Zero perda** sob carga sustentada

---

## Roadmap

- [x] Fase 1 — Setup (Express + Postgres + Prisma + Redis + Docker Compose)
- [x] Fase 2 — Endpoint público `/:slug` com cache Redis + click logging assíncrono
- [ ] Fase 3 — Auth admin (JWT) + CRUD de links
- [ ] Fase 4 — Endpoints de analytics agregados
- [ ] Fase 5 — Dashboard React + Recharts
- [ ] Fase 6 — SSE de cliques em tempo real
- [ ] Fase 7 — Polimento + deploy de demo

---

## Licença

MIT

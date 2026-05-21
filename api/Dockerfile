# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build ----------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Instala TODAS as deps (inclui dev — precisamos do tsc e prisma CLI)
COPY package.json package-lock.json ./
RUN npm ci

# Schema + fonte
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

# Gera o Prisma Client e compila TS -> JS
RUN npx prisma generate
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Só deps de produção
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Artefatos da build
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Usa o usuário não-root que vem na imagem oficial do Node
USER node

EXPOSE 3000

# Aplica migrations pendentes e sobe a API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

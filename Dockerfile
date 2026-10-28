# Multi-stage Dockerfile — development e production

# ==========================
# Base stage
# ==========================
FROM node:20-slim AS base

WORKDIR /app

COPY package*.json ./

# ==========================
# Development stage
# ==========================
FROM base AS development

RUN npm ci && npm cache clean --force

COPY . .

EXPOSE 3010

CMD [ "npm", "run", "start:dev" ]

# ==========================
# Builder stage
# ==========================
FROM base AS builder

RUN npm ci && npm cache clean --force

COPY . .
RUN npm run build

# ==========================
# Production stage
# ==========================
FROM node:20-slim AS production

WORKDIR /home/node/app

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

USER node

COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --chown=node:node --from=builder /app/dist ./dist
# Conteúdo dos cursos: sincronizado com o banco a cada boot (ContentSyncService).
COPY --chown=node:node content ./content
# Variáveis de produção entram em runtime (env_file/environment), não na imagem.

ENV NODE_ENV=production
EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://localhost:3010/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]

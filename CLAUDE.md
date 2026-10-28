# CLAUDE.md — Educacional Backend

Orientações para trabalhar neste repositório.

## Projeto

API do **INDT Educacional** — app estilo Duolingo (curso → unidades → lições →
exercícios, XP, corações, gemas, ofensiva, liga semanal). O app iOS
(`educacional-ios`) é feito em paralelo contra o mesmo contrato.

- **Contrato (fonte única de verdade):** `docs/CONTRATO.md`. Paths, campos,
  status HTTP e mensagens pt-BR seguem o contrato à risca; mudou lá, muda aqui e no app.
- **Stack:** NestJS 11 · TypeORM 0.3 · PostgreSQL 16 · class-validator · Swagger
- **Node:** 20 · **Porta:** 3010 · **Swagger:** `/swagger`

## Comandos

```bash
npm install
npm run start:dev        # hot reload (NODE_ENV=development)
npm run build            # dist/
npm run lint             # eslint --fix
docker compose up -d db  # só o Postgres local (porta host 5450)
docker compose up -d     # API + Postgres
```

Migrations (também rodam sozinhas no start, `migrationsRun: true`; nunca `synchronize`):

```bash
npm run typeorm:migrate -- src/migrations/Nome  # gera a partir das entidades
npm run typeorm:create -- src/migrations/Nome   # migration vazia
npm run typeorm:run                             # aplica pendentes
```

## Arquitetura

- `src/main.ts` — CORS, `ValidationPipe` global, Swagger.
- `src/app.module.ts` — TypeORM (`AppDataSource`), Throttler, `JwtAuthGuard` global
  (use `@Public()` para rotas abertas), `TransformInterceptor`.
- `src/auth/` — register/login (bcryptjs), `GET/PATCH /auth/me`. Contas próprias, sem LDAP.
- `src/users/` — entidade `User`, `UsersService.toResponse()` monta o `User` do
  contrato (corações regenerados na leitura, `xpToday`, ofensiva quebrada = 0).
- `src/content/` — entidades `Course/Unit/Lesson/Exercise` e `ContentSyncService`.
- `src/courses/` — `/courses`, `/courses/:slug/path`, `/lessons/:id`,
  `/lessons/:id/complete` (regras de XP/gemas/estrelas/ofensiva em `progress.service.ts`).
- `src/hearts/` — `/hearts/lose`, `/hearts/refill`.
- `src/stats/` — `/leaderboard`, `/me/stats`.
- `src/progress/entities/` — `lesson_completions` (melhor estrela por usuário+lição)
  e `xp_events` (base de xpToday, liga e estatísticas).
- `src/shared/utils/date.util.ts` — "hoje" e semana sempre em `America/Manaus`.

## Conteúdo

- `content/<curso>/course.json` + `content/<curso>/NN-<unidade>.json` (formato no contrato).
- Sincronizado a cada boot (`ContentSyncService`), idempotente, upsert por slug:
  curso (`slug`), unidade (curso + `slug`), lição (`slug`, único no banco),
  exercício (lição + posição; campos do tipo em `jsonb`).
- **Nunca apaga progresso:** unidade/lição que sai do conteúdo (ou arquivo ausente/inválido)
  vira `active = false` e some da API; volta a aparecer quando o arquivo voltar.
  Só exercícios excedentes de uma lição são removidos.
- Para mudar conteúdo: edite o JSON e reinicie a API. Mudar o `slug` de uma lição
  cria uma lição nova (o progresso fica na antiga, inativa).
- Pasta: `CONTENT_DIR` ou `<cwd>/content`. A imagem Docker copia `content/`.

## Convenções de commit

- Mensagens em **inglês**, **Conventional Commits** (`feat:`, `fix:`, `chore:`...),
  assunto em minúsculas e curto; commits focados.
- **Não** adicionar trailer `Co-Authored-By: Claude`.

## Restrições

- Sem testes unitários/e2e e sem commitlint/husky (como no allocation-backend).
- Ainda sem CI/deploy configurado.

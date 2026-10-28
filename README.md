# INDT Educacional — Backend

API do **INDT Educacional**, app de aprendizado estilo Duolingo com o Spark.
O primeiro curso é **Fullstack** (HTML → CSS → JS → TS → React → NestJS → Banco → Fullstack).

- **Stack:** NestJS 11 · TypeORM 0.3 · PostgreSQL 16 · class-validator · Swagger
- **Node:** 20
- **Contrato da API e regras de negócio:** [`docs/CONTRATO.md`](docs/CONTRATO.md)
- **Swagger:** `http://localhost:3010/swagger`

---

## 🚀 Início rápido

```bash
# 1. dependências
npm install

# 2. Postgres local (docker, porta host 5450)
docker compose up -d db

# 3. API com hot reload (roda as migrations e sincroniza o conteúdo no boot)
npm run start:dev
```

- Health: `GET http://localhost:3010/health` → `{ "status": "ok" }`
- Swagger UI: `http://localhost:3010/swagger`

### Tudo no Docker

```bash
docker compose up -d --build   # API (target development) + Postgres
docker compose logs -f api
docker compose down            # para (com -v apaga o volume do banco)
```

Imagem de produção: `docker build --target production .` (inclui `dist/` e `content/`;
variáveis de ambiente entram em runtime — ver `.env.example`).

---

## 🗄️ Banco de dados

- Container `educacional-db` (Postgres 16), porta host **5450** → 5432.
- Banco `educacional`, usuário/senha `postgres` / `pass123` (só dev).
- Volume `educacional_db_data`.

```bash
docker compose exec db psql -U postgres -d educacional
```

### Migrations

Rodam automaticamente no start. Manualmente:

```bash
npm run typeorm:run
npm run typeorm:migrate -- src/migrations/Nome   # gerar a partir das entidades
```

Tabelas: `users`, `courses`, `units`, `lessons`, `exercises`, `lesson_completions`, `xp_events`.

---

## 📚 Conteúdo

Os cursos ficam em `content/<curso>/` (`course.json` + um JSON por unidade). No boot
a API faz upsert de cursos/unidades/lições/exercícios por slug — é idempotente e
nunca apaga progresso de usuários (itens removidos ficam inativos). Unidade listada
no `course.json` sem arquivo gera só um aviso no log.

Depois de editar o conteúdo, basta reiniciar a API.

---

## 🔐 Autenticação

Contas próprias (e-mail + senha com bcrypt). `POST /auth/register` e `POST /auth/login`
devolvem `{ user, token }`; o resto exige `Authorization: Bearer <token>`.

```bash
curl -X POST localhost:3010/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Ana","email":"ana@indt.org.br","password":"segredo1"}'
```

---

## ⚙️ Ambiente

| Arquivo | Uso |
|---|---|
| `.env.development` | local (segredos só de dev) |
| `.env.example` | modelo para outros ambientes |

Variáveis principais: `PORT` (3010), `DB_*`, `JWT_SECRET`, `JWT_EXPIRES_IN` (30d),
`CONTENT_DIR` (opcional).

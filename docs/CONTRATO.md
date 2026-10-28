# Contrato — INDT Educacional (app estilo Duolingo com o Spark)

Fonte única de verdade entre `educacional-backend` (NestJS), `educacional-ios` (SwiftUI)
e o conteúdo em `educacional-backend/content/`. Qualquer mudança aqui precisa ser
refletida nos dois lados.

## Conceitos

- **Curso** → **Unidades** → **Lições** → **Exercícios**. Primeiro curso: `fullstack`.
- **Trilha**: lições liberadas em sequência no curso inteiro. A 1ª lição da 1ª unidade
  começa `available`; ao concluir uma lição a próxima vira `available`.
- **XP**: lição concluída = `lesson.xp` (padrão 10) + 5 se perfeita (sem erros).
  Refazer lição já concluída (prática) = 5 XP.
- **Corações**: máximo 5. Errar um exercício = −1 coração (`POST /hearts/lose`).
  Recarrega 1 a cada 30 min (calculado no servidor ao ler o usuário). Com 0 corações
  não se começa lição nova (o app bloqueia); refazer lição concluída é permitido e não gasta coração.
  Recarga completa custa 350 gemas (`POST /hearts/refill`).
- **Gemas**: +5 por lição concluída, +10 se perfeita.
- **Ofensiva (streak)**: dias seguidos com ≥1 lição concluída, fuso `America/Manaus`.
  Se o último dia ativo foi ontem → +1; hoje → mantém; antes disso → reinicia em 1.
- **Meta diária**: `dailyGoal` em XP (padrão 30). `xpToday` vem no usuário.
- **Liga semanal**: ranking pela soma de XP desde segunda 00:00 (America/Manaus).
- **Estrelas**: por lição, melhor resultado: 3 = sem erros, 2 = até 2 erros, 1 = concluída.

## Conteúdo (`content/<curso>/course.json` + `content/<curso>/NN-<unidade>.json`)

`course.json`:
```json
{ "slug": "fullstack", "title": "Fullstack com o Spark",
  "description": "Do HTML ao deploy: front, back e banco.", "units": ["01-html", "02-css"] }
```

Cada unidade (`01-html.json`):
```json
{
  "slug": "html",
  "title": "HTML",
  "description": "A estrutura de toda página web",
  "color": "#E44D26",
  "icon": "chevron.left.forwardslash.chevron.right",
  "lessons": [
    {
      "slug": "html-1-tags",
      "title": "Tags e elementos",
      "xp": 10,
      "exercises": [ /* 6 a 8 exercícios, ver tipos abaixo */ ]
    }
  ]
}
```
`icon` é um SF Symbol. `color` é hex `#RRGGBB`.

### Tipos de exercício

Todos têm `type`, `prompt` (pt-BR) e `explanation` (pt-BR, 1–2 frases, aparece no
feedback depois de responder). `code` é opcional (trecho exibido em bloco monoespaçado).

| type | campos | resposta correta |
|---|---|---|
| `multiple_choice` | `options: string[]` (2–4), `answer: number` | índice em `options` |
| `true_false` | `answer: boolean` | |
| `fill_blank` | `code` com `___` em cada lacuna, `options: string[]` (banco de palavras, inclui distratores), `answer: string[]` | um item por lacuna, na ordem |
| `order` | `tokens: string[]` (peças do código/frase, o app embaralha), `answer: string[]` | sequência correta; pode ter distratores em `tokens` que não estão em `answer` |
| `match` | `pairs: [string, string][]` (3–5 pares) | o app embaralha a coluna da direita |
| `type_answer` | `answer: string[]` | respostas aceitas; app compara com trim + case-insensitive |

Exemplos:
```json
{ "type": "multiple_choice", "prompt": "Qual tag cria o maior título?",
  "options": ["<h6>", "<h1>", "<title>", "<header>"], "answer": 1,
  "explanation": "<h1> é o título de nível mais alto; <title> vai na aba do navegador." }

{ "type": "fill_blank", "prompt": "Complete o link",
  "code": "<___ href=\"https://indt.org.br\">INDT</___>",
  "options": ["a", "link", "href", "p"], "answer": ["a", "a"],
  "explanation": "Links usam a tag <a> com o atributo href." }

{ "type": "order", "prompt": "Monte a query que busca todos os alunos",
  "tokens": ["SELECT", "*", "FROM", "alunos", ";", "WHERE"],
  "answer": ["SELECT", "*", "FROM", "alunos", ";"],
  "explanation": "SELECT * FROM tabela traz todas as colunas e linhas." }

{ "type": "match", "prompt": "Ligue o verbo HTTP à ação",
  "pairs": [["GET", "Ler"], ["POST", "Criar"], ["DELETE", "Remover"]],
  "explanation": "Verbos HTTP descrevem a intenção da requisição." }

{ "type": "true_false", "prompt": "useState pode ser chamado dentro de um if.", "answer": false,
  "explanation": "Hooks precisam ser chamados sempre na mesma ordem, no topo do componente." }

{ "type": "type_answer", "prompt": "Qual comando instala as dependências de um projeto Node?",
  "answer": ["npm install", "npm i"], "explanation": "npm install lê o package.json." }
```

## API (JSON, `Authorization: Bearer <jwt>` exceto register/login/health)

Erros no formato NestJS: `{ "statusCode": 400, "message": "texto pt-BR" | ["..."], "error": "Bad Request" }`.
Datas ISO 8601. IDs são UUID.

### User (resposta em todos os endpoints que retornam `user`)
```json
{ "id": "uuid", "name": "Ana", "email": "ana@x.com",
  "xp": 120, "xpToday": 20, "dailyGoal": 30,
  "streak": 3, "longestStreak": 5, "lastActiveDate": "2026-10-27",
  "hearts": 4, "maxHearts": 5, "nextHeartAt": "2026-10-27T15:30:00.000Z" | null,
  "gems": 45, "createdAt": "..." }
```

### Auth
- `POST /auth/register {name, email, password}` (senha ≥ 6) → `{ user, token }`. 409 se e-mail existe.
- `POST /auth/login {email, password}` → `{ user, token }`. 401 "E-mail ou senha inválidos".
- `GET /auth/me` → `User`.
- `PATCH /auth/me {name?, dailyGoal?}` → `User` (`dailyGoal` ∈ 10, 20, 30, 50).

### Curso e trilha
- `GET /courses` → `[{ id, slug, title, description, unitCount, lessonCount, completedLessons }]`
- `GET /courses/:slug/path` →
```json
{ "course": { "id", "slug", "title", "description" },
  "units": [ { "id", "slug", "title", "description", "color", "icon", "order",
    "lessons": [ { "id", "slug", "title", "order", "xp", "exerciseCount",
                   "status": "locked" | "available" | "completed", "stars": 0 } ] } ] }
```
- `GET /lessons/:id` → `{ id, slug, title, xp, unit: {id, title, color}, exercises: [ { id, ...campos do tipo } ] }`
  As respostas vão junto (validação no app, como no Duolingo). 403 se `locked`.

### Progresso
- `POST /lessons/:id/complete {mistakes: number, durationSeconds: number}` →
```json
{ "xpEarned": 15, "gemsEarned": 10, "stars": 3, "perfect": true,
  "streakExtended": true, "nextLessonId": "uuid" | null, "user": User }
```
- `POST /hearts/lose` → `User` (nunca abaixo de 0; não perde se a lição for prática — o app simplesmente não chama).
- `POST /hearts/refill` → `User` (400 "Gemas insuficientes" se < 350; 400 se já cheio).

### Social / estatísticas
- `GET /leaderboard` → `{ weekStart: "2026-10-26", entries: [ { rank, userId, name, xp, isMe } ] }` (top 30 + o próprio usuário se fora do top).
- `GET /me/stats` → `{ lessonsCompleted, perfectLessons, xpLast7Days: [ { date: "2026-10-21", xp: 20 } ] }` (7 itens, do mais antigo ao mais novo, dias sem XP com 0).

### Health
- `GET /health` → `{ status: "ok" }`

## Ambiente local
- API: `http://localhost:3010` · Swagger em `/swagger`
- Postgres do docker-compose: porta host `5450`, banco `educacional`

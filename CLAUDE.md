# STOA — Plataforma de Conhecimento e Comunidade

## Sobre o Projeto

Plataforma educacional e de comunidade para **Julio Carvalho — Arquiteto de Sistemas Organizacionais**. O nome "STOA" remete à Stoá grega, local de ensino e troca de ideias. O sistema inclui cursos, feed de comunidade, painel administrativo, mensagens, agendamentos e perfil do usuário.

**Status atual:** Em produção em `https://membros.jcarv.in`. Acesso via convite vinculado a produto.

## Stack Técnica

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons
- **Backend:** Express + better-sqlite3 (`nexus.db`), Vite middleware em dev
- **Build:** Vite 6, tsx (runtime TS para server)
- **Auth:** JWT (access 15m + refresh 7d), bcryptjs
- **WebSocket:** `ws` (noServer mode, path `/ws`) — mensagens em tempo real
- **Upload:** Multer → `/uploads` (volume persistente em produção)
- **Deploy:** Docker multi-stage (Node 20-alpine), Docker Swarm via Traefik
- **Utilitários:** clsx + tailwind-merge (via `cn()`), date-fns, pino (logger)

## Comandos

```bash
npm run dev       # Inicia servidor Express + Vite dev (porta 4747)
npm run build     # Build de produção (Vite)
npm run preview   # Preview do build
npm run lint      # Type-check (tsc --noEmit)
npm run clean     # Remove dist/
```

## Estrutura de Arquivos

```
├── server/
│   ├── index.ts            # Entry point Express + Vite middleware
│   ├── ws.ts               # WebSocket (noServer, path /ws)
│   ├── db/
│   │   ├── connection.ts   # SQLite connection
│   │   ├── schema.ts       # DDL (todas as tabelas)
│   │   └── seed.ts         # Dados iniciais
│   ├── middleware/
│   │   ├── index.ts        # Stack: compression, helmet (prod), cors, json, rate limit
│   │   ├── auth.ts         # JWT auth + optionalAuth + refresh
│   │   ├── cors.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimit.ts
│   ├── routes/             # 21 arquivos de rotas
│   ├── services/           # Lógica de negócio
│   ├── repositories/       # Acesso a dados (SQLite)
│   └── validation/         # Schemas de validação
├── src/
│   ├── App.tsx             # Root component
│   ├── router.tsx          # React Router config
│   ├── main.tsx            # Entry point React
│   ├── index.css           # Tailwind config + tema + utilitários CSS
│   ├── components/
│   │   ├── admin/          # 16 componentes do painel admin
│   │   ├── ui/             # 20 componentes reutilizáveis (Button, Card, Input, Avatar...)
│   │   ├── blocks/         # Editor de blocos de aula
│   │   ├── layout/         # Layout components
│   │   └── workspace/      # Componentes de workspace
│   ├── pages/              # 11 páginas (Auth, Dashboard, Courses, Community, Messages, Profile, Scheduling, Admin, LessonPlayer, BlockEditor, DesignSystem)
│   ├── hooks/              # 8 hooks customizados
│   ├── services/
│   │   └── api.ts          # Cliente API centralizado
│   ├── stores/             # 7 context providers (Auth, Course, Community, Messages, Workspace, Navigation, Theme)
│   ├── types/              # Interfaces e tipos
│   └── lib/
│       └── utils.ts        # cn() helper
├── vite.config.mjs         # .mjs para evitar conflito tsx/esbuild
├── Dockerfile              # Multi-stage: build → prod (Node 20-alpine)
├── index.html              # SPA entry
└── nexus.db                # SQLite local (produção usa /data/nexus.db no container)
```

## Infraestrutura de Produção

- **Domínio:** `membros.jcarv.in`
- **Servidor:** 178.156.252.78 (Docker Swarm)
- **Serviço:** `nexo_stoa` (1 replica)
- **Proxy:** Traefik (entrypoint `web`, roteamento por Host header)
- **DB:** `/data/nexus.db` (volume persistente no container)
- **Uploads:** `/data/uploads/` (volume persistente)
- **Deploy:** Clone repo no servidor → `docker build --no-cache` → `docker service update --force`

## Sistema de Acesso

Fluxo: **Convite → Produto → Cursos/Comunidades**

1. Admin cria convite vinculado a um produto (ex: Formação DEV.IA)
2. Usuário acessa link `https://membros.jcarv.in/login?invite=CODIGO`
3. Ao registrar, o sistema: adiciona ao workspace, cria purchase do produto
4. Purchase ativa dá acesso aos cursos e comunidades vinculados ao produto

Convite ativo: `D64WU63gCwnz3Kq6` → Formação DEV.IA (product_id=1, workspace_id=1)

## API Endpoints

### Rotas Públicas (sem auth)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registro (aceita inviteCode) |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/invites/validate/:code` | Validar convite |

### Rotas Autenticadas
| Grupo | Prefixo | Rotas principais |
|-------|---------|-----------------|
| Auth | `/api/auth` | GET /me |
| Courses | `/api/courses` | GET /, GET /:id/content |
| Communities | `/api/communities` | CRUD + categories + posts (pin, edit, delete) |
| Posts/Feed | `/api` | GET /feed, POST /posts, likes, comments |
| Messages | `/api/messages` | Conversas, polling, unread count |
| Scheduling | `/api/scheduling` | Configs, slots, booking, cancelamento |
| Profile | `/api/profile` | GET/PUT profile, PUT password |
| Upload | `/api/upload` | POST upload, DELETE |
| Products | `/api/products` | CRUD + vinculação de cursos |
| Purchases | `/api/purchases` | GET /my, /check/:courseId, POST |
| Workspaces | `/api/workspaces` | CRUD + membros |
| Trails | `/api/trails` | CRUD + cursos |
| Invites | `/api/invites` | CRUD + redemptions + revoke |
| Follows | `/api/follows` | Follow/unfollow + counts |
| Admin | `/api/admin` | Stats, CRUD (courses, modules, lessons, users) |
| Announcements | `/api/announcements` | CRUD + pending + confirm |
| Lesson Blocks | `/api/lesson-blocks` | CRUD + reorder + batch |
| Lesson Templates | `/api/lesson-templates` | CRUD + apply |

**Atenção:** O `postsRouter` é montado em `/api` (catch-all) com `authMiddleware` global. Deve ser o ÚLTIMO router registrado para não bloquear rotas públicas.

## Design System

### Tipografia
- **Serif (display):** Fraunces — títulos, headings (classe `.serif-display`)
- **Sans (corpo):** DM Sans — texto geral, labels
- **Mono (labels):** DM Mono — micro-labels (classe `.mono-label`)

### Paleta de Cores
| Token         | Valor     | Uso                        |
|---------------|-----------|----------------------------|
| `gold`        | #b8873a   | Acentos, CTAs, destaques   |
| `gold-light`  | #e8d5b0   | Hover, fundos suaves       |
| `ink`         | #0e0c0a   | Texto principal (light)    |
| `paper`       | #f4f0e8   | Background principal       |
| `warm-gray`   | #7a7268   | Texto secundário           |
| `rust`        | #5c2418   | Tema alternativo           |

### Temas
Três temas disponíveis via classe no `<body>`: padrão (light), `theme-dark`, `theme-rust`.
Variáveis CSS: `--theme-bg`, `--theme-text`, `--theme-surface`, `--theme-line`.

### Classes Utilitárias
- `.serif-display` — Fraunces black, tracking tight
- `.mono-label` — DM Mono 10px, uppercase, letter-spacing 0.25em
- `.card-editorial` — Card com bg-surface + border-line + transição

## Identidade e Tom
- **Mood:** Profissional, editorial, premium. Inspiração em revistas de arquitetura.
- **Voz:** Assertiva, direta, sem floreios. "O problema nunca é a peça. É o sistema."
- **Sem emojis** no código ou interface, a menos que explicitamente solicitado.

## Convenções

- Idioma do código: inglês (nomes de variáveis, funções, componentes)
- Idioma da interface: português brasileiro
- Usar `cn()` de `@/src/lib/utils` para classes condicionais
- Animações via `motion/react` (Motion library)
- Ícones via `lucide-react`
- Alias `@/` mapeia para a raiz do projeto (não para `src/`)

## Arquitetura Modular

### Camadas

#### 1. Frontend (Interface)
- Componentes visuais (`src/components/`) — UI pura
- Estado da aplicação (`src/stores/`) — 7 React Context providers
- Serviços de API (`src/services/api.ts`) — cliente centralizado
- Hooks customizados (`src/hooks/`) — lógica reutilizável

#### 2. Backend (Infraestrutura)
- **Routes** (`server/routes/`) — endpoints da API (21 arquivos)
- **Services** (`server/services/`) — lógica de negócio
- **Repositories** (`server/repositories/`) — acesso a dados (SQLite)
- **Middleware** (`server/middleware/`) — auth, cors, rate limit, error handling
- **Validation** (`server/validation/`) — schemas de validação de input

#### 3. Camada de Inteligência (planejada)
- Diretório `intelligence/` ainda não implementado
- Previsto para: processamento, tomada de decisão, integração com IA

### Princípios Arquiteturais

- **Separation of Concerns** — cada módulo tem uma única responsabilidade
- **Clean Architecture** — dependências apontam para dentro (domínio)
- **Baixo acoplamento** — módulos independentes e substituíveis
- **Alta coesão** — código relacionado vive junto

## Gotchas de Dev

- **Vite config deve ser `.mjs`** — tsx e Vite compartilham esbuild, `.ts` causa deadlock
- **Helmet desabilitado em dev** — CSP e CORP bloqueiam scripts do Vite
- **WebSocket em noServer mode** — para não conflitar com HMR do Vite (upgrade manual por path `/ws`)
- **SPA fallback manual** — necessário em Vite middleware mode (usa `vite.transformIndexHtml`)
- **postsRouter é catch-all** — montado em `/api` com auth global, deve ser o último

## Funcionalidades Planejadas

### Announcement Gate (Sistema de Avisos Obrigatórios)
- **Spec:** `docs/superpowers/specs/2026-03-10-announcement-gate-design.md`
- **Plano:** `docs/superpowers/plans/2026-03-10-announcement-gate.md`
- **Resumo:** Fullscreen modal que bloqueia a interface até o usuário confirmar. Usado para boas-vindas no primeiro login, anúncios importantes, enquetes, promoções com prazo. Sistema de blocos modulares (text, image, video, poll, form, rating, action). Admin gerencia via painel com editor de blocos. Cada anúncio tem configuração de frequência (once, daily, weekly, monthly, every_login), prioridade, expiração e target. Fila sequencial quando há múltiplos pendentes.

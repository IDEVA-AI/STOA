# STOA - Notas de Desenvolvimento

## Origem

Prototipo monolitico criado no Google AI Studio (Gemini). Arquivo original preservado em `design-system/src/App.tsx` (~26k tokens, componente unico). O projeto atual (`src/`) e a decomposicao modular desse monolito.

## Diretriz Principal

- **Foco na interface.** A prioridade e excelencia visual e UX editorial.
- Backend (Express + SQLite) serve como suporte ao prototipo, nao e o foco.
- Priorizar estetica editorial, tipografia e interacoes premium.
- Inspiracao visual: revistas de arquitetura, design editorial premium.

## Stack Tecnica

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons |
| Backend | Express, better-sqlite3 (`nexus.db`), tsx (runtime TS) |
| Build | Vite 6, @tailwindcss/vite |
| Utilitarios | clsx + tailwind-merge (`cn()`), date-fns |

## Arquitetura Atual

### Frontend (`src/`)

```
src/
  App.tsx                  # Orquestrador: providers + roteamento por tab
  main.tsx                 # Entry point React
  index.css                # Tailwind config, tokens de tema, utilitarios CSS
  components/
    ui/                    # 16 componentes reutilizaveis (Button, Input, Avatar, Card, Badge, etc.)
    layout/                # Sidebar, Header
    admin/                 # 8 sub-paineis (Dashboard, Communities, Courses, Media, etc.)
  pages/                   # 9 paginas (Auth, Dashboard, Courses, LessonPlayer, Community, Messages, Profile, Admin, DesignSystem)
  hooks/                   # useAuth, useTheme, useNavigation, useCourses, useCommunity
  stores/                  # Context providers (Auth, Theme, Navigation, Course, Community)
  services/                # api.ts — fetch wrapper para endpoints
  types/                   # Interfaces TS (ui.ts, index.ts) + types.ts legado
  lib/                     # utils.ts (cn()), motion.ts (animacoes)
```

### Backend (`server/`)

```
server/
  index.ts                 # Express + Vite middleware, porta 4747
  db/
    connection.ts          # Conexao better-sqlite3
    schema.ts              # Criacao de tabelas (users, courses, modules, lessons, lesson_progress, posts)
    seed.ts                # Dados iniciais
  routes/                  # courses.ts, posts.ts
  services/                # courseService.ts, postService.ts
  repositories/            # courseRepository.ts, postRepository.ts
```

### Banco de Dados (SQLite)

Tabelas: `users`, `courses`, `modules`, `lessons`, `lesson_progress`, `posts`.

## Design System

### Tipografia

| Familia | Fonte | Uso | Classe |
|---------|-------|-----|--------|
| Serif (display) | Fraunces | Titulos, headings | `.serif-display` |
| Sans (corpo) | DM Sans | Texto geral, labels | default (`font-sans`) |
| Mono (labels) | DM Mono | Micro-labels | `.mono-label` |

### Paleta de Cores

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `gold` | `#b8873a` | `#d4a04a` | Acentos, CTAs, destaques |
| `gold-light` | `#e8d5b0` | `#c4a572` | Hover, fundos suaves |
| `ink` | `#0e0c0a` | — | Texto principal (fixo) |
| `paper` | `#f4f0e8` | — | Background principal (fixo) |
| `warm-gray` | `#7a7268` | `#a69d94` | Texto secundario |
| `bg` | `#f4f0e8` | `#0e0c0a` | Background (tema) |
| `text` | `#0e0c0a` | `#f4f0e8` | Texto (tema) |
| `surface` | `#ffffff` | `#1a1714` | Cards, paineis |
| `line` | `#ddd8cc` | `rgba(f4f0e8, 0.1)` | Bordas, divisores |

Tokens extras (nao existem na referencia, adicionados como melhoria):
`surface-elevated`, `overlay`, `success`, `danger`.

### Temas

Tres temas via classe no `<body>`: padrao (light), `theme-dark`, `theme-rust`.
Variaveis CSS `--theme-*` controlam todas as cores semanticas.

### Convencoes de Estilo

- Botao primary: fundo escuro (`bg-text`), texto claro (`text-bg`), hover vira gold — estilo editorial
- Avatar default: circulo escuro (`bg-text`), letra gold — contraste forte
- Inputs: focus somente com borda (`border-gold`), sem ring — visual limpo
- Cards: `.card-editorial` com `duration-300`
- Gradientes usam token `ink` (nao `black`)
- Paineis escuros usam `bg-text text-bg` (theme-aware, nao fixo `bg-ink text-paper`)

## API Endpoints

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/courses` | Lista cursos |
| GET | `/api/courses/:id/content` | Modulos e aulas de um curso |
| GET | `/api/feed` | Posts da comunidade com dados do user |
| POST | `/api/posts` | Criar novo post (`{ content, userId }`) |

## Secoes da Interface

1. **Auth** — Login/Register com branding editorial (painel escuro + formulario)
2. **Dashboard** — Hero editorial + cursos em progresso + pulso da comunidade
3. **Cursos** — Listagem em grid com cards editoriais
4. **Lesson Player** — Player de aulas com sidebar de modulos/aulas
5. **Comunidade** — Feed de posts com likes
6. **Mensagens** — Sistema de mensagens (UI implementada)
7. **Perfil** — Dados do usuario
8. **Admin** — 8 sub-secoes: dashboard, communities, courses, media, integrations, unlocks, moderation, settings
9. **Design System** — Pagina de referencia visual dos componentes

## Convencoes de Codigo

- Nomes de variaveis, funcoes, componentes: **ingles**
- Interface do usuario: **portugues brasileiro**
- `cn()` de `@/src/lib/utils` para classes condicionais
- Animacoes via `motion/react`
- Icones via `lucide-react`
- Alias `@/` mapeia para raiz do projeto (nao `src/`)
- Sem emojis no codigo ou interface

## Historico de Decisoes

### 2026-03-10 — Realinhamento do Design System

Tokens e estilos realinhados com a referencia original (`design-system/`):
- Dark `--theme-surface`: `#161412` → `#1a1714`
- Dark `--theme-line`: `rgba(..., 0.08)` → `rgba(..., 0.1)`
- `.card-editorial`: `duration-500` → `duration-300`
- Button primary: `bg-gold text-paper` → `bg-text text-bg hover:bg-gold`
- Avatar default: `bg-warm-gray/20` → `bg-text`
- Input focus: removido `ring-1 ring-gold/20`, mantido so `border-gold`
- Dashboard gradiente: `from-black` → `from-ink`
- AuthPage painel: `bg-ink text-paper` → `bg-text text-bg`

Mantidas melhorias sobre a referencia: tokens extras, dark mode shadows, temas com variaveis.

## Pendencias

- **Announcement Gate** — Sistema de avisos obrigatorios (spec e plano em `docs/superpowers/`)
- Autenticacao real (atualmente mockada)
- Upload de media
- Sistema de mensagens funcional (backend)
- Integracao com camada de inteligencia (`intelligence/`)

# STOA — Plataforma de Conhecimento e Comunidade

## Sobre o Projeto

Plataforma educacional e de comunidade para **Julio Carvalho — Arquiteto de Sistemas Organizacionais**. O nome "STOA" remete à Stoá grega, local de ensino e troca de ideias. O sistema inclui cursos, feed de comunidade, painel administrativo, mensagens e perfil do usuário.

**Status atual:** Protótipo de frontend criado no Google AI Studio (Gemini). Continuidade do desenvolvimento acontece aqui.

## Stack Técnica

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons
- **Backend:** Express + Vite (dev middleware), better-sqlite3 (`nexus.db`)
- **Build:** Vite 6, tsx (runtime TS para server)
- **Utilitários:** clsx + tailwind-merge (via `cn()`), date-fns

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
├── server.ts           # Express + SQLite + Vite middleware
├── src/
│   ├── App.tsx         # Componente principal (monolítico atualmente)
│   ├── main.tsx        # Entry point React
│   ├── index.css       # Tailwind config + tema + utilitários CSS
│   ├── types.ts        # Interfaces: User, Course, Module, Lesson, Post
│   └── lib/utils.ts    # cn() helper
├── vite.config.ts      # Plugins: React, Tailwind. Alias: @ → raiz
├── tsconfig.json       # ES2022, bundler resolution, paths: @/* → ./*
└── index.html          # SPA entry
```

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

## API Endpoints (server.ts)

| Método | Rota                        | Descrição                    |
|--------|-----------------------------|------------------------------|
| GET    | `/api/courses`              | Lista todos os cursos        |
| GET    | `/api/courses/:id/content`  | Módulos e aulas de um curso  |
| GET    | `/api/feed`                 | Posts da comunidade com user  |
| POST   | `/api/posts`                | Criar novo post              |

## Seções da Interface

1. **Login/Register** — Tela de autenticação com branding editorial
2. **Dashboard** — Visão geral com cursos em progresso e feed
3. **Cursos** — Listagem e player de aulas (vídeo embeds)
4. **Comunidade** — Feed de posts com likes e compartilhamento
5. **Admin** — Painel com sub-seções: dashboard, communities, courses, media, integrations, unlocks, moderation, settings
6. **Perfil** — Dados do usuário
7. **Mensagens** — Sistema de mensagens

## Diretriz de Desenvolvimento

- **Foco na interface.** A prioridade é a excelência visual e UX.
- **Backend é secundário.** SQLite + Express servem como suporte ao protótipo.
- **App.tsx é monolítico** — precisa ser decomposto em componentes conforme o projeto cresce.
- **Alias `@/`** mapeia para a raiz do projeto (não para `src/`).

## Convenções

- Idioma do código: inglês (nomes de variáveis, funções, componentes)
- Idioma da interface: português brasileiro
- Usar `cn()` de `@/src/lib/utils` para classes condicionais
- Animações via `motion/react` (Motion library)
- Ícones via `lucide-react`

## Arquitetura Modular

O sistema deve seguir rigorosamente princípios de arquitetura modular e componentização. A estrutura deve ser escalável, organizada e de fácil manutenção, com separação clara de responsabilidades.

### Camadas

#### 1. Frontend (Interface)
- Responsável exclusivamente pela interface e experiência do usuário.
- Organizado em componentes reutilizáveis com separação clara entre:
  - **Componentes visuais** (`src/components/`) — UI pura, apresentação
  - **Estado da aplicação** (`src/stores/` ou `src/hooks/`) — gerenciamento de estado
  - **Serviços de API** (`src/services/`) — comunicação com o backend
- Seguir boas práticas de organização de pastas e componentização.

#### 2. Camada de Inteligência (Lógica / IA / Regras de Negócio)
- Responsável por toda lógica do sistema, processamento de dados e inteligência aplicada.
- Isolada do frontend.
- Módulos independentes para:
  - Processamento
  - Tomada de decisão
  - Análise ou integração com IA
- Deve evoluir sem impactar diretamente a interface.

#### 3. Backend (Infraestrutura)
- Responsável pela API, persistência de dados e integrações externas.
- Estruturado em módulos claros:
  - **Controllers** — endpoints da API
  - **Services** — lógica de negócio
  - **Repositories** — acesso a dados
  - **Models** — modelos de dados
- Separação rigorosa entre lógica de negócio, acesso a dados e endpoints.

### Princípios Arquiteturais

- **Separation of Concerns** — cada módulo tem uma única responsabilidade
- **Clean Architecture** — dependências apontam para dentro (domínio)
- **Baixo acoplamento** — módulos independentes e substituíveis
- **Alta coesão** — código relacionado vive junto
- Cada módulo deve ser independente e reutilizável
- Evitar código monolítico ou funções com múltiplas responsabilidades
- Priorizar legibilidade, escalabilidade e modularidade

### Estrutura-Alvo do Projeto

```
├── server/
│   ├── controllers/    # Endpoints da API
│   ├── services/       # Lógica de negócio
│   ├── repositories/   # Acesso a dados (SQLite)
│   ├── models/         # Modelos de dados
│   └── index.ts        # Entry point do servidor
├── src/
│   ├── components/     # Componentes visuais reutilizáveis
│   ├── pages/          # Páginas/views da aplicação
│   ├── hooks/          # Hooks customizados e estado
│   ├── services/       # Comunicação com API
│   ├── stores/         # Estado global da aplicação
│   ├── types/          # Interfaces e tipos
│   ├── lib/            # Utilitários
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── intelligence/       # Camada de inteligência/IA/regras
│   ├── processing/     # Processamento de dados
│   ├── decisions/      # Tomada de decisão
│   └── analysis/       # Análise e integração IA
```

## Funcionalidades Planejadas (pendentes de implementação)

### Announcement Gate (Sistema de Avisos Obrigatórios)
- **Spec:** `docs/superpowers/specs/2026-03-10-announcement-gate-design.md`
- **Plano:** `docs/superpowers/plans/2026-03-10-announcement-gate.md`
- **Resumo:** Fullscreen modal que bloqueia a interface até o usuário confirmar. Usado para boas-vindas no primeiro login, anúncios importantes, enquetes, promoções com prazo. Sistema de blocos modulares (text, image, video, poll, form, rating, action). Admin gerencia via painel com editor de blocos. Cada anúncio tem configuração de frequência (once, daily, weekly, monthly, every_login), prioridade, expiração e target. Fila sequencial quando há múltiplos pendentes.

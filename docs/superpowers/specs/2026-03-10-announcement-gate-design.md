# Announcement Gate — Design Spec

## Overview

Sistema de anuncios obrigatorios que bloqueia a interface ate o usuario confirmar. Usado para boas-vindas no primeiro login, anuncios importantes, enquetes e promocoes com prazo.

## Modelo de Dados

### announcements

| Campo | Tipo | Descricao |
|---|---|---|
| id | INTEGER PK | — |
| title | TEXT | Titulo do anuncio |
| subtitle | TEXT NULL | Subtitulo opcional |
| mandatory | BOOLEAN DEFAULT true | Se true, obriga confirmacao |
| frequency | TEXT DEFAULT 'once' | once, daily, weekly, monthly, every_login |
| priority | INTEGER DEFAULT 0 | Ordem na fila (maior = primeiro) |
| starts_at | DATETIME | Quando comeca a aparecer |
| expires_at | DATETIME NULL | Quando expira (null = vitalicio) |
| target | TEXT DEFAULT 'all' | all, new_users, role:admin, etc. |
| is_active | BOOLEAN DEFAULT true | Ativado/desativado pelo admin |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP | — |

### announcement_blocks

| Campo | Tipo | Descricao |
|---|---|---|
| id | INTEGER PK | — |
| announcement_id | FK | Referencia ao anuncio |
| type | TEXT | text, image, video, poll, form, rating, action |
| content | JSON (TEXT) | Dados do bloco |
| order | INTEGER | Posicao no anuncio |

### announcement_confirmations

| Campo | Tipo | Descricao |
|---|---|---|
| id | INTEGER PK | — |
| user_id | FK | — |
| announcement_id | FK | — |
| confirmed_at | DATETIME DEFAULT CURRENT_TIMESTAMP | — |
| UNIQUE(user_id, announcement_id) | | Evita duplicatas |

### announcement_responses

| Campo | Tipo | Descricao |
|---|---|---|
| id | INTEGER PK | — |
| user_id | FK | — |
| block_id | FK | Qual bloco respondeu |
| response | JSON (TEXT) | Voto, texto, rating, etc. |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP | — |

## Logica de Exibicao

1. Buscar anuncios onde is_active = true
2. Filtrar: starts_at <= now E (expires_at IS NULL OU expires_at > now)
3. Filtrar por target (match com o usuario)
4. Excluir frequency = 'once' que ja tem confirmacao do usuario
5. Para frequency recorrente — excluir se ultima confirmacao dentro do periodo
6. Ordenar por priority DESC

## Sistema de Blocos

### Blocos de conteudo

**text** — `{ "variant": "heading|paragraph|list", "text": "...", "items": ["..."] }`

**image** — `{ "src": "/uploads/...", "alt": "...", "caption": "..." }`

**video** — `{ "url": "https://...", "provider": "youtube|vimeo" }`

### Blocos interativos

**poll** — `{ "question": "...", "options": ["A", "B", "C"], "multiple": false, "required": true }`

**form** — `{ "fields": [{ "label": "...", "type": "text|textarea", "required": true }] }`

**rating** — `{ "question": "...", "max": 5, "labels": ["Ruim", "Excelente"] }`

### Bloco de acao

**action** — `{ "buttons": [{ "label": "Ver curso", "action": "navigate", "target": "courses" }] }`

## Arquitetura Frontend

### Estrutura de arquivos

```
src/
  components/
    announcements/
      AnnouncementGate.tsx        # Fullscreen modal + fila
      AnnouncementCard.tsx         # Container de um anuncio
      BlockRenderer.tsx            # Switch por tipo de bloco
      blocks/
        TextBlock.tsx
        ImageBlock.tsx
        VideoBlock.tsx
        PollBlock.tsx
        FormBlock.tsx
        RatingBlock.tsx
        ActionBlock.tsx
  hooks/
    useAnnouncements.ts            # Fetch + estado de respostas
  services/
    announcementService.ts         # API calls
```

### Fluxo

```
isAuthenticated?
  false -> AuthPage
  true  -> AnnouncementGate
             tem pendentes -> Fullscreen modal (fila sequencial)
             sem pendentes -> App normal
```

### Hook useAnnouncements

```ts
{
  announcements: Announcement[]
  currentIndex: number
  responses: Map<blockId, value>
  setResponse(blockId, value)
  confirm()
  isLoading: boolean
  isComplete: boolean
}
```

### Fila sequencial

- Barra de progresso: "1 de 3"
- Um anuncio por vez, scroll interno
- Botao confirmar desabilitado ate required preenchidos
- Confirmar envia respostas + confirmation, avanca
- Ultimo confirmado libera o app

## Backend

### Endpoints

| Metodo | Rota | Descricao |
|---|---|---|
| GET | /api/announcements/pending | Pendentes para usuario logado |
| POST | /api/announcements/:id/confirm | Confirma visualizacao |
| POST | /api/announcements/:id/respond | Envia respostas dos blocos |
| GET | /api/admin/announcements | Lista todos (admin) |
| POST | /api/admin/announcements | Cria anuncio com blocos |
| PUT | /api/admin/announcements/:id | Edita anuncio |
| DELETE | /api/admin/announcements/:id | Remove anuncio |
| GET | /api/admin/announcements/:id/stats | Respostas e confirmacoes |

### Estrutura

```
server/
  routes/announcements.ts
  services/announcementService.ts
  repositories/announcementRepository.ts
```

## Admin Panel

- Nova secao "Avisos" no admin existente
- Lista de anuncios (ativos, expirados, rascunhos)
- Formulario: titulo, subtitulo, mandatory, frequency, target, datas
- Editor de blocos: adicionar/remover/reordenar
- Preview do anuncio
- Aba de estatisticas: confirmacoes, respostas

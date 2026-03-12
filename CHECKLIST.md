# STOA — Checklist para Producao

## 1. Autenticacao (CRITICO — bloqueia tudo)

- [ ] Adicionar colunas `email`, `password_hash`, `created_at`, `is_active` na tabela `users`
- [ ] Endpoint `POST /api/auth/register` (bcrypt hash, validacao de email)
- [ ] Endpoint `POST /api/auth/login` (retorna JWT access + refresh token)
- [ ] Endpoint `POST /api/auth/refresh` (renova token)
- [ ] Middleware `authMiddleware` que valida JWT em todas as rotas protegidas
- [ ] Usar `JWT_SECRET` do env (ja configurado no Swarm)
- [ ] Frontend: tela de login/registro funcional (hoje e fake)
- [ ] Frontend: armazenar token (localStorage ou httpOnly cookie)
- [ ] Frontend: interceptar 401 e redirecionar pro login
- [ ] Remover todo `userId = 1` hardcoded — extrair do token JWT

## 2. Middleware Express (CRITICO)

- [ ] CORS configurado (origem `membros.jcarv.in`)
- [ ] Helmet.js (security headers)
- [ ] Error handling middleware (retorna JSON estruturado, nao 500 generico)
- [ ] Rate limiting (express-rate-limit) nos endpoints de auth e posts
- [ ] Compression (gzip)

## 3. Validacao de Input (ALTO)

- [ ] Instalar Zod
- [ ] Schema de validacao em `POST /api/posts` (content obrigatorio, max length)
- [ ] Schema de validacao em `POST /api/posts/:id/comments`
- [ ] Schema de validacao em `POST /api/messages/conversations/:id/messages`
- [ ] Schema de validacao em `POST /api/auth/register` e `POST /api/auth/login`
- [ ] Validar path params (`:id` numerico)
- [ ] Sanitizar inputs contra XSS

## 4. Roteamento Frontend (ALTO)

- [ ] Instalar React Router v7
- [ ] Rotas com URL real (ex: `/cursos`, `/comunidade`, `/mensagens`, `/admin`)
- [ ] Deep linking funcional (compartilhar URL de pagina especifica)
- [ ] Rota protegida (redireciona pra login se nao autenticado)
- [ ] Historico do browser funcional (voltar/avancar)

## 5. Database (MEDIO)

- [ ] Criar indices nas colunas mais consultadas:
  - `posts(created_at)`
  - `lesson_progress(user_id)`
  - `messages(conversation_id)`
  - `modules(course_id)`
  - `lessons(module_id)`
- [ ] Adicionar coluna `updated_at` em posts e courses
- [ ] Migration system (versionamento de schema)

## 6. Admin CRUD Real (MEDIO)

- [ ] `GET/POST/PUT/DELETE /api/admin/courses` — CRUD de cursos
- [ ] `GET/POST/PUT/DELETE /api/admin/modules` — CRUD de modulos
- [ ] `GET/POST/PUT/DELETE /api/admin/lessons` — CRUD de aulas
- [ ] `GET/POST/PUT/DELETE /api/admin/users` — gerenciar membros
- [ ] Frontend admin: conectar ao backend (hoje usa mock data)

## 7. Upload de Midia (MEDIO)

- [ ] Endpoint `POST /api/upload` (multipart/form-data)
- [ ] Integrar Bunny CDN (keys ja configuradas no Swarm)
- [ ] Frontend: drag-and-drop funcional no AdminMedia
- [ ] Thumbnails de cursos servidas do CDN (hoje sao placeholder)

## 8. Mensagens (MEDIO)

- [ ] Migrar polling (3s) para WebSocket (Socket.io ou ws)
- [ ] Indicador de "digitando..."
- [ ] Notificacao de mensagem nova (badge no sidebar)

## 9. Announcement Gate (MEDIO)

- [ ] Criar tabelas: `announcements`, `announcement_blocks`, `announcement_confirmations`, `announcement_responses`
- [ ] Endpoints CRUD de announcements (admin)
- [ ] Endpoint `GET /api/announcements/pending` (retorna announcements nao confirmados)
- [ ] Endpoint `POST /api/announcements/:id/confirm`
- [ ] Frontend: modal fullscreen bloqueante
- [ ] Frontend: admin editor de announcements com blocos
- [ ] Spec completa em `docs/superpowers/specs/2026-03-10-announcement-gate-design.md`

## 10. Perfil e Configuracoes (BAIXO)

- [ ] Endpoint `GET/PUT /api/profile` (editar nome, avatar, bio)
- [ ] Endpoint `PUT /api/profile/password` (trocar senha)
- [ ] Frontend: botao "Salvar" funcional no ProfilePage
- [ ] Upload de avatar

## 11. Camada de Inteligencia (BAIXO — futuro)

- [ ] Estrutura `intelligence/` conforme CLAUDE.md
- [ ] Modulos de processamento, decisao e analise
- [ ] Integracao com IA (Gemini API key ja no env)

## 12. Qualidade e Observabilidade (BAIXO)

- [ ] Logging estruturado (pino ou winston)
- [ ] Testes unitarios (repositories + services)
- [ ] Testes de integracao (rotas)
- [ ] Error boundaries no React
- [ ] Monitoramento de metricas basicas

---

## Ordem de execucao recomendada

1. **Autenticacao** — desbloqueia tudo (multi-usuario, seguranca)
2. **Middleware** — CORS + error handling + rate limiting
3. **Validacao** — protege contra input malicioso
4. **Roteamento** — URLs reais, deep linking
5. **Admin CRUD** — gerenciar conteudo real
6. **Upload de midia** — cursos com videos/thumbnails reais
7. **Announcement Gate** — engagement e comunicacao
8. **Mensagens WebSocket** — UX melhor
9. **Perfil** — personalizacao
10. **Inteligencia** — diferencial futuro
11. **Testes e observabilidade** — estabilidade

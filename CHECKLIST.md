# STOA — Checklist para Producao

## 1. Autenticacao (CRITICO — bloqueia tudo) ✅

- [x] Adicionar colunas `email`, `password_hash`, `created_at`, `is_active` na tabela `users`
- [x] Endpoint `POST /api/auth/register` (bcrypt hash, validacao de email)
- [x] Endpoint `POST /api/auth/login` (retorna JWT access + refresh token)
- [x] Endpoint `POST /api/auth/refresh` (renova token)
- [x] Middleware `authMiddleware` que valida JWT em todas as rotas protegidas
- [x] Usar `JWT_SECRET` do env (ja configurado no Swarm)
- [x] Frontend: tela de login/registro funcional (hoje e fake)
- [x] Frontend: armazenar token (localStorage ou httpOnly cookie)
- [x] Frontend: interceptar 401 e redirecionar pro login
- [x] Remover todo `userId = 1` hardcoded — extrair do token JWT

## 2. Middleware Express (CRITICO) ✅

- [x] CORS configurado (origem `membros.jcarv.in`)
- [x] Helmet.js (security headers)
- [x] Error handling middleware (retorna JSON estruturado, nao 500 generico)
- [x] Rate limiting (express-rate-limit) nos endpoints de auth e posts
- [x] Compression (gzip)

## 3. Validacao de Input (ALTO) ✅

- [x] Instalar Zod
- [x] Schema de validacao em `POST /api/posts` (content obrigatorio, max length)
- [x] Schema de validacao em `POST /api/posts/:id/comments`
- [x] Schema de validacao em `POST /api/messages/conversations/:id/messages`
- [x] Schema de validacao em `POST /api/auth/register` e `POST /api/auth/login`
- [x] Validar path params (`:id` numerico)
- [ ] Sanitizar inputs contra XSS

## 4. Roteamento Frontend (ALTO) ✅

- [x] Instalar React Router v7
- [x] Rotas com URL real (ex: `/cursos`, `/comunidade`, `/mensagens`, `/admin`)
- [x] Deep linking funcional (compartilhar URL de pagina especifica)
- [x] Rota protegida (redireciona pra login se nao autenticado)
- [x] Historico do browser funcional (voltar/avancar)

## 5. Database (MEDIO) ✅

- [x] Criar indices nas colunas mais consultadas
- [ ] Adicionar coluna `updated_at` em posts e courses
- [ ] Migration system (versionamento de schema)

## 6. Admin CRUD Real (MEDIO) 🔄 EM PROGRESSO

- [ ] `GET/POST/PUT/DELETE /api/admin/courses` — CRUD de cursos
- [ ] `GET/POST/PUT/DELETE /api/admin/modules` — CRUD de modulos
- [ ] `GET/POST/PUT/DELETE /api/admin/lessons` — CRUD de aulas
- [ ] `GET/POST/PUT/DELETE /api/admin/users` — gerenciar membros
- [ ] Frontend admin: conectar ao backend (hoje usa mock data)

## 7. Upload de Midia (MEDIO) 🔄 EM PROGRESSO

- [ ] Endpoint `POST /api/upload` (multipart/form-data)
- [ ] Integrar Bunny CDN (keys ja configuradas no Swarm)
- [ ] Frontend: drag-and-drop funcional no AdminMedia
- [ ] Thumbnails de cursos servidas do CDN (hoje sao placeholder)

## 8. Mensagens (MEDIO)

- [ ] Migrar polling (3s) para WebSocket (Socket.io ou ws)
- [ ] Indicador de "digitando..."
- [ ] Notificacao de mensagem nova (badge no sidebar)

## 9. Announcement Gate (MEDIO) 🔄 EM PROGRESSO

- [ ] Criar tabelas: `announcements`, `announcement_blocks`, `announcement_confirmations`
- [ ] Endpoints CRUD de announcements (admin)
- [ ] Endpoint `GET /api/announcements/pending` (retorna announcements nao confirmados)
- [ ] Endpoint `POST /api/announcements/:id/confirm`
- [ ] Frontend: modal fullscreen bloqueante
- [ ] Frontend: admin editor de announcements com blocos
- [ ] Spec completa em `docs/superpowers/specs/2026-03-10-announcement-gate-design.md`

## 10. Perfil e Configuracoes (BAIXO) 🔄 EM PROGRESSO

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

1. ~~**Autenticacao**~~ ✅
2. ~~**Middleware**~~ ✅
3. ~~**Validacao**~~ ✅
4. ~~**Roteamento**~~ ✅
5. ~~**Database indices**~~ ✅
6. **Admin CRUD** 🔄
7. **Upload de midia** 🔄
8. **Announcement Gate** 🔄
9. **Perfil** 🔄
10. **Mensagens WebSocket**
11. **Inteligencia** — diferencial futuro
12. **Testes e observabilidade** — estabilidade

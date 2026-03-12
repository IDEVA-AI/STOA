# STOA — Checklist para Producao

## 1. Autenticacao ✅
## 2. Middleware Express ✅
## 3. Validacao de Input ✅
## 4. Roteamento Frontend ✅
## 5. Database Indices ✅
## 6. Admin CRUD Real ✅
## 7. Upload de Midia (Bunny CDN) ✅
## 9. Announcement Gate ✅
## 10. Perfil e Configuracoes ✅

## 8. Mensagens (PENDENTE)

- [ ] Migrar polling (3s) para WebSocket (Socket.io ou ws)
- [ ] Indicador de "digitando..."
- [ ] Notificacao de mensagem nova (badge no sidebar)

## 11. Camada de Inteligencia (FUTURO)

- [ ] Estrutura `intelligence/` conforme CLAUDE.md
- [ ] Modulos de processamento, decisao e analise
- [ ] Integracao com IA (Gemini API key ja no env)

## 12. Qualidade e Observabilidade (FUTURO)

- [ ] Logging estruturado (pino ou winston)
- [ ] Testes unitarios (repositories + services)
- [ ] Testes de integracao (rotas)
- [ ] Error boundaries no React
- [ ] Monitoramento de metricas basicas

## Itens menores pendentes

- [ ] Sanitizar inputs contra XSS
- [ ] Adicionar coluna `updated_at` em posts e courses
- [ ] Migration system (versionamento de schema)

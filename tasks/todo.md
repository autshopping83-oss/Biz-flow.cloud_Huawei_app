# Task List: Biz-Flow.cloud - PWA Web Pura

## Phase 1: Limpeza de Dependências e Configuração

### Task 1: Atualizar package.json e remover dependências desnecessárias
- [x] Remover @capacitor/* (android, core, filesystem, bluetooth-le, assets, cli)
- [x] Remover @google/genai
- [x] Remover @prisma/client e prisma
- [x] Remover @supabase/supabase-js
- [x] Remover scripts de Capacitor (cap:sync, cap:open:android, cap:add:android)
- [x] Manter dependências core: react, react-dom, vite, tailwindcss, jspdf, html2canvas, dexie, dompurify, fontawesome

### Task 2: Remover arquivos e diretórios desnecessários
- [x] Remover diretório android/
- [x] Remover capacitor.config.ts
- [x] Remover android-ci.yml
- [x] Remover .github/workflows/android-ci.yml
- [x] Remover serviços: geminiService.ts, n8nWebhookService.ts, apiService.ts, apiServiceHandlers.ts, apiKeyService.ts, googlePlayService.ts, supabaseClient.ts, syncService.ts, orgService.ts, productService.ts
- [x] Remover diretório src/services/api/

### Task 3: Atualizar .env.example e variáveis de ambiente
- [ ] Remover VITE_GEMINI_API_KEY
- [ ] Remover VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
- [ ] Manter apenas variáveis necessárias (se houver)
- [ ] Atualizar .env.example se existir

## Phase 2: Refatoração de Código

### Task 4: Atualizar imports e referências em componentes
- [ ] Identificar todos os arquivos que importam serviços removidos
- [ ] Atualizar imports para usar Dexie (db.ts) ou remover chamadas
- [ ] Garantir que não há erros de TypeScript após mudanças
- [ ] Componentes funcionam sem dependências externas

### Task 5: Adaptar hooks e contexts para armazenamento local
- [ ] Hooks de dados (useDocuments, useFinancial, etc.) usam Dexie
- [ ] Contexts de autenticação adaptados para modo local (sem Supabase Auth)
- [ ] Estados de loading/error tratados corretamente
- [ ] Dados persistem offline corretamente

### Task 6: Limpar types e interfaces desnecessários
- [ ] Remover tipos específicos do Supabase
- [ ] Remover tipos de API externa
- [ ] Manter tipos core da aplicação (Document, Financial, etc.)
- [ ] TypeScript compila sem erros

## Phase 3: Configuração PWA e Service Worker

### Task 7: Verificar e atualizar manifest.json
- [ ] manifest.json tem todas as propriedades obrigatórias
- [ ] Ícones estão corretos (192x192, 512x512)
- [ ] Cores e tema configurados
- [ ] start_url aponta para raiz

### Task 8: Configurar service worker para offline
- [ ] Service worker registra corretamente
- [ ] Recursos estáticos são cacheados
- [ ] App funciona offline após primeira visita
- [ ] Atualizações são detectadas e aplicadas

## Phase 4: Testes e Validação

### Task 9: Testar funcionalidades core offline
- [ ] Criar documento (fatura/recibo/orçamento) offline
- [ ] Gerar PDF offline
- [ ] Dados persistem após fechar e reabrir navegador
- [ ] Dashboard financeiro funciona offline

### Task 10: Build de produção e deploy
- [ ] npm run build completa sem erros
- [ ] Arquivos de build são gerados corretamente
- [ ] Tamanho do bundle é razoável (< 2MB)
- [ ] Deploy na Vercel funciona

## Status Geral
- **Progresso**: 2/10 tasks completas (20%)
- **Fase atual**: Phase 1 - Limpeza de Dependências
- **Próxima ação**: Task 3 - Atualizar variáveis de ambiente

## Notas
- Tasks 1 e 2 já foram executadas (package.json atualizado e arquivos removidos)
- Próximo passo é limpar variáveis de ambiente e então iniciar refatoração de código
- Recomendação: executar npm install após Task 3 para instalar dependências atualizadas

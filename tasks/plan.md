# Implementation Plan: Biz-Flow.cloud - PWA Web Pura

## Overview
Refatoração completa do Biz-Flow.cloud para uma Progressive Web App (PWA) pura, focada exclusivamente em web, sem dependências de Android (Capacitor), bancos de dados externos (Supabase, Prisma) ou integrações de terceiros (Gemini, n8n). O objetivo é simplificar a arquitetura, melhorar a performance e manter apenas funcionalidades web nativas com armazenamento local (IndexedDB via Dexie).

## Architecture Decisions

### Decisões Técnicas
1. **Armazenamento Local**: Substituir Supabase por Dexie (IndexedDB) para persistência offline
2. **Sem Backend**: Remover todas as chamadas de API externas e serviços de backend
3. **Web Only**: Eliminar completamente dependências mobile (Capacitor, Android)
4. **IA Local**: Remover integração Gemini; funcionalidades de IA podem ser reimplementadas futuramente com modelos locais
5. **Simplicidade**: Manter apenas funcionalidades core de documentos e financeiro

### Stack Final
- **Frontend**: React 19 + TypeScript + Vite
- **Estilização**: Tailwind CSS
- **Armazenamento**: Dexie (IndexedDB)
- **PDF**: jsPDF + html2canvas
- **PWA**: Service Workers nativos

## Dependency Graph

```
Limpeza de Dependências
    │
    ├── Atualização package.json ✓ (feito)
    │
    ├── Remoção de arquivos desnecessários
    │   ├── android/ ✓ (feito)
    │   ├── capacitor.config.ts ✓ (feito)
    │   ├── serviços de API ✓ (feito)
    │   └── configurações Android ✓ (feito)
    │
    ├── Refatoração de Código
    │   ├── Atualizar imports em componentes
    │   ├── Remover referências a serviços removidos
    │   ├── Adaptar hooks e contexts
    │   └── Limpar types desnecessários
    │
    ├── Configuração PWA
    │   ├── Verificar/atualizar manifest.json
    │   ├── Configurar service worker
    │   └── Testar instalação PWA
    │
    └── Testes e Validação
        ├── Build sem erros
        ├── Funcionalidades offline
        └── Teste de PDF
```

## Task List

### Phase 1: Limpeza de Dependências e Configuração

#### Task 1: Atualizar package.json e remover dependências desnecessárias
**Description:** Remover todas as dependências relacionadas a Android, Supabase, Prisma, Gemini e APIs externas do package.json.

**Acceptance criteria:**
- [x] Remover @capacitor/* (android, core, filesystem, bluetooth-le, assets, cli)
- [x] Remover @google/genai
- [x] Remover @prisma/client e prisma
- [x] Remover @supabase/supabase-js
- [x] Remover scripts de Capacitor (cap:sync, cap:open:android, cap:add:android)
- [x] Manter dependências core: react, react-dom, vite, tailwindcss, jspdf, html2canvas, dexie, dompurify, fontawesome

**Verification:**
- [x] package.json atualizado corretamente
- [ ] npm install funciona sem erros

**Dependencies:** None

**Files touched:**
- `package.json`

**Estimated scope:** XS

---

#### Task 2: Remover arquivos e diretórios desnecessários
**Description:** Eliminar todos os arquivos de configuração e código relacionados a Android, Capacitor, e serviços externos.

**Acceptance criteria:**
- [x] Remover diretório android/
- [x] Remover capacitor.config.ts
- [x] Remover android-ci.yml
- [x] Remover .github/workflows/android-ci.yml
- [x] Remover serviços: geminiService.ts, n8nWebhookService.ts, apiService.ts, apiServiceHandlers.ts, apiKeyService.ts, googlePlayService.ts, supabaseClient.ts, syncService.ts, orgService.ts, productService.ts
- [x] Remover diretório src/services/api/

**Verification:**
- [x] Todos os arquivos listados foram removidos
- [ ] Projeto ainda compila após remoção

**Dependencies:** Task 1

**Files touched:**
- Múltiplos arquivos (verificar lista acima)

**Estimated scope:** S

---

#### Task 3: Atualizar .env.example e variáveis de ambiente
**Description:** Limpar arquivo de exemplo de variáveis de ambiente, removendo referências a serviços externos.

**Acceptance criteria:**
- [ ] Remover VITE_GEMINI_API_KEY
- [ ] Remover VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
- [ ] Manter apenas variáveis necessárias (se houver)
- [ ] Atualizar .env.example se existir

**Verification:**
- [ ] Arquivo .env.example atualizado
- [ ] Não há referências a chaves de API no código

**Dependencies:** Task 2

**Files touched:**
- `.env.example`
- `.env.vercel`

**Estimated scope:** XS

---

### Phase 2: Refatoração de Código

#### Task 4: Atualizar imports e referências em componentes
**Description:** Corrigir todos os imports que referenciam serviços removidos e atualizar componentes para usar armazenamento local.

**Acceptance criteria:**
- [ ] Identificar todos os arquivos que importam serviços removidos
- [ ] Atualizar imports para usar Dexie (db.ts) ou remover chamadas
- [ ] Garantir que não há erros de TypeScript após mudanças
- [ ] Componentes funcionam sem dependências externas

**Verification:**
- [ ] npm run lint (tsc) passa sem erros
- [ ] Não há imports quebrados

**Dependencies:** Task 2

**Files touched:**
- Múltiplos componentes em src/components/ e src/features/

**Estimated scope:** M

---

#### Task 5: Adaptar hooks e contexts para armazenamento local
**Description:** Modificar hooks e React contexts para usar Dexie (IndexedDB) em vez de Supabase para persistência de dados.

**Acceptance criteria:**
- [ ] Hooks de dados (useDocuments, useFinancial, etc.) usam Dexie
- [ ] Contexts de autenticação adaptados para modo local (sem Supabase Auth)
- [ ] Estados de loading/error tratados corretamente
- [ ] Dados persistem offline corretamente

**Verification:**
- [ ] Criação de documento funciona offline
- [ ] Dados persistem após reload da página
- [ ] Não há erros de conexão com Supabase

**Dependencies:** Task 4

**Files touched:**
- `src/app/hooks/`
- `src/app/` (contexts)
- `src/services/db.ts`

**Estimated scope:** M

---

#### Task 6: Limpar types e interfaces desnecessários
**Description:** Remover definições de tipos relacionadas a APIs externas, Supabase e serviços removidos.

**Acceptance criteria:**
- [ ] Remover tipos específicos do Supabase
- [ ] Remover tipos de API externa
- [ ] Manter tipos core da aplicação (Document, Financial, etc.)
- [ ] TypeScript compila sem erros

**Verification:**
- [ ] npm run lint passa
- [ ] Não há tipos não utilizados

**Dependencies:** Task 4

**Files touched:**
- `src/types/`

**Estimated scope:** S

---

### Phase 3: Configuração PWA e Service Worker

#### Task 7: Verificar e atualizar manifest.json
**Description:** Garantir que o manifest.json está configurado corretamente para PWA web.

**Acceptance criteria:**
- [ ] manifest.json tem todas as propriedades obrigatórias
- [ ] Ícones estão corretos (192x192, 512x512)
- [ ] Cores e tema configurados
- [ ] start_url aponta para raiz

**Verification:**
- [ ] Lighthouse PWA audit passa
- [ ] App é instalável no navegador

**Dependencies:** Task 2

**Files touched:**
- `public/manifest.json`

**Estimated scope:** XS

---

#### Task 8: Configurar service worker para offline
**Description:** Garantir que o service worker cacheia recursos corretamente para funcionamento offline.

**Acceptance criteria:**
- [ ] Service worker registra corretamente
- [ ] Recursos estáticos são cacheados
- [ ] App funciona offline após primeira visita
- [ ] Atualizações são detectadas e aplicadas

**Verification:**
- [ ] Desconectar internet e testar app
- [ ] Verificar cache no DevTools

**Dependencies:** Task 7

**Files touched:**
- `public/service-worker.js`

**Estimated scope:** S

---

### Phase 4: Testes e Validação

#### Task 9: Testar funcionalidades core offline
**Description:** Verificar que todas as funcionalidades principais funcionam sem conexão com internet.

**Acceptance criteria:**
- [ ] Criar documento (fatura/recibo/orçamento) offline
- [ ] Gerar PDF offline
- [ ] Dados persistem após fechar e reabrir navegador
- [ ] Dashboard financeiro funciona offline

**Verification:**
- [ ] Teste manual completo offline
- [ ] Todos os fluxos principais funcionam

**Dependencies:** Tasks 5, 8

**Files touched:**
- N/A (teste manual)

**Estimated scope:** S

---

#### Task 10: Build de produção e deploy
**Description:** Compilar projeto para produção e verificar que não há erros.

**Acceptance criteria:**
- [ ] npm run build completa sem erros
- [ ] Arquivos de build são gerados corretamente
- [ ] Tamanho do bundle é razoável (< 2MB)
- [ ] Deploy na Vercel funciona

**Verification:**
- [ ] Build local funciona
- [ ] Deploy na Vercel funciona
- [ ] App carrega corretamente em produção

**Dependencies:** Task 9

**Files touched:**
- N/A (verificação)

**Estimated scope:** S

---

## Checkpoints

### Checkpoint 1: Após Tasks 1-3
- [ ] Dependências atualizadas no package.json
- [ ] Arquivos desnecessários removidos
- [ ] Variáveis de ambiente limpas
- [ ] npm install funciona

### Checkpoint 2: Após Tasks 4-6
- [ ] Código compila sem erros de TypeScript
- [ ] Não há referências a serviços removidos
- [ ] Componentes usam armazenamento local

### Checkpoint 3: Após Tasks 7-8
- [ ] PWA configurada corretamente
- [ ] Service worker funciona
- [ ] App é instalável

### Checkpoint 4: Após Tasks 9-10
- [ ] Funcionalidades offline testadas
- [ ] Build de produção funciona
- [ ] Deploy na Vercel funciona
- [ ] Projeto pronto para uso

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Perda de funcionalidades durante refatoração | Alto | Testar cada funcionalidade individualmente após mudanças |
| Erros de TypeScript difíceis de debugar | Médio | Fazer mudanças incrementais e testar compilação frequentemente |
| Dados offline podem ser perdidos | Alto | Implementar backup/exportação de dados do IndexedDB |
| Performance pode degradar com IndexedDB | Baixo | Otimizar queries do Dexie e usar índices corretamente |
| PWA pode não funcionar em todos os navegadores | Médio | Testar em Chrome, Firefox, Safari |

## Open Questions

1. **Funcionalidades de IA**: Devem ser completamente removidas ou substituídas por algo local?
2. **Multi-usuário**: Como funcionará autenticação sem Supabase? Modo single-user local?
3. **Backup**: Implementar exportação/importação de dados do IndexedDB?
4. **Sincronização**: Alguma sincronização futura planejada ou sempre offline?

---

*Plano criado em: 2026-07-07*
*Versão: 1.0*

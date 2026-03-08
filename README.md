# 🧾 Biz-Flow.cloud

**Biz-Flow** é uma plataforma robusta e moderna de gestão de negócios (Business OS) projetada especificamente para freelancers, autônomos e pequenas empresas. O aplicativo combina emissão de documentos profissionais, controle financeiro rigoroso e recursos de IA em uma experiência de Progressive Web App (PWA).

## 🚀 Funcionalidades Principais

### 📄 Emissão de Documentos (A4 & Térmico)
- **Documentos Suportados:** Faturas, Recibos e Orçamentos.
- **Exportação Profissional:** Geração de PDFs em formato A4 via `jsPDF` e `html2canvas`.
- **Assinatura Digital:** Recurso de assinatura direto na tela (Canvas) para validade imediata.
- **Impressão Térmica:** Suporte nativo a impressoras Bluetooth ESC/POS (58mm/80mm) via Web Bluetooth API.

### 💰 Gestão Financeira
- **Fluxo de Caixa:** Registro e monitoramento de Receitas e Despesas.
- **Dashboard Analítico:** Gráficos dinâmicos (Semanal, Mensal, Anual) para visualização de saúde financeira.
- **Sincronização Cloud:** Persistência em tempo real utilizando Supabase.

### 🤖 Inteligência Artificial (Gemini API)
- **Otimização de Itens:** Uso do modelo `gemini-3-flash-preview` para reescrever descrições de itens, tornando-as mais profissionais e formais automaticamente.

### 👥 Comunidade & Social
- **Feed Global:** Espaço para empreendedores compartilharem dicas, dúvidas e networking.
- **Integração WhatsApp:** Atalhos para suporte oficial e grupos de comunidade.

### 🛠️ Diferenciais Técnicos
- **PWA (Offline First):** Instalável no Android, iOS e Desktop com suporte a cache via Service Workers.
- **Multi-Moeda & Idioma:** Suporte total para MZN, AOA, BRL, USD, EUR e mais.
- **Arquivamento Nativo:** Integração com a *File System Access API* para salvar documentos automaticamente em pastas locais do computador.

## 🛠️ Stack Tecnológica

- **Frontend:** React 19 + TypeScript.
- **Estilização:** Tailwind CSS (com suporte a Dark Mode).
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage).
- **IA:** Google Generative AI (Gemini SDK).
- **PDF:** jsPDF & html2canvas.
- **PWA:** Service Workers e Manifest API.

## 📁 Estrutura de Pastas

```text
/
├── components/          # Componentes modulares (UI, Dash, Editor)
├── services/            # Lógica de negócio (API, Bluetooth, Storage)
├── types.ts             # Definições de tipos TypeScript
├── App.tsx              # Componente principal (Orquestrador)
├── index.tsx            # Ponto de entrada e Error Boundary
└── index.html           # Template base e Splash Screen
```

## ⚙️ Configuração

O projeto utiliza variáveis de ambiente para chaves sensíveis:
- `process.env.API_KEY`: Chave da API do Google Gemini.
- `supabaseUrl` & `supabaseAnonKey`: Configurações de acesso ao banco de dados (Injetadas via `supabaseClient.ts`).

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---
*Desenvolvido com foco em performance, estética e produtividade.*

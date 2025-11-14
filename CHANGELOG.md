# 📅 Changelog - VidaExtra

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.1.0] - 2025-11-14

### ✨ Adicionado

- **Integração Google Calendar**: Sincronização automática de eventos AC-4
- **Sistema de Notificações por E-mail**: Lembretes automáticos 24h, 1h e 30min antes dos eventos
- **Autenticação Google**: Login via Firebase Auth com OAuth2
- **Cloud Functions**: Backend serverless para Calendar API e envio de e-mails
- **Aba de Lembretes**: Visualização de próximos eventos com configurações
- **Dev Server**: Servidor de desenvolvimento com mock de API para testes locais
- **API Helper**: Sistema de fallback entre emulator local e produção

### 🔧 Modificado

- **Service Worker**: Desabilitado durante desenvolvimento
- **Formatação de Datas**: Suporte para objetos `{dateTime}` da Google Calendar API
- **Navegação**: Uso de `window.location.replace()` para evitar problemas de cache
- **UI**: Adicionado botão de logout e informações do usuário no header

### 🐛 Corrigido

- **Formatação de datas NaN** em lembretes (suporte a formato Google Calendar)
- **CORS errors** durante desenvolvimento (resolvido com proxy local)
- **Service Worker** interferindo com navegação
- **Cache** persistente após mudanças (script de unregister automático)

### 📚 Documentação

- Guia completo de configuração Google Cloud OAuth
- Instruções de deploy Firebase
- Documentação de API endpoints
- Troubleshooting e FAQ

---

## [1.0.0] - 2024-11

### ✨ Recursos Principais

#### 🎨 Interface e UX

- PWA completa e instalável
- Design responsivo com Bootstrap 5 e Tailwind CSS 4
- Sistema de abas (Calcular, Histórico, Lembretes)
- Calendário visual com FullCalendar
- Feedback sonoro para ações

#### 📊 Funcionalidades de Cálculo

- Cálculo automático de horas extras AC-4
- Valores diferenciados por dia da semana
- Suporte a pensão alimentícia
- Histórico completo com edição e remoção
- Exportação em PDF

#### 🔧 Técnico

- ESLint 9 com flat config
- PostCSS + Autoprefixer
- Service Worker para cache offline
- LocalStorage para persistência

---

## Formato

O formato deste changelog é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

**Categorias:**

- `✨ Adicionado` - Novos recursos
- `🔧 Modificado` - Mudanças em recursos existentes
- `❌ Removido` - Recursos removidos
- `🐛 Corrigido` - Correções de bugs
- `🔒 Segurança` - Correções de vulnerabilidades
- `📚 Documentação` - Mudanças na documentação

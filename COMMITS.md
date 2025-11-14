# 📋 Commits Sugeridos - Integração Google Calendar

Execute os seguintes comandos para commitar as alterações de forma organizada:

## 1️⃣ Estrutura e Configuração

```powershell
git add firebase.json firestore.rules firestore.indexes.json .env.example .gitignore
git commit -m "feat(config): add Firebase configuration files and security rules

- Add firebase.json for hosting, functions and firestore
- Add firestore.rules with user data protection
- Add firestore.indexes.json for query optimization
- Add .env.example template for environment variables
- Update .gitignore to exclude sensitive files"
```

## 2️⃣ Página de Login

```powershell
git add pages/login.html src/login.css src/login.js src/firebase-config.js
git commit -m "feat(auth): add Google Sign-In page with Calendar scope

- Create login.html with operador.jpg logo
- Implement Google OAuth with Calendar API permissions
- Add Firebase authentication integration
- Create responsive login UI with Tailwind/Bootstrap
- Handle authentication state and redirects"
```

## 3️⃣ Sistema de Autenticação

```powershell
git add src/auth.js
git commit -m "feat(auth): implement authentication guard and logout

- Create auth.js with login verification
- Add automatic redirect for non-authenticated users
- Implement logout functionality
- Add user info display in header
- Handle ID token generation for API calls"
```

## 4️⃣ Firebase Functions - Backend

```powershell
git add functions/package.json functions/index.js functions/googleClient.js functions/mail.js functions/.env functions/.gitignore
git commit -m "feat(api): add functions to store oauth tokens and schedule reminders

- Create registerCredentials endpoint for OAuth token storage
- Implement getUpcomingEvents to fetch Google Calendar events
- Add updateNotifySettings for notification preferences
- Create checkReminders scheduled job (runs every 5 minutes)
- Implement OAuth2 refresh token flow
- Add Google Calendar API integration
- Create email service with Nodemailer and HTML templates"
```

## 5️⃣ Sistema de Lembretes (Frontend)

```powershell
git add src/reminders.js
git commit -m "feat(reminders): add reminders management and UI

- Create reminders.js for event fetching and display
- Implement upcoming events visualization
- Add notification settings toggle
- Create reminder cards with event details
- Calculate time until events
- Add manual refresh functionality"
```

## 6️⃣ Atualização do Index.html

```powershell
git add index.html
git commit -m "feat(ui): add reminders tab and logout button

- Add new 'Lembretes' tab to navigation
- Implement logout button in header
- Add user info display section
- Update tab switching to include reminders
- Integrate auth checking on page load
- Add notification settings controls
- Load reminders dynamically when tab is opened"
```

## 7️⃣ Documentação

```powershell
git add README.md SETUP.md
git commit -m "docs: add instructions for Google Cloud OAuth and env vars

- Add comprehensive Google Calendar integration section
- Document OAuth2 setup in Google Cloud Console
- Add Firebase deployment instructions
- Create SETUP.md with quick start guide
- Document API endpoints and Firestore structure
- Add troubleshooting section
- Include security best practices
- Add testing instructions"
```

---

## ✅ Verificação Final

Antes de commitar, verifique:

```powershell
# Ver status
git status

# Ver diff de um arquivo específico
git diff pages/login.html

# Ver todos os arquivos adicionados
git ls-files --others --exclude-standard
```

## 🚀 Push para o GitHub

Após todos os commits:

```powershell
git push origin main
```

---

## 📊 Resumo das Alterações

### Arquivos Novos Criados:

- `pages/login.html` - Página de autenticação
- `src/login.css` - Estilos do login
- `src/login.js` - Lógica de login Google
- `src/firebase-config.js` - Configuração Firebase
- `src/auth.js` - Guard de autenticação
- `src/reminders.js` - Gerenciamento de lembretes
- `functions/index.js` - Cloud Functions (backend)
- `functions/googleClient.js` - Cliente Google Calendar API
- `functions/mail.js` - Serviço de e-mail
- `functions/package.json` - Dependências das functions
- `functions/.env` - Variáveis de ambiente (NÃO COMMITAR!)
- `firebase.json` - Configuração Firebase
- `firestore.rules` - Regras de segurança
- `firestore.indexes.json` - Índices Firestore
- `.env.example` - Template de variáveis
- `SETUP.md` - Guia de configuração rápida

### Arquivos Modificados:

- `index.html` - Nova aba Lembretes + botão logout
- `README.md` - Seção completa sobre integração
- `.gitignore` - Proteção de arquivos sensíveis

### Total:

- **15 arquivos novos**
- **3 arquivos modificados**
- **~3500 linhas de código adicionadas**

---

**Desenvolvido por**: CB Antônio Rafael - 14ª CIPM
**Data**: Novembro 2025

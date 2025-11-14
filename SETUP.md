# 🚀 Setup Rápido - VidaExtra® Google Calendar Integration

## Passo a Passo Completo

### 1️⃣ Configurar Google Cloud Project

1. Acesse: https://console.cloud.google.com/
2. Crie/Selecione projeto: **vidaextra-8db27**
3. Habilite APIs:
   ```
   - Google Calendar API
   - Cloud Functions API
   - Cloud Scheduler API
   ```

### 2️⃣ Criar Credenciais OAuth2

1. **APIs & Services > Credentials > Create Credentials > OAuth client ID**
2. Configure:
   - **Type**: Web application
   - **Name**: VidaExtra Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5500
     https://vidaextra-8db27.web.app
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:5500/oauth2callback
     https://vidaextra-8db27.web.app/oauth2callback
     ```
3. **Copie**: Client ID e Client Secret

### 3️⃣ Configurar Firebase

```powershell
# Instalar Firebase CLI (se não tiver)
npm install -g firebase-tools

# Login
firebase login

# Deploy inicial
firebase deploy
```

### 4️⃣ Configurar Variáveis de Ambiente

**Arquivo**: `functions/.env`

```bash
FIREBASE_PROJECT_ID=vidaextra-8db27
OAUTH_CLIENT_ID=COLE_SEU_CLIENT_ID_AQUI
OAUTH_CLIENT_SECRET=COLE_SEU_CLIENT_SECRET_AQUI
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=rafasouzacruz@gmail.com
SMTP_PASS=jepaepndtyejgurg
NODE_ENV=production
APP_URL=https://vidaextra-8db27.web.app
```

### 5️⃣ Instalar Dependências

```powershell
# Raiz do projeto
npm install

# Functions
cd functions
npm install
cd ..
```

### 6️⃣ Deploy

```powershell
# Deploy completo
firebase deploy

# Ou componentes individuais:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
```

### 7️⃣ Configurar Cloud Scheduler

1. Acesse: https://console.cloud.google.com/cloudscheduler
2. A função `checkReminders` deve aparecer automaticamente
3. Verifique se está **habilitada** e rodando a cada 5 minutos

### 8️⃣ Testar

1. Acesse: https://vidaextra-8db27.web.app
2. Faça login com Google
3. Autorize acesso ao Calendar
4. Vá para aba "Lembretes"
5. Confira se eventos aparecem

---

## ✅ Checklist de Verificação

- [ ] Google Cloud Project criado
- [ ] Google Calendar API habilitada
- [ ] OAuth2 credentials criadas
- [ ] Firebase CLI instalado
- [ ] Arquivo `.env` configurado
- [ ] Dependências instaladas (`npm install`)
- [ ] Deploy realizado (`firebase deploy`)
- [ ] Cloud Scheduler ativo
- [ ] Login funcionando
- [ ] Eventos do Calendar aparecendo
- [ ] E-mails de teste sendo enviados

---

## 🧪 Testes

### Teste Manual de E-mail

```powershell
# Execute no Firebase Console > Functions
# Ou via curl:
curl -X GET "https://us-central1-vidaextra-8db27.cloudfunctions.net/testReminders" \
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN"
```

### Verificar Logs

```powershell
firebase functions:log
firebase functions:log --only checkReminders
```

---

## 🆘 Problemas Comuns

### Erro: "Unauthorized domain"

**Fix**: Firebase Console > Authentication > Settings > Authorized domains
Adicione: `vidaextra-8db27.web.app`

### Erro: "OAuth client ID not found"

**Fix**: Verifique se copiou corretamente o Client ID no arquivo `.env`

### Erro: "Failed to send email"

**Fix**:

1. Use senha de app do Gmail: https://myaccount.google.com/apppasswords
2. Atualize `SMTP_PASS` no `.env`

### Lembretes não enviam

**Fix**:

1. Verifique Cloud Scheduler está ativo
2. Confira logs: `firebase functions:log`
3. Execute teste manual

---

## 📞 Suporte

- **Desenvolvedor**: CB Antônio Rafael
- **GitHub**: https://github.com/Ald3b4r4n/VidaExtra
- **E-mail**: rafasouzacruz@gmail.com

---

**Última atualização**: Novembro 2025

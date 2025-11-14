# 🧪 Guia de Testes Locais - VidaExtra® AC-4

Este guia fornece instruções passo a passo para testar localmente as funcionalidades de e-mail e Google Calendar **ANTES** de fazer deploy na Vercel.

---

## 📋 Pré-requisitos

### 1. Node.js e npm

```powershell
node --version  # v18 ou superior
npm --version   # v9 ou superior
```

### 2. Dependências instaladas

```powershell
npm install
```

### 3. Credenciais necessárias

#### 🔥 Firebase Service Account

1. Acesse: [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. **Configurações** (⚙️) → **Configurações do projeto**
4. Aba **Contas de serviço**
5. Clique em **Gerar nova chave privada**
6. Salve o arquivo JSON (NÃO faça commit!)

#### 🔐 Google OAuth2

1. Acesse: [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs e Serviços** → **Credenciais**
3. Localize seu **ID do cliente OAuth 2.0**
4. Copie `Client ID` e `Client Secret`

#### 📧 Gmail App Password

1. Acesse: [Conta Google](https://myaccount.google.com/)
2. **Segurança** → Ative **Verificação em duas etapas**
3. **Segurança** → **Senhas de app**
4. Gere senha para "Outro (nome personalizado)" → "VidaExtra"
5. Copie a senha de 16 caracteres (sem espaços)

---

## ⚙️ Configuração

### 1. Criar arquivo de ambiente local

```powershell
# Copiar template
Copy-Item .env.local.example .env.local
```

### 2. Preencher .env.local

Abra `.env.local` e preencha:

```env
# Firebase Service Account (JSON em uma linha)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"seu-projeto"...}

# Google OAuth2
OAUTH_CLIENT_ID=123456-abcdef.apps.googleusercontent.com
OAUTH_CLIENT_SECRET=GOCSPX-abc123xyz
OAUTH_REDIRECT_URI=http://localhost:5500/pages/redirect.html

# Gmail SMTP
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=seu-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # Senha de app de 16 caracteres

# URL do app
APP_URL=http://localhost:5500

# (Opcional) UID do usuário para testes
TEST_USER_ID=abc123xyz...
```

**⚠️ IMPORTANTE:**

- `FIREBASE_SERVICE_ACCOUNT` deve ser o JSON **TODO em uma linha**
- `SMTP_PASS` é a **senha de app**, não sua senha do Gmail
- Nunca faça commit de `.env.local` (já está no `.gitignore`)

---

## 🧪 Testes

### 🎯 Teste 1: E-mail com Template Final

Envia um e-mail de lembrete de evento AC-4 com o template HTML completo.

```powershell
node test-reminder-email.js
```

**O que verifica:**

- ✅ Conexão SMTP (Gmail)
- ✅ Template HTML renderiza corretamente
- ✅ Dados do evento aparecem formatados
- ✅ Links funcionam (Google Calendar, VidaExtra)
- ✅ Branding e estilo visual corretos

**Resultado esperado:**

```
🚀 Enviando e-mail de teste...

📧 De: "VidaExtra® AC-4" <seu-email@gmail.com>
📬 Para: seu-email@gmail.com
📋 Assunto: 🔔 Lembrete: AC-4 17:00 às 00:00 em 24 horas

✅ E-mail enviado com sucesso!
📨 Message ID: <abc123@gmail.com>
📊 Response: 250 2.0.0 OK

💡 Verifique sua caixa de entrada (pode estar no spam)!
```

**Verificações manuais:**

1. Abra sua caixa de entrada (Gmail)
2. Verifique se o e-mail chegou (olhe também no spam)
3. Confirme que o HTML está renderizado corretamente
4. Clique nos links para testar

---

### 🎯 Teste 2: Criação de Evento no Google Calendar

Cria um evento **REAL** no seu Google Calendar via API.

#### Passo 1: Obter UID do usuário

**Opção A: Firebase Console**

1. [Firebase Console](https://console.firebase.google.com/) → Authentication
2. Localize o usuário (seu e-mail)
3. Copie o **User UID** (algo como `abc123xyz...`)

**Opção B: Via código**

```javascript
// No console do navegador após login:
firebase.auth().currentUser.uid;
```

#### Passo 2: Executar teste

```powershell
# Com UID como argumento
node test-calendar-event.js <USER_ID>

# Ou defina TEST_USER_ID no .env.local
node test-calendar-event.js
```

**O que verifica:**

- ✅ Busca credenciais do Firestore
- ✅ Atualiza access token com refresh token
- ✅ Cria evento no Google Calendar
- ✅ Define lembretes (24h, 1h, 30min)
- ✅ Define cor e local do evento

**Resultado esperado:**

```
═══════════════════════════════════════════════════
🧪 TESTE: Criação de Evento no Google Calendar
═══════════════════════════════════════════════════
🔑 User ID: abc123xyz...

🔍 Buscando credenciais do usuário...
✅ Usuário encontrado: seu-email@gmail.com
🔄 Atualizando access token...
✅ Access token atualizado

📝 Dados do evento:
   Título: AC-4 17:00 às 00:00 - TESTE VidaExtra®
   Início: 15/01/2025 20:00:00
   Fim: 16/01/2025 03:00:00
   Local: 14ª CIPM - Batalhão Noroeste, Salvador, BA
   Lembretes: 24h (email), 1h (email), 30min (popup)

🚀 Criando evento no Google Calendar...

✅ EVENTO CRIADO COM SUCESSO!

📊 Detalhes do evento:
   ID: abc123xyz
   Status: confirmed
   Link: https://calendar.google.com/calendar/event?eid=...
   Criado em: 13/01/2025 18:30:00

💡 Ações:
   1. Acesse: https://calendar.google.com/calendar/event?eid=...
   2. Verifique se o evento aparece no Google Calendar
   3. Confirme que os lembretes estão configurados
   4. Teste as notificações do Google

═══════════════════════════════════════════════════
✅ TESTE CONCLUÍDO COM SUCESSO!
═══════════════════════════════════════════════════
```

**Verificações manuais:**

1. Acesse [Google Calendar](https://calendar.google.com/)
2. Localize o evento criado (deve estar vermelho)
3. Abra o evento e verifique:
   - ✅ Título: "AC-4 17:00 às 00:00 - TESTE VidaExtra®"
   - ✅ Local: "14ª CIPM - Batalhão Noroeste, Salvador, BA"
   - ✅ Descrição com detalhes do AC-4
   - ✅ Lembretes configurados: 24h, 1h, 30min
4. Aguarde os lembretes do Google (e-mails + notificações)

---

### 🎯 Teste 3: Vercel Functions Localmente (AVANÇADO)

Testa os endpoints serverless em ambiente local que simula a Vercel.

#### Instalação do Vercel CLI

```powershell
npm install -g vercel
```

#### Executar servidor local

```powershell
vercel dev
```

**Resultado esperado:**

```
Vercel CLI 33.0.0
> Ready! Available at http://localhost:3000
```

#### Testar endpoints

**Ping (Health Check):**

```powershell
curl http://localhost:3000/api/ping
# Resposta: {"status":"ok","timestamp":"..."}
```

**Criar Evento (requer autenticação):**

```powershell
# No app rodando em http://localhost:5500:
# 1. Faça login
# 2. Crie um cálculo
# 3. Clique em "Adicionar à Google Agenda"
# 4. Verifique no console se o evento foi criado
```

---

## ❌ Solução de Problemas

### Erro: "Invalid login"

**Causa:** Senha de app incorreta ou autenticação 2FA não ativada.

**Solução:**

1. Confirme que ativou autenticação de 2 fatores no Gmail
2. Gere nova senha de app
3. Use a senha de 16 caracteres (sem espaços) no `.env.local`

### Erro: "User not found in Firestore"

**Causa:** UID do usuário incorreto ou usuário não fez login com Google.

**Solução:**

1. Verifique o UID no Firebase Console → Authentication
2. Certifique-se que o usuário fez login pelo menos uma vez
3. Confira que `registerCredentials` foi chamado após login

### Erro: "Failed to refresh access token"

**Causa:** OAuth Client ID/Secret incorretos ou refresh token expirado.

**Solução:**

1. Verifique `OAUTH_CLIENT_ID` e `OAUTH_CLIENT_SECRET` no `.env.local`
2. Confira que são do mesmo projeto OAuth no Google Cloud Console
3. Se necessário, faça logout e login novamente para obter novo refresh token

### Erro: "ECONNREFUSED" ao enviar e-mail

**Causa:** Porta ou host SMTP incorretos.

**Solução:**

1. Confirme: `SMTP_HOST=smtp.gmail.com` e `SMTP_PORT=465`
2. Verifique que `SMTP_SECURE=true`
3. Teste conectividade: `Test-NetConnection smtp.gmail.com -Port 465`

### E-mail não chega

**Possíveis causas:**

1. Está na pasta de spam
2. Filtro de e-mail bloqueou
3. Demora de alguns minutos para processar

**Solução:**

1. Verifique pasta de spam/lixo eletrônico
2. Adicione seu e-mail aos contatos
3. Aguarde 2-3 minutos e recarregue a caixa de entrada

---

## ✅ Checklist Pré-Deploy

Antes de fazer deploy na Vercel, confirme:

- [ ] ✅ Teste 1 passou (e-mail enviado e recebido)
- [ ] ✅ Teste 2 passou (evento criado no Google Calendar)
- [ ] ✅ E-mail HTML está perfeito (sem quebras de layout)
- [ ] ✅ Evento no Calendar tem todos os dados corretos
- [ ] ✅ Lembretes do Google estão configurados (24h, 1h, 30min)
- [ ] ✅ Links do e-mail funcionam corretamente
- [ ] ✅ `.env.local` **NÃO** está no Git (verificar `.gitignore`)
- [ ] ✅ Credenciais validadas e seguras

---

## 🚀 Próximo Passo: Deploy na Vercel

Quando todos os testes locais passarem:

```powershell
# 1. Fazer login na Vercel
vercel login

# 2. Deploy
vercel --prod

# 3. Configurar Environment Variables no dashboard:
# https://vercel.com/seu-usuario/seu-projeto/settings/environment-variables
```

**Variáveis necessárias na Vercel:**

- `FIREBASE_SERVICE_ACCOUNT`
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`
- `OAUTH_REDIRECT_URI` (use URL de produção!)
- `SMTP_USER`
- `SMTP_PASS`
- `APP_URL` (use URL de produção!)

---

## 📞 Suporte

**Desenvolvido por:** CB Antônio Rafael - 14ª CIPM  
**Projeto:** VidaExtra® - Calculadora AC-4  
**Versão:** 1.1.0

---

**⚠️ LEMBRETE DE SEGURANÇA:**

- NUNCA faça commit de `.env.local`
- NUNCA compartilhe senhas de app
- SEMPRE use senhas de app, não senhas reais
- REVOGUE credenciais se forem expostas

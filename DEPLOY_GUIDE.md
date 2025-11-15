# 🚀 GUIA DE DEPLOY PARA PRODUÇÃO

## ✅ CHECKLIST PRÉ-DEPLOY

### 1. Verificações de Segurança

- [x] `.env.local` está no `.gitignore`
- [x] `.env.local` nunca foi commitado (verificado com `git log`)
- [x] Credenciais removidas dos arquivos de código
- [x] Firebase config agora usa endpoint `/api/firebase-config`
- [x] OAuth Client ID agora usa endpoint `/api/oauth-client-id`
- [x] `VERCEL_ENV_VARS.txt` criado (não será commitado)

### 2. Arquivos Modificados

- ✅ `src/firebase-config.js` - Busca config do endpoint
- ✅ `src/calendar-auth.js` - Busca Client ID do endpoint
- ✅ `api/firebase-config.js` - Novo endpoint (retorna Firebase config)
- ✅ `api/oauth-client-id.js` - Novo endpoint (retorna OAuth Client ID)
- ✅ `dev-server.js` - Adicionados endpoints locais
- ✅ `.gitignore` - Adicionado `VERCEL_ENV_VARS.txt`

---

## 📋 PASSO 1: CONFIGURAR VARIÁVEIS NO VERCEL

### 1.1 Acessar Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Entre no projeto **VidaExtra**
3. Vá em: **Settings** → **Environment Variables**

### 1.2 Adicionar Variáveis (USE O ARQUIVO `VERCEL_ENV_VARS.txt`)

**IMPORTANTE:** Copie os valores EXATAMENTE como estão no arquivo `VERCEL_ENV_VARS.txt`

Para cada variável:

- Clique em **Add New**
- **Name**: Nome da variável (ex: `FIREBASE_SERVICE_ACCOUNT`)
- **Value**: Cole o valor do arquivo `VERCEL_ENV_VARS.txt`
- **Environments**: Marque **Production**, **Preview**, **Development**
- Clique **Save**

#### Lista de Variáveis (17 no total):

```
✅ FIREBASE_SERVICE_ACCOUNT (JSON completo)
✅ OAUTH_CLIENT_ID
✅ OAUTH_CLIENT_SECRET
✅ SMTP_HOST
✅ SMTP_PORT
✅ SMTP_SECURE
✅ SMTP_USER
✅ SMTP_PASS
✅ APP_URL
✅ FIREBASE_API_KEY
✅ FIREBASE_AUTH_DOMAIN
✅ FIREBASE_PROJECT_ID
✅ FIREBASE_STORAGE_BUCKET
✅ FIREBASE_MESSAGING_SENDER_ID
✅ FIREBASE_APP_ID
✅ FIREBASE_MEASUREMENT_ID
✅ CRON_SECRET
```

---

## 🔐 PASSO 2: CONFIGURAR FIREBASE AUTHORIZED DOMAINS

### 2.1 Adicionar Domínio de Produção

**SIM**, você PRECISA adicionar o domínio no Firebase!

1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto: **vidaextra-8db27**
3. Vá em: **Authentication** → **Settings** → **Authorized domains**
4. Clique em **Add domain**
5. Digite: `vida-extra.vercel.app`
6. Clique **Add**

**Domínios autorizados finais:**

- ✅ `localhost`
- ✅ `vidaextra-8db27.firebaseapp.com`
- ✅ `vida-extra.vercel.app` ← **NOVO**

---

## 🔑 PASSO 3: ATUALIZAR GOOGLE CLOUD CONSOLE (OAuth)

### 3.1 Adicionar Redirect URI de Produção

1. Acesse: https://console.cloud.google.com/
2. Selecione o projeto: **vidaextra-8db27**
3. Vá em: **APIs & Services** → **Credentials**
4. Clique na credencial OAuth: `286306256976-hg93orc4eg18phng4gs68fcsrpmun2c4.apps.googleusercontent.com`
5. Em **Authorized redirect URIs**, clique **ADD URI**
6. Digite: `https://vida-extra.vercel.app/pages/oauth2callback.html`
7. Clique **Save**

**Redirect URIs finais:**

- ✅ `http://localhost:5500/pages/oauth2callback.html`
- ✅ `https://vida-extra.vercel.app/pages/oauth2callback.html` ← **NOVO**

---

## 🚀 PASSO 4: COMMIT E PUSH

### 4.1 Verificar Status

```bash
git status
```

### 4.2 Adicionar Arquivos Modificados

```bash
git add .
```

### 4.3 Commit

```bash
git commit -m "feat: migrar credenciais para variáveis de ambiente (segurança)"
```

### 4.4 Push para GitHub

```bash
git push origin main
```

**O que vai acontecer:**

1. GitHub recebe o push
2. Vercel detecta mudança automaticamente
3. Deploy começa (1-2 minutos)
4. App estará online em: `https://vida-extra.vercel.app/`

---

## ✅ PASSO 5: VERIFICAR DEPLOY

### 5.1 Verificar Build no Vercel

1. Acesse: https://vercel.com/dashboard
2. Entre no projeto **VidaExtra**
3. Vá em **Deployments**
4. Aguarde status: **Ready** ✅

### 5.2 Testar Aplicação

1. Abra: https://vida-extra.vercel.app/
2. Teste login com Google
3. Teste conexão com Google Calendar
4. Crie um evento de teste
5. Verifique se recebeu email de confirmação

### 5.3 Verificar Logs (se houver erro)

```bash
vercel logs https://vida-extra.vercel.app
```

Ou no Dashboard:

- Vercel → VidaExtra → **Logs**

---

## 🔧 TROUBLESHOOTING

### Erro: "Firebase configuration incomplete"

**Causa:** Variáveis de ambiente não configuradas no Vercel
**Solução:** Verifique que TODAS as 17 variáveis foram adicionadas (Passo 1.2)

### Erro: "OAuth configuration missing"

**Causa:** `OAUTH_CLIENT_ID` não está no Vercel
**Solução:** Adicione a variável `OAUTH_CLIENT_ID` nas Environment Variables

### Erro: "Redirect URI mismatch"

**Causa:** Redirect URI não foi adicionado no Google Cloud Console
**Solução:** Execute Passo 3.1 novamente

### Erro: "Domain not authorized"

**Causa:** Domínio não foi adicionado no Firebase
**Solução:** Execute Passo 2.1 novamente

### Erro: SMTP "Invalid login"

**Causa:** Senha de app do Gmail está incorreta
**Solução:**

1. Vá em: https://myaccount.google.com/apppasswords
2. Gere nova senha de app
3. Atualize `SMTP_PASS` no Vercel

---

## 📊 CRON JOB (Relatório Mensal)

O relatório mensal já está configurado no `vercel.json`:

```json
"crons": [
  {
    "path": "/api/sendMonthlyReport",
    "schedule": "0 0 1 * *"
  }
]
```

**Execução:** Todo dia 1 de cada mês às 00:00 UTC (21:00 BRT do dia anterior)

**Verificar execução:**

1. Vercel Dashboard → VidaExtra → **Cron Jobs**
2. Ver histórico de execução

---

## 🎯 PRÓXIMOS PASSOS APÓS DEPLOY

1. **Testar todas as funcionalidades:**

   - ✅ Login com Google
   - ✅ Conexão com Google Calendar
   - ✅ Criar evento
   - ✅ Receber emails (boas-vindas, confirmação)
   - ✅ Sincronização de eventos

2. **Monitorar logs:**

   - Vercel Dashboard → Logs
   - Verificar erros nas primeiras 24h

3. **Aguardar primeiro relatório mensal:**

   - Será enviado dia 1 do próximo mês
   - Verificar inbox: rafasouzacruz@gmail.com

4. **Divulgar aplicação:**
   - Compartilhar URL: https://vida-extra.vercel.app/
   - Testar com usuários reais

---

## 📝 OBSERVAÇÕES IMPORTANTES

1. **Segurança:**

   - ✅ Credenciais agora são variáveis de ambiente
   - ✅ `.env.local` nunca será commitado
   - ✅ Firebase config vem de endpoint seguro
   - ✅ OAuth Client ID vem de endpoint seguro

2. **Desenvolvimento Local:**

   - Continuar usando `.env.local` localmente
   - Executar: `npm run dev`
   - Dev server já tem os novos endpoints

3. **Backup de Credenciais:**
   - Mantenha `VERCEL_ENV_VARS.txt` em local seguro
   - NÃO commitar esse arquivo (já está no .gitignore)
   - Use para reconfigurar ambiente se necessário

---

## ✅ RESUMO FINAL

**Antes do Push:**

- [x] Variáveis configuradas no Vercel (17 variáveis)
- [x] Firebase domain adicionado (`vida-extra.vercel.app`)
- [x] OAuth redirect URI adicionado (Google Cloud Console)

**Após o Push:**

- [ ] Verificar build no Vercel
- [ ] Testar login
- [ ] Testar criação de evento
- [ ] Testar emails
- [ ] Monitorar logs

**Status:** ✅ PRONTO PARA PUSH!

---

## 🆘 SUPORTE

Caso encontre problemas:

1. Verificar logs no Vercel Dashboard
2. Verificar todas as variáveis de ambiente
3. Verificar Firebase Authorized Domains
4. Verificar Google Cloud OAuth Redirect URIs

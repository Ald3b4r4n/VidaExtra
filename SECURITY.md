# 🔒 Guia de Segurança - VidaExtra

## ⚠️ CREDENCIAIS SENSÍVEIS - NUNCA COMMITTAR!

### Arquivos que NUNCA devem ser commitados:

- ❌ `.env`
- ❌ `functions/.env`
- ❌ Qualquer arquivo com `*-key.json`
- ❌ `service-account-key.json`
- ❌ Arquivos com senhas, tokens ou chaves privadas

### ✅ Arquivos seguros para commitar:

- ✅ `.env.example` (apenas com placeholders)
- ✅ `firebase.json` (configuração pública)
- ✅ Código fonte (sem credenciais hardcoded)

---

## 🛡️ Proteções Implementadas

### 1. `.gitignore` - Bloqueia arquivos sensíveis

```gitignore
# Nunca commitar:
.env
.env.local
functions/.env
**/*-key.json
**/*-credentials.json
```

### 2. Arquivos de Template

- `.env.example` - Template SEM valores reais
- Sempre use placeholders:
  - `your-email@gmail.com`
  - `your-app-password-here`
  - `your-client-id.apps.googleusercontent.com`

---

## 🔑 Gerenciamento de Credenciais

### Desenvolvimento Local

1. **Copie o template:**

   ```powershell
   copy .env.example functions/.env
   ```

2. **Edite `functions/.env` com valores reais:**

   ```bash
   SMTP_USER=rafasouzacruz@gmail.com
   SMTP_PASS=jepaepndtyejgurg
   OAUTH_CLIENT_ID=seu-client-id-real
   OAUTH_CLIENT_SECRET=seu-secret-real
   ```

3. **NUNCA commite este arquivo!** (já está no `.gitignore`)

### Produção (Firebase/Google Cloud)

Use **Firebase Functions Config** ou **Secret Manager**:

```powershell
# Método 1: Firebase Functions Config (Deprecated)
firebase functions:config:set smtp.user="rafasouzacruz@gmail.com"
firebase functions:config:set smtp.pass="jepaepndtyejgurg"

# Método 2: Secret Manager (Recomendado)
# 1. Vá para: https://console.cloud.google.com/security/secret-manager
# 2. Crie secrets para cada credencial
# 3. Configure nas functions para ler de secrets
```

---

## 🚨 O que fazer se você commitou credenciais?

### Ação Imediata:

1. **REVOGAR as credenciais imediatamente!**

   - Gmail: Gere uma nova senha de app
   - OAuth: Regenere Client Secret no Google Cloud Console
   - Firebase: Regenere service account keys

2. **Limpar histórico do Git:**

   ```powershell
   # CUIDADO: Reescreve histórico!
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch functions/.env" \
     --prune-empty --tag-name-filter cat -- --all

   # Force push (avise o time antes!)
   git push origin --force --all
   ```

3. **Alternativa (se já foi público):**
   - Considere o repositório comprometido
   - Crie um novo repositório
   - Migre o código SEM histórico comprometido

---

## 📋 Checklist de Segurança

Antes de commitar, SEMPRE verifique:

- [ ] Nenhum arquivo `.env` está sendo commitado
- [ ] `.env.example` só tem placeholders
- [ ] Nenhuma senha hardcoded no código
- [ ] Nenhum token ou API key no código
- [ ] `.gitignore` está atualizado
- [ ] Rodou: `git status` para ver o que vai ser commitado

### Comando útil:

```powershell
# Ver o que será commitado
git diff --cached

# Procurar por possíveis credenciais
git grep -i "password\|secret\|key\|token" -- "*.js" "*.json" "*.env*"
```

---

## 🔐 Senhas de App do Gmail

Para SMTP com Gmail, use **Senhas de App** (mais seguro):

1. Acesse: https://myaccount.google.com/apppasswords
2. Crie uma senha de app para "Mail"
3. Use essa senha em `SMTP_PASS`

**NUNCA use sua senha real do Gmail!**

---

## 📚 Referências

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Secret Manager do Google Cloud](https://cloud.google.com/secret-manager)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

## ⚡ Boas Práticas

1. ✅ Use variáveis de ambiente para TUDO que é sensível
2. ✅ Mantenha `.env` sempre no `.gitignore`
3. ✅ Use Secret Manager em produção
4. ✅ Rotacione credenciais regularmente
5. ✅ Revise PRs procurando por credenciais expostas
6. ✅ Configure GitHub Secret Scanning (se usar GitHub)
7. ✅ Use 2FA em todas as contas de serviço

---

**Última atualização**: 14 de Novembro de 2025  
**Desenvolvedor**: CB Antônio Rafael - 14ª CIPM

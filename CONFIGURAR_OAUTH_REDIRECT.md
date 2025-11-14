# Configurar OAuth Redirect URI no Google Cloud Console

## ⚠️ IMPORTANTE: Configuração Obrigatória

Para que o fluxo OAuth funcione, você PRECISA adicionar o redirect URI no Google Cloud Console.

## Passo a Passo

### 1. Acessar Google Cloud Console

- Vá para: https://console.cloud.google.com/apis/credentials
- Certifique-se de estar no projeto correto

### 2. Editar OAuth Client ID

- Encontre o OAuth 2.0 Client ID: **286306256976-hg93orc4eg18phng4gs68fcsrpmun2c4.apps.googleusercontent.com**
- Clique para editar

### 3. Adicionar URIs de Redirecionamento Autorizados

#### Para Desenvolvimento Local:

```
http://localhost:5500/pages/oauth2callback.html
```

#### Para Produção (Vercel):

```
https://seu-app.vercel.app/pages/oauth2callback.html
```

**Exemplo se seu domínio for `vidaextra.vercel.app`:**

```
https://vidaextra.vercel.app/pages/oauth2callback.html
```

### 4. Salvar

Clique em **"Salvar"** no final da página.

## Testando o Fluxo OAuth

### Desenvolvimento Local:

1. **Inicie o servidor:**

   ```powershell
   npm run dev
   ```

2. **Acesse o app:**

   ```
   http://localhost:5500
   ```

3. **Faça login** com sua conta Google (Firebase Auth)

4. **Clique em "Conectar Google Calendar"**

   - Você será redirecionado para tela de consentimento do Google
   - Autorize o acesso ao Google Calendar
   - Será redirecionado de volta para o app

5. **Verifique no console:**
   ```javascript
   localStorage.getItem("googleAccessToken");
   ```
   - Deve retornar um token (não null)

### Após OAuth Completo:

6. **Teste a criação de eventos:**
   ```powershell
   node test-calendar-event.js
   ```
   - Agora deve funcionar! ✅

## Verificando Tokens no Firestore

1. **Acesse Firebase Console:**

   - https://console.firebase.google.com
   - Selecione seu projeto

2. **Vá para Firestore Database:**

   - Navegue: Firestore Database > Data
   - Coleção: `users`
   - Documento: `OtYUUQtqXDMLirjUHz9cZR87ays2` (seu User ID)

3. **Verifique os campos:**
   - ✅ `accessToken`: Token de acesso (expira em 1 hora)
   - ✅ `refreshToken`: Token de atualização (permanente)
   - ✅ `tokenExpiry`: Data de expiração
   - ✅ `email`: rafasouzacruz@gmail.com
   - ✅ `displayName`: Antonio Rafael Souza Cruz de Noronha

## Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa:** O redirect_uri não está cadastrado no Google Cloud Console

**Solução:**

1. Verifique a URL exata que aparece no erro
2. Adicione essa URL exata nos URIs autorizados
3. Aguarde 1-2 minutos após salvar
4. Tente novamente

### Erro: "access_denied"

**Causa:** Usuário cancelou a autorização

**Solução:**

- Clique novamente em "Conectar Google Calendar"
- Autorize todas as permissões solicitadas

### Botão "Conectar Google Calendar" não aparece

**Causa:** Calendário já está conectado

**Verificação:**

```javascript
// No console do navegador
localStorage.getItem("googleAccessToken");
```

**Para reconectar:**

```javascript
// Remover token antigo
localStorage.removeItem("googleAccessToken");
// Recarregar página
location.reload();
```

## URLs Completas para Diferentes Ambientes

### Desenvolvimento:

```
Local: http://localhost:5500/pages/oauth2callback.html
```

### Produção:

```
Vercel: https://[seu-projeto].vercel.app/pages/oauth2callback.html
GitHub Pages: https://[seu-usuario].github.io/[repositorio]/pages/oauth2callback.html
```

## Próximos Passos

1. ✅ Adicionar redirect URI no Google Cloud Console
2. ✅ Testar fluxo OAuth no localhost
3. ✅ Verificar tokens no Firestore
4. ✅ Executar `node test-calendar-event.js`
5. ✅ Criar evento de teste pelo app
6. ✅ Verificar evento no Google Calendar
7. ✅ Deploy no Vercel com redirect URI de produção

## Notas Importantes

- **Cada ambiente (local/produção) precisa de seu próprio redirect URI cadastrado**
- **Tokens de acesso expiram em 1 hora, mas refresh tokens são permanentes**
- **O fluxo OAuth solicita `access_type: offline` para obter refresh_token**
- **O `prompt: consent` força a tela de consentimento mesmo em autorizações subsequentes**

---

**Dúvidas?** Verifique o console do navegador (F12) para mensagens de erro detalhadas.

# 📧 Sistema de Emails Nodemailer + Google Calendar

## Arquitetura Híbrida

O VidaExtra® utiliza uma **combinação inteligente** de dois sistemas de email:

### 1️⃣ **Google Calendar API** (Lembretes Agendados)

- ✅ **Lembretes automáticos** dos eventos (24h, 1h, 30min, 15min)
- ✅ **Zero manutenção** - Google gerencia tudo
- ✅ **99.9% de confiabilidade** - Infraestrutura do Google
- ✅ **Escala automática** - Funciona para 10 ou 10.000 usuários

### 2️⃣ **Nodemailer** (Emails Imediatos)

- ✅ **Email de boas-vindas** quando usuário se registra
- ✅ **Email de confirmação** após criar evento
- ✅ **Relatório mensal** de horas trabalhadas
- ✅ **Totalmente personalizável** - Design VidaExtra®
- ✅ **Botão PIX** em todos os emails para doações

---

## 📨 Quando os Emails São Enviados

### **Email de Boas-Vindas** (`/api/sendWelcomeEmail`)

**Disparado:** Primeira vez que usuário faz login  
**Quem dispara:** `src/auth.js` (função `checkAuth`)  
**Quando:** Imediatamente após autenticação via Google  
**Conteúdo:**

- Mensagem de boas-vindas personalizada
- Lista de funcionalidades do VidaExtra®
- Dicas para começar
- Botão "Começar Agora"
- **Botão PIX para doações** ☕

**Exemplo de trigger:**

```javascript
// src/auth.js - linha ~18
if (isNewUser) {
  await fetch("/api/sendWelcomeEmail", {
    method: "POST",
    body: JSON.stringify({
      userName: user.displayName,
      userEmail: user.email,
    }),
  });
  localStorage.setItem("vidaextra-welcome-sent", "true");
}
```

---

### **Email de Confirmação de Evento** (`/api/sendEventConfirmation`)

**Disparado:** Imediatamente após criar evento no Google Calendar  
**Quem dispara:** `app.js` (após `createCalendarEvent` ter sucesso)  
**Quando:** Assim que evento é salvo no Google Calendar  
**Conteúdo:**

- Confirmação visual (badge verde ✅)
- Detalhes completos do evento (data, hora, descrição)
- Informações sobre lembretes (24h, 1h, 30min, 15min)
- Botão "Abrir no Google Calendar"
- **Botão PIX para doações** ☕

**Exemplo de trigger:**

```javascript
// app.js - linha ~623
.then((res) => {
  // Evento criado com sucesso
  fetch("/api/sendEventConfirmation", {
    method: "POST",
    body: JSON.stringify({
      userName: user.displayName,
      userEmail: user.email,
      event: res.event, // Dados do evento criado
    }),
  });
})
```

---

### **Relatório Mensal** (`/api/sendMonthlyReport`)

**Disparado:** **Automaticamente todo dia 1 de cada mês às 00:00 UTC**  
**Quem dispara:** **Vercel Cron Job** (configurado em `vercel.json`)  
**Quando:** Primeiro dia do mês (meia-noite)  
**Conteúdo:**

- Resumo do mês anterior (total de eventos, horas, valores)
- Cards visuais com estatísticas coloridas
- Tabela detalhada de todos os eventos do mês
- Botão "Ver Histórico Completo"
- **Botão PIX para doações** ☕

**Configuração do Cron:**

```json
// vercel.json
"crons": [
  {
    "path": "/api/sendMonthlyReport",
    "schedule": "0 0 1 * *"  // Dia 1, 00:00 UTC
  }
]
```

**Como funciona:**

1. **Dia 1 às 00:00 UTC** - Vercel chama `/api/sendMonthlyReport`
2. **Busca todos os usuários** no Firestore
3. **Para cada usuário:**
   - Busca eventos do mês anterior em `users/{uid}/history`
   - Calcula totais (horas, valores bruto/líquido)
   - Gera email personalizado com estatísticas
   - Envia via Nodemailer
4. **Log de resultados:** Quantos emails enviados, erros (se houver)

---

## 🔒 Segurança do Cron Job

Para proteger o endpoint `/api/sendMonthlyReport` de chamadas não autorizadas:

### **Adicionar Secret no Vercel:**

1. Acesse **Vercel Dashboard** → Seu projeto
2. Vá em **Settings** → **Environment Variables**
3. Adicione:
   ```
   CRON_SECRET=sua-chave-secreta-aqui
   ```

### **O endpoint valida:**

```javascript
// api/sendMonthlyReport.js
const authHeader = req.headers.authorization;
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return res.status(401).json({ error: "Unauthorized" });
}
```

**Vercel Cron Jobs enviam automaticamente o header:**

```
Authorization: Bearer <CRON_SECRET>
```

---

## 📊 Estrutura de Dados para Relatórios

Para que o **relatório mensal** funcione, é necessário salvar os eventos no Firestore:

### **Estrutura sugerida:**

```
users/{userId}/history/{eventId}
  - summary: "AC-4 20:00 às 08:00"
  - inicio: "2025-11-15T20:00:00"
  - fim: "2025-11-16T08:00:00"
  - horas: 12.0
  - valorLiquido: 471.71
  - valorBruto: 600.00
  - createdAt: Timestamp(2025-11-15)
  - eventId: "djpnld4nq5hluv08nq2ko3mev0"
  - eventLink: "https://calendar.google.com/..."
```

### **Quando salvar no Firestore:**

Modifique `app.js` para salvar no Firestore após criar evento:

```javascript
// app.js - após createCalendarEvent
.then(async (res) => {
  // Salvar no localStorage (já existe)
  localStorage.setItem("historico", JSON.stringify(historicoAtual));

  // NOVO: Salvar no Firestore para relatórios
  const user = await import("./src/auth.js").then(m => m.getCurrentUser());
  if (user && res?.event?.id) {
    await fetch("/api/saveEventToHistory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        eventId: res.event.id,
        eventData: {
          summary: res.event.summary,
          inicio: res.event.start.dateTime,
          fim: res.event.end.dateTime,
          horas: parseFloat(totalHorasInput.value),
          valorLiquido: parseFloat(valorLiquidoSpan.textContent.replace(/[^\d,]/g, "").replace(",", ".")),
          valorBruto: parseFloat(valorBrutoSpan.textContent.replace(/[^\d,]/g, "").replace(",", ".")),
        },
      }),
    });
  }
})
```

---

## 🎨 Design dos Emails

Todos os emails seguem o **padrão VidaExtra®**:

### **Elementos visuais:**

- ✅ Header com gradiente roxo/roxo (#667eea → #764ba2)
- ✅ Badge de status (boas-vindas: amarelo, confirmação: verde, relatório: azul)
- ✅ Cards com estatísticas (relatório mensal)
- ✅ Botões de ação estilizados
- ✅ **Seção PIX com gradiente amarelo e botão Nubank verde**
- ✅ Footer com informações do desenvolvedor

### **Botão PIX** (em todos os emails):

```html
<a
  href="https://nubank.com.br/cobrar/1gmqg3/673733bd-2f6e-41a8-86a9-7a29d8e03f0f"
  style="background-color: #32bcad; color: #ffffff; padding: 14px 30px; 
          text-decoration: none; border-radius: 6px; display: inline-block; 
          font-weight: bold; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"
>
  💜 Pague-me um Café via PIX
</a>
```

---

## 🧪 Testar Localmente

### **Email de Boas-Vindas:**

1. Limpe o localStorage: `localStorage.removeItem("vidaextra-welcome-sent")`
2. Faça logout e login novamente
3. Email será enviado automaticamente

### **Email de Confirmação:**

1. Crie um evento AC-4 normalmente
2. Email será enviado assim que evento for criado

### **Relatório Mensal:**

Chame manualmente o endpoint:

```bash
curl -X POST http://localhost:5500/api/sendMonthlyReport \
  -H "Content-Type: application/json"
```

Ou teste direto na produção (após deploy):

```bash
curl -X POST https://seu-app.vercel.app/api/sendMonthlyReport \
  -H "Authorization: Bearer sua-chave-secreta"
```

---

## ✅ Vantagens dessa Arquitetura

| Aspecto            | Resultado                                               |
| ------------------ | ------------------------------------------------------- |
| **Confiabilidade** | Google Calendar (99.9%) + Vercel Serverless             |
| **Custo**          | Praticamente zero (Firestore free tier + SMTP gratuito) |
| **Manutenção**     | Mínima - Cron roda sozinho                              |
| **Escalabilidade** | Serverless escala automaticamente                       |
| **Personalização** | Total controle sobre design dos emails                  |
| **Monetização**    | Botão PIX em todos os emails ☕                         |

---

## 🚀 Próximos Passos (Deploy)

1. **Fazer deploy na Vercel**
2. **Adicionar CRON_SECRET** nas env vars
3. **Testar email de boas-vindas** com novo usuário
4. **Criar evento** e verificar email de confirmação
5. **Aguardar dia 1** para validar relatório mensal
6. **Implementar saveEventToHistory** para salvar no Firestore

---

Desenvolvido por **CB Antônio Rafael** - 14ª CIPM  
VidaExtra® - Calculadora AC-4 para Policiais Militares

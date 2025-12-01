# 🗑️ Limpeza Automática do MongoDB

## 📋 Visão Geral

O VidaExtra® implementa uma **limpeza automática mensal** dos dados antigos armazenados no MongoDB Atlas. Isso garante:

- ✅ Banco de dados otimizado e performático
- ✅ Controle de custos de armazenamento
- ✅ Conformidade com práticas de retenção de dados
- ✅ Manutenção zero - totalmente automático

---

## ⚙️ Como Funciona

### 📅 Agendamento

A função de limpeza roda **automaticamente** via **Vercel Cron Job**:

```json
{
  "path": "/api/cleanupOldData",
  "schedule": "0 3 1 * *"
}
```

**Tradução:**

- **Dia:** 1º de cada mês
- **Horário:** 03:00 (3h da manhã, horário UTC)
- **Frequência:** Mensal

> **Por que 03:00?** Para evitar conflito com o relatório mensal que roda às 00:00

---

## 🔧 Política de Retenção

### Dados Mantidos

- **Período:** Últimos **24 meses** (2 anos)
- **Coleção:** `userShifts`
- **Formato dos documentos:**
  ```javascript
  {
    _id: "email@exemplo.com_2025-12",
    uid: "firebase-uid",
    email: "email@exemplo.com",
    year: 2025,
    month: 12,
    shifts: [...],
    totals: {...},
    updatedAt: Date
  }
  ```

### Dados Deletados

Documentos com **mais de 24 meses** são **permanentemente removidos**.

**Exemplo (em dezembro/2025):**

- ✅ Mantém: Janeiro/2024 até Dezembro/2025 (24 meses)
- ❌ Remove: Dezembro/2023 e anteriores

---

## 🔒 Segurança

### Autenticação Opcional

A função suporta **proteção por token secreto**:

```bash
# .env.local
CRON_SECRET=sua-chave-secreta-aleatoria
```

Se configurado, o cron precisa enviar o header:

```
Authorization: Bearer sua-chave-secreta-aleatoria
```

> **Nota:** O Vercel Cron injeta automaticamente esse header se você configurar nas variáveis de ambiente.

---

## 📊 Logs e Monitoramento

### Logs Esperados (Vercel Dashboard)

```
🗑️ Starting MongoDB cleanup...
📅 Cutoff date: 2023-12
✅ Cleanup complete: 15 documents deleted
```

### Resposta da API

**Sucesso (200):**

```json
{
  "success": true,
  "deletedCount": 15,
  "remainingCount": 120,
  "cutoffDate": "2023-12",
  "retentionMonths": 24,
  "timestamp": "2025-12-01T03:00:00.000Z"
}
```

**Erro (500):**

```json
{
  "error": "Cleanup failed",
  "message": "Descrição do erro"
}
```

---

## 🧪 Teste Manual

### Via cURL

```bash
curl -X POST https://vida-extra.vercel.app/api/cleanupOldData \
  -H "Authorization: Bearer sua-chave-secreta" \
  -H "Content-Type: application/json"
```

### Via Vercel Dashboard

1. Acesse: https://vercel.com/ald3b4r4n/vida-extra
2. Vá em: **Deployments** → **Último deploy** → **Functions**
3. Clique em: `/api/cleanupOldData`
4. Veja os logs da última execução

---

## ⚠️ Importante

### Backup Antes da Limpeza

**A exclusão é permanente!** Recomendações:

1. **MongoDB Atlas Backup:**

   - Ative backups automáticos no MongoDB Atlas
   - Eles mantêm snapshots por 2-7 dias (dependendo do plano)

2. **Exportação Manual (opcional):**
   ```bash
   mongodump --uri="mongodb+srv://..." --db=vidaextra --out=backup/
   ```

### Ajustar Período de Retenção

Para manter dados por **mais ou menos tempo**, edite:

```javascript
// api/cleanupOldData.js
const RETENTION_MONTHS = 24; // Altere aqui (12, 18, 24, 36, etc.)
```

---

## 📈 Estimativa de Espaço Economizado

### Cálculo Aproximado

- **1 usuário ativo** = ~12 documentos/ano
- **51 usuários** = ~612 documentos/ano
- **Tamanho médio por documento** = ~2-5 KB

**Após 3 anos (sem limpeza):**

- Total: ~1.836 documentos
- Espaço: ~5-10 MB

**Com limpeza (24 meses):**

- Total: ~1.224 documentos
- Espaço: ~3-6 MB
- **Economia:** ~30-40%

---

## 🛠️ Troubleshooting

### Cleanup não está rodando

**Verifique:**

1. **Cron configurado no `vercel.json`:**

   ```json
   "crons": [
     {
       "path": "/api/cleanupOldData",
       "schedule": "0 3 1 * *"
     }
   ]
   ```

2. **Deploy realizado:**

   - Crons só funcionam em **produção**
   - Faça deploy: `git push origin main`

3. **Logs da Vercel:**
   - Acesse: Dashboard → Logs → Filtrar por `/api/cleanupOldData`

### Erro de conexão MongoDB

**Verifique:**

- `MONGODB_URI` configurado nas variáveis de ambiente
- IP da Vercel permitido no MongoDB Atlas
- Credenciais corretas

### Deletou dados errados

**Recuperação:**

1. Verifique backups do MongoDB Atlas
2. Restaure snapshot do dia anterior
3. Ajuste `RETENTION_MONTHS` para evitar recorrência

---

## 📚 Referências

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [MongoDB deleteMany](https://www.mongodb.com/docs/manual/reference/method/db.collection.deleteMany/)
- [Cron Schedule Syntax](https://crontab.guru/)

---

## 📝 Changelog

### v1.0.0 (01/12/2025)

- ✨ Implementação inicial
- 🔒 Suporte a `CRON_SECRET`
- 📅 Retenção de 24 meses
- 🗓️ Execução mensal (dia 1 às 03:00 UTC)
- 📊 Logs detalhados

---

**Desenvolvido por:** CB Antônio Rafael - 14ª CIPM  
**Projeto:** VidaExtra® - Calculadora AC-4

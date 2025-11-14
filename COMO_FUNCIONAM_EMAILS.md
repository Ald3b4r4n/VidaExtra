# 📧 Como Funcionam os Lembretes por Email

## 🎯 Resumo Rápido

Os emails de lembrete são **enviados automaticamente pelo Google Calendar**, não pelo app VidaExtra.

---

## ⚙️ Como Funciona

### 1. Quando você cria um evento no VidaExtra:

O app cria um evento no **Google Calendar** com 3 lembretes configurados:

```javascript
reminders: {
  useDefault: false,
  overrides: [
    { method: "email", minutes: 24 * 60 },  // 📧 Email 24 horas antes
    { method: "email", minutes: 60 },       // 📧 Email 1 hora antes
    { method: "popup", minutes: 30 }        // 🔔 Popup 30 minutos antes
  ]
}
```

### 2. O Google Calendar assume o controle:

- ✅ **Google armazena** o evento nos servidores deles
- ✅ **Google agenda** os emails automaticamente
- ✅ **Google envia** os emails nos horários programados
- ✅ **Funciona mesmo com o app fechado** (porque está no Google Calendar)

### 3. Você recebe os emails:

Os emails chegam no endereço da sua conta Google:

- 📧 **rafasouzacruz@gmail.com**

---

## 📅 Exemplo Prático

**Evento criado:**

- Título: `AC-4 20:00 às 08:00`
- Data: `15/11/2025 às 20:00`

**Lembretes que você receberá:**

| Horário                 | Tipo     | O que acontece                                                  |
| ----------------------- | -------- | --------------------------------------------------------------- |
| **14/11/2025 às 20:00** | 📧 Email | Google envia "Lembrete: AC-4 20:00 às 08:00 em 24 horas"        |
| **15/11/2025 às 19:00** | 📧 Email | Google envia "Lembrete: AC-4 20:00 às 08:00 em 1 hora"          |
| **15/11/2025 às 19:30** | 🔔 Popup | Notificação no celular/navegador (se Google Calendar instalado) |

---

## ❓ Perguntas Frequentes

### Preciso deixar o app aberto para receber emails?

**NÃO!** ❌

Os emails são enviados pelo Google Calendar, que funciona 24/7 nos servidores do Google.

### Os emails chegam mesmo se eu desinstalar o app?

**SIM!** ✅

Porque o evento está salvo no Google Calendar. Você pode:

- Fechar o app
- Desligar o computador
- Desinstalar o app
- Os emails **continuarão chegando** nos horários programados

### Para onde vão os emails?

Para o email da sua conta Google: **rafasouzacruz@gmail.com**

### Posso ver os eventos no Google Calendar?

**SIM!** ✅

Acesse: https://calendar.google.com

Você verá todos os eventos criados pelo VidaExtra com o prefixo `AC-4`.

### Posso editar ou deletar eventos?

**SIM!** ✅

Você pode:

1. Abrir https://calendar.google.com
2. Clicar no evento
3. Editar horários, lembretes, ou deletar
4. As mudanças sincronizam automaticamente no VidaExtra

### Como desativar os emails?

Você tem 2 opções:

**Opção 1: Editar o evento no Google Calendar**

1. Acesse https://calendar.google.com
2. Clique no evento `AC-4`
3. Clique em "Editar evento"
4. Remova os lembretes de email
5. Salve

**Opção 2: Deletar o evento**

1. Acesse https://calendar.google.com
2. Clique no evento `AC-4`
3. Clique em "Deletar"

---

## 🔧 Configuração Atual

Cada evento criado tem:

### Lembretes de Email:

- ⏰ **24 horas antes** - Para você se preparar com antecedência
- ⏰ **1 hora antes** - Lembrete final antes do serviço

### Lembretes de Popup:

- ⏰ **30 minutos antes** - Notificação no celular/navegador

---

## 🎨 Personalizando Lembretes

Se quiser mudar os horários dos lembretes para eventos futuros, você pode:

1. Criar o evento no VidaExtra
2. Abrir no Google Calendar (https://calendar.google.com)
3. Editar os lembretes manualmente
4. Adicionar mais lembretes se quiser

**Exemplo de personalização:**

- 📧 Email 3 dias antes
- 📧 Email 12 horas antes
- 📧 Email 2 horas antes
- 🔔 Popup 15 minutos antes

---

## 🚀 Benefícios

### Vantagens de usar Google Calendar:

✅ **Confiabilidade** - Servidores do Google garantem entrega
✅ **Sincronização** - Eventos aparecem em todos os dispositivos
✅ **Lembretes automáticos** - Funciona sem intervenção
✅ **Integração** - Funciona com apps de calendário (Google Calendar, Outlook, etc.)
✅ **Backup** - Eventos salvos na nuvem
✅ **Mobilidade** - Acesse de qualquer lugar

---

## 📱 Acessando de Outros Dispositivos

Seus eventos AC-4 estão disponíveis em:

- 🌐 **Web**: https://calendar.google.com
- 📱 **Android**: App Google Calendar
- 🍎 **iOS**: App Google Calendar
- 💻 **Desktop**: Thunderbird, Outlook (sincronize com conta Google)

---

## ⚠️ Importante

- Os emails são enviados **automaticamente pelo Google**
- **Não há custo** para enviar emails (serviço do Google)
- **Não há limite** de eventos ou lembretes
- **Privacidade garantida** - Só você vê seus eventos

---

## 🆘 Troubleshooting

### Não recebi o email de lembrete

**Verifique:**

1. ✅ A caixa de **Spam/Lixo eletrônico**
2. ✅ Se o evento existe em https://calendar.google.com
3. ✅ Se os lembretes estão configurados no evento
4. ✅ Se o horário do lembrete já passou

### O evento não aparece no Google Calendar

**Verifique:**

1. ✅ Se você está logado com a conta correta (rafasouzacruz@gmail.com)
2. ✅ Se o evento foi criado (veja no console do navegador)
3. ✅ Recarregue a página do Google Calendar (F5)

### Recebi muitos emails duplicados

**Solução:**

1. Você criou o mesmo evento várias vezes
2. Delete os eventos duplicados em https://calendar.google.com

---

## 📊 Monitorando Lembretes

Para ver todos os seus eventos futuros com lembretes:

1. Abra o VidaExtra
2. Vá na aba **"Lembretes"**
3. Clique em **"Atualizar"**
4. Você verá todos os eventos do Google Calendar

---

**Dúvidas?** Todos os eventos estão em https://calendar.google.com 🗓️

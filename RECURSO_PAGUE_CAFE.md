# ☕ Pague-me um Café - Recurso de Doações

## 🎯 O que é?

Um botão no footer do app que permite aos usuários apoiarem o desenvolvimento do projeto VidaExtra® através de doações via PIX.

---

## 📍 Localização

- **Footer do app** (parte inferior)
- Botão: **"☕ Pague-me um café"** (amarelo/warning)
- Ao lado dos botões de contato e portfólio

---

## 🎨 Como funciona

### 1. Usuário clica no botão

- Abre um modal bonito e profissional
- Título: "Apoie o Projeto VidaExtra®"
- Ícone de coração animado ❤️

### 2. Modal exibe o código PIX

```
00020126580014BR.GOV.BCB.PIX0136b5baaa1b-8488-46ea-b22e-65a3c4b2e8925204000053039865802BR5925Antonio Rafael Souza Cruz6009SAO PAULO62140510tKFbsrxeJm6304B33A
```

### 3. Usuário copia o código

- **Clique no textarea** → Copia automaticamente
- **Clique no botão "Copiar Código PIX"** → Copia automaticamente

### 4. Feedback visual

- ✅ Botão muda para verde "Copiado!"
- 🔔 Toast do SweetAlert: "PIX Copiado!"
- ⏱️ Volta ao normal após 2 segundos

### 5. Usuário cola no banco

- Abre o app do banco
- Cola o código PIX
- Faz a doação

---

## 💳 Informações do PIX

**Titular:** Antonio Rafael Souza Cruz  
**Tipo:** PIX Copia e Cola  
**Cidade:** São Paulo  
**Chave:** b5baaa1b-8488-46ea-b22e-65a3c4b2e892

---

## 🎨 Design

### Cores

- **Botão:** Warning (amarelo) com ícone de café ☕
- **Modal Header:** Fundo amarelo com texto escuro
- **Textarea:** Borda tracejada amarela
- **Botão Copiar:** Amarelo → Verde quando copiado

### Efeitos

- ✨ Hover nos botões: Elevação com sombra
- 💓 Coração animado no modal
- 🎯 Transições suaves

### Responsivo

- 📱 Funciona perfeitamente em mobile
- 💻 Otimizado para desktop
- 📐 Font-size ajustado para telas pequenas

---

## 🔧 Arquivos criados/modificados

### index.html

- ✅ Botão no footer
- ✅ Modal completo
- ✅ Script de copiar PIX

### pix-cafe.css (novo)

- ✅ Estilos do modal
- ✅ Animações
- ✅ Responsividade

---

## 📊 Mensagens do Modal

**Título:**

> 🔐 Apoie o Projeto VidaExtra®

**Subtítulo:**

> Gostou do app? Ajude a mantê-lo vivo! ☕

**Descrição:**

> Suas doações ajudam a manter o projeto gratuito e com melhorias constantes. Qualquer valor é muito bem-vindo! 🙏

**Segurança:**

> 🛡️ Pagamento seguro via PIX

**Agradecimento:**

> 💙 Obrigado pelo apoio! Cada café faz diferença.

---

## ✨ Benefícios para o Dev

1. **Monetização opcional** - Usuários podem apoiar voluntariamente
2. **Não intrusivo** - Botão discreto no footer
3. **Profissional** - Design bonito e confiável
4. **Fácil de usar** - Um clique para copiar

---

## 🚀 Como usar (para usuários)

1. Role até o final da página
2. Clique em **"☕ Pague-me um café"**
3. Clique em **"Copiar Código PIX"** (ou clique direto no código)
4. Abra o app do seu banco
5. Cole o código PIX
6. Escolha o valor da doação
7. Confirme o pagamento

---

## 🎯 Call to Action

O modal usa gatilhos emocionais:

- ❤️ Coração animado
- ☕ Metáfora do café (pequeno gesto, grande impacto)
- 💙 Agradecimento sincero
- 🙏 Reconhecimento do apoio

---

## 📱 Compatibilidade

✅ Todos os navegadores modernos  
✅ Mobile (iOS/Android)  
✅ Desktop (Windows/Mac/Linux)  
✅ Clipboard API suportada

---

## ⚠️ Importante

- O PIX é válido permanentemente
- Não há valor mínimo ou máximo
- Totalmente seguro (PIX do Banco Central)
- Dados do titular aparecem no app do banco

---

## 🔮 Melhorias Futuras (Opcionais)

1. **QR Code** - Gerar QR Code do PIX para escanear
2. **Contador** - Mostrar quantos cafés já foram doados
3. **Mensagens** - Permitir que doadores deixem mensagens
4. **Metas** - Estabelecer metas de doação
5. **Agradecimentos** - Lista de apoiadores (com permissão)

---

## 🎉 Conclusão

O recurso "Pague-me um café" está pronto e funcionando!

É uma forma elegante e profissional de permitir que usuários apoiem o desenvolvimento do VidaExtra® sem forçar monetização.

**Cada café conta!** ☕💙

---

**Desenvolvido por:** CB Antônio Rafael - 14ª CIPM

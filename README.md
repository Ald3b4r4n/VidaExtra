# VidaExtra® – Calculadora AC-4

Aplicação PWA para cálculo de horas extras (AC-4), com histórico, exportação em PDF, suporte a desconto de pensão, e agora com Tailwind CSS e ESLint configurados para padronização visual e qualidade de código.

## Novidades recentes
- Calendário ajustado para experiência mais clara:
  - Eventos no mês aparecem como texto simples por dia (sem “barras” atravessando dias).
  - Borda aplicada no quadrado do dia quando há evento: azul para hoje, vermelha para dias futuros.
  - Rótulos PT‑BR: `mês`, `semana`, `hoje`.
  - Correção de renderização quando o calendário abre dentro da aba Histórico (recalcula tamanho ao mostrar a aba).
- Melhorias de CSS para evitar overflow do texto dentro do quadrado do dia.

## Recursos
- Formulário de dados do serviço com data e horários.
- Campo de anotações por operação, exibido no resultado, histórico e na exportação PDF.
- Cálculo automático de valores por dia da semana com base em `valores-ac4.json`.
- Opção de desconto de pensão (percentual configurável).
- Histórico com remoção e EDIÇÃO de itens (recalcula totais automaticamente).
- Ordenação por data crescente no histórico e PDF.
- Exportação para PDF com resumo, totais e anotações.
- PWA (Service Worker, Manifest) com instalação no dispositivo.
- Botões de contato (WhatsApp) e link para portfólio.

## Requisitos
- Node.js 16+ e npm.
- Git (para versionamento).

## Instalação e Setup
1. Instale dependências e inicialize projeto npm:
   - `npm init -y`
   - `npm install -D tailwindcss postcss autoprefixer eslint`
   - `npx tailwindcss init -p`

2. Estrutura Tailwind:
   - Crie `src/input.css` com:
     - `@tailwind base;`
     - `@tailwind components;`
     - `@tailwind utilities;`
   - Configure `tailwind.config.js` para escanear conteúdo:
     - `content: ['./index.html','./app.js']`
   - Gere CSS:
     - `npx tailwindcss -i ./src/input.css -o ./dist/tailwind.css --minify`

3. ESLint:
   - Crie `.eslintrc.json` (exemplo abaixo) e rode:
     - `npx eslint .`

## Scripts
- `npm run build:css` → Gera `dist/tailwind.css` minificado.
- `npm run dev:css` → Compila Tailwind em modo watch para desenvolvimento.
- `npm run lint` → Roda ESLint com flat config.
- `npm run serve` → Serve estático na porta `5500` (root do app).
- `npm start` → Alias para `serve`.

Observação: o build do CSS roda automaticamente após `npm install` via `postinstall`.

## Como usar
1. Inicie o servidor local: `npm start` (ou `npx serve -s -l 5500`).
   - Alternativa de prévia raiz: `npx serve -l 5173 .`
2. Acesse: `http://localhost:5500/` (ou URL indicada pelo servidor).
3. Preencha Data, Horas (início/fim), opcionalmente o percentual de pensão e Anotações.
4. Clique em “Calcular” para ver Resultado e adicionar ao Histórico.
5. No Histórico:
   - Botão lápis: edita o item (data, horários, pensão, anotações) e recalcula valores.
   - Botão X: remove o item e atualiza totais.
6. Use “Exportar PDF” para gerar um histórico completo com anotações e totais.

## Qualidade e Padrões
- ESLint configurado para ambiente browser ES2021 e `eslint:recommended`.
- Variáveis globais externas (Swal, html2pdf) marcadas como globais no ESLint.
- Responsividade garantida via Bootstrap e utilitários.
- Tailwind disponível para evoluir o visual com utilitários modernos.

## Configurações
### tailwind.config.js (exemplo)
```js
module.exports = {
  content: ['./index.html', './app.js'],
  theme: { extend: {} },
  plugins: [],
};
```

### .eslintrc.json (exemplo)
```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "globals": {
    "Swal": "readonly",
    "html2pdf": "readonly"
  },
  "rules": {
    "no-unused-vars": ["warn", {"args": "none"}],
    "no-console": "off"
  }
}
```

### .eslintignore
```
node_modules
dist
```

## PWA
- Service Worker (`sw.js`) com estratégia cache-first e atualização.
- Manifesto (`manifest.json`) configurado para instalação.

## Contribuindo
- Faça PRs focados, mantenha o padrão visual e qualidade de código.
- Não inclua builds (`dist`) nos PRs, apenas fontes.

## Licença
- Uso interno. Sem licença pública definida.
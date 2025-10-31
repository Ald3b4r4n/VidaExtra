const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  // Browser app files
  {
    ignores: ["node_modules", "dist"],
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        ...globals.browser,
        Swal: "readonly",
        html2pdf: "readonly",
        FullCalendar: "readonly",
        luxon: "readonly",
        bootstrap: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { args: "none" }],
      "no-console": "off",
      "no-empty": ["error", { allowEmptyCatch: true }]
    }
  },
  // Node config files
  {
    files: ["postcss.config.js", "tailwind.config.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: {
        ...globals.node
      }
    }
  },
  // Service worker
  {
    files: ["sw.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        ...globals.serviceworker
      }
    }
  }
];
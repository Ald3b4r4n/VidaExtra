module.exports = [
  {
    files: ["**/*.js"],
    ignores: [
      "node_modules/**",
      "functions/node_modules/**",
      "test-*.js",
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-async-promise-executor": "off",
      "no-useless-escape": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];

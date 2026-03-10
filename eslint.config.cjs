const { defineConfig } = require("eslint/config");
const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const path = require("path");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  // migrate common `extends` from eslintrc-style configs
  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ),
  // register typescript plugin only for now (skip react plugin to avoid compatibility issues)
  // register plugins used by the migrated configs
  ...compat.plugins("@typescript-eslint", "react-hooks"),
  // project-level overrides and parser settings
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: require("@typescript-eslint/parser"),
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: { React: "readonly" },
    },
    settings: { react: { version: "detect" } },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // allow explicit any as warning to reduce immediate errors (can be tightened later)
      "@typescript-eslint/no-explicit-any": "warn",
      // react hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
]);

const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: [".expo/**", "dist/**", "web-build/**", "node_modules/**"],
  },
  {
    files: ["data/**/*.js", "scripts/**/*.js", "tools/**/*.js"],
    languageOptions: { globals: globals.node },
  },
  {
    rules: { "import/no-named-as-default": "off" },
  },
]);

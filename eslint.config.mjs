import globals from "globals";
import pluginJs from "@eslint/js";
import { fixupPluginRules } from "@eslint/compat";
import pluginReact from "eslint-plugin-react";

export default [
  {
    ignores: [".next/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: {
      react: fixupPluginRules(pluginReact),
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: { ...globals.browser, ...globals.node },
    },
  },
  pluginJs.configs.recommended,
  {
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];

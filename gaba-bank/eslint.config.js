import js from "@eslint/js";
import globals from "globals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactDOM from "eslint-plugin-react-dom";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import reactX from "eslint-plugin-react-x";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import { fixupPluginRules } from "@eslint/compat";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "packages",
      ".vite",
      "src/contracts/*",
      "!src/contracts/util.ts",
    ],
  },
  js.configs.recommended,
  {
    files: ["jest.setup.js", "**/*.test.js", "**/*.test.ts", "**/*.test.tsx"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    plugins: {
      "jsx-a11y": jsxA11y,
      "react-dom": reactDOM,
      "react-hooks": fixupPluginRules(reactHooks),
      "react-refresh": reactRefresh,
      "react-x": reactX,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // JSX A11y rules
      ...jsxA11y.configs.recommended.rules,
      // React DOM rules
      ...reactDOM.configs.recommended.rules,
      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
      // React Refresh rules
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: [
            "useWallet",
            "useTheme",
            "toggleVariants",
            "schema",
            "badgeVariants",
            "buttonVariants",
            "navigationMenuTriggerStyle",
            "useFormField",
            "sidebarMenuButtonVariants",
          ],
        },
      ],
      // React X rules
      "react-x/no-array-index-key": "warn",
      "react-x/no-unstable-context-value": "warn",
      // React DOM specific rules
      "react-dom/no-missing-button-type": "warn",
      "react-dom/no-dangerously-set-innerhtml": "warn",
      // Disable overly strict rules for UI component files
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "no-useless-catch": "off",
    },
  },
  prettier,
);

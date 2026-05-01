import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

const config = [
  {
    ignores: ["_legacy/**", ".next/**", "node_modules/**", "next-env.d.ts", "public/**"],
  },
  ...nextCoreWebVitals,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      // Catch the patterns that made the codebase drift in the first place.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // No more `any`. The codebase already has zero — keep it that way.
      "@typescript-eslint/no-explicit-any": "error",

      // Force underscore prefix for intentionally-unused vars (replaces `void x;` pattern).
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Prefer console.warn/error/info over console.log in shipping code.
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],

      // The empty catch / `console.log(e)` swallow pattern flagged in the audit.
      "no-empty": ["error", { allowEmptyCatch: false }],
    },
  },
];

export default config;

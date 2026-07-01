import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const staffBoundaryRule = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: ["@/components/public/*", "@/components/public"],
          message: "Staff code must not import public components",
        },
        {
          group: ["@/components/layout/public-shell"],
          message: "Use AppShell for staff chrome",
        },
      ],
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      ...jsxA11y.configs.recommended.rules,
      // New in react-hooks v6 / Next 16 — flags common data-fetch and dialog-reset
      // patterns used across staff UI; revisit incrementally rather than block CI.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
    },
  },
  {
    files: [
      "src/components/staff/**/*",
      "src/lib/staff/**/*",
      "src/app/**/dashboard/**/*",
      "src/app/**/auth/**/*",
    ],
    rules: staffBoundaryRule,
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

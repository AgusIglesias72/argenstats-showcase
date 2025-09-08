import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Config base de Next + TS
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Ignorados globales
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "lib/generated/**",
    ],
  },

  // Reglas personalizadas globales
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },


  // Bajar react/no-unescaped-entities a warning
  {
    rules: {
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;

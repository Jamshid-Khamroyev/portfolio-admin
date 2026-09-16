import { defineConfig } from "eslint/config";
import next from "eslint-config-next";

export default defineConfig([
  { extends: [...next] },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

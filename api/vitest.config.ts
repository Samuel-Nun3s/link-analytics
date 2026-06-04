import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globals: false,
    testTimeout: 10_000,
    // Vitest v4 workers não herdam process.env por default — passamos explicitamente
    // pra que o env.ts veja as vars carregadas via dotenv-cli.
    env: process.env as Record<string, string>,
  },
});

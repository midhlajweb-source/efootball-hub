import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "url";

/**
 * Vitest config for the frontend suite. The `test` script passes
 * `--environment jsdom`, so the DOM environment is configured there; this file
 * only wires the `@` alias the app's source uses and the shared setup module.
 */
export default defineConfig({
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
  test: {
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    pool: "forks",
    poolOptions: {
      forks: { minForks: 1, maxForks: 1 },
    },
  },
});

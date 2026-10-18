import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
// The root configuration omits shared-component tests; include them without changing its scope.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("../../", import.meta.url)) } },
  test: { include: ["lib/**/*.test.ts", "hooks/**/*.test.ts", "components/screens/**/*.test.ts", "components/motion/**/*.test.ts", "components/record/**/*.test.ts", "components/markdown/**/*.test.ts"] },
});

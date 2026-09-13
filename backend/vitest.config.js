import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: here("./src/config/minio.js"), replacement: here("./tests/minioStub.js") }],
  },
  test: {
    environment: "node",
    // Each file gets its own database connection; running them in parallel would
    // have them wiping each other's data in beforeEach.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});

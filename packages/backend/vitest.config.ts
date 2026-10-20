import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        expect: { requireAssertions: true },
        globalSetup: "./test-setup.ts",
        fileParallelism: false,
        environment: "node",
    },
});

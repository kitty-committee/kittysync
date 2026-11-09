import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        expect: { requireAssertions: true },
        fileParallelism: false,
        environment: "jsdom",
        include: ["src/layer-1/**/*.spec.ts"],
    },
});

import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/browser",
    timeout: 60_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
    outputDir: "test-results",
    webServer: [
        {
            command:
                'cd "$(git rev-parse --show-toplevel)" && set -a && . "$(pwd)/.env.example" && set +a && pnpm backend dev',
            url: "http://127.0.0.1:3000/api/auth/session",
            reuseExistingServer: true,
        },
        {
            command: 'cd "$(git rev-parse --show-toplevel)" && pnpm frontend dev --host 127.0.0.1',
            url: "http://127.0.0.1:5173/",
            reuseExistingServer: true,
        },
    ],
    use: {
        baseURL: process.env["CHAOS_BASE_URL"] ?? "http://127.0.0.1:5173",
        browserName: "chromium",
        headless: true,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
});

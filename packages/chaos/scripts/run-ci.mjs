import { spawnSync } from "node:child_process";

const packageManager = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const scripts = ["test:unit", "test:integration", "test:browser"];
let failed = false;

for (const script of scripts) {
    const result = spawnSync(packageManager, ["run", script], { stdio: "inherit" });
    if (result.error) {
        console.error(`Failed to start ${script}:`, result.error);
        failed = true;
    } else if (result.status !== 0) {
        console.error(`${script} exited with status ${result.status ?? result.signal ?? "unknown"}`);
        failed = true;
    }
}

if (failed) process.exitCode = 1;

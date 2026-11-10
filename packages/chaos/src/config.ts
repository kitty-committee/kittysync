function parseIntegerEnvironment(name: string, value: string | undefined, defaultValue: number): number {
    if (value === undefined || value.trim() === "") return defaultValue;

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) {
        throw new Error(`${name} must be a safe integer; received ${value}`);
    }

    return parsed;
}

const seed = parseIntegerEnvironment("FC_SEED", process.env["FC_SEED"], 20261109);
if (seed < -2_147_483_648 || seed > 2_147_483_647) {
    throw new Error(`FC_SEED must be a signed 32-bit integer; received ${seed}`);
}

const runCount = parseIntegerEnvironment("FC_RUNS", process.env["FC_RUNS"], 100);
if (runCount < 1) {
    throw new Error(`FC_RUNS must be a positive integer; received ${runCount}`);
}

export const chaosConfig = {
    path: process.env["FC_PATH"],
    runCount,
    seed,
};

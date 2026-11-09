export async function waitUntil(
    condition: () => boolean | Promise<boolean>,
    description: string,
    timeoutMilliseconds: number,
): Promise<void> {
    const deadline = Date.now() + timeoutMilliseconds;

    while (Date.now() < deadline) {
        if (await condition()) return;
        await new Promise<void>((resolve) => setTimeout(resolve, 25));
    }

    throw new Error(`Timed out after ${timeoutMilliseconds}ms waiting for ${description}`);
}

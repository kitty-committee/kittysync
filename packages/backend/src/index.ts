import { createApp } from "./app.ts";

async function start() {
    const app = await createApp();
    try {
        await app.listen({ port: 3000 });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

void start();

import { configuration } from "@kittysync/common";
import { createApp } from "./app.ts";

async function start() {
    const app = await createApp();
    try {
        await app.listen({ port: configuration.backendPort, host: "0.0.0.0" });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

void start();

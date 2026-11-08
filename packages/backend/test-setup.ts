import { configuration } from "./src/configuration";
import { Client } from "pg";

export async function setup() {
    const db = await new Client(configuration.database).connect();

    await db.query("CREATE DATABASE kittysync_test");
    process.env["KITTYSYNC_DB_NAME"] = "kittysync_test";

    return async () => {
        await db.query("DROP DATABASE kittysync_test");
        await db.end();
    };
}

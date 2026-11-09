import { configuration } from "@kittysync/backend/src/configuration.ts";
import { Client } from "pg";

export async function setup() {
    const databaseName = `kittysync_chaos_${process.pid}`;
    const admin = new Client({
        ...configuration.database,
        database: "postgres",
        connectionTimeoutMillis: 10_000,
    });

    await admin.connect();
    try {
        await admin.query(`CREATE DATABASE "${databaseName}"`);
    } catch (error) {
        await admin.end();
        throw error;
    }

    process.env["KITTYSYNC_DB_NAME"] = databaseName;

    return async () => {
        await admin.query(`DROP DATABASE "${databaseName}"`);
        await admin.end();
    };
}

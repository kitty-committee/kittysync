import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { configuration } from "./configuration.ts";

import type { UserDb } from "@kittysync/common";

//split the registers of auth and document to keep a consistent naming convetion
import { register as registerDocuments } from "./documents/documents.routes.ts";
import { register as registerAuth } from "./auth/auth.routes.ts";

import fastifyCookie from "@fastify/cookie";
import { Redis } from "ioredis";
import Fastify from "fastify";
import { Pool } from "pg";
export const redis = new Redis(6379, configuration.redisHost);

const pool = new Pool(configuration.database);
export const db = drizzle({ client: pool });
await migrate(db, { migrationsFolder: "./drizzle" });

export const app = Fastify({
    logger: true,
});

app.register(fastifyCookie);

app.addHook("onClose", async (_instance) => {
    await Promise.all([redis.quit(), pool.end()]);
});

// decorate fastify
app.decorateRequest("user", null);
declare module "fastify" {
    interface FastifyRequest {
        user: UserDb | null;
    }
}

// Declare a route
app.get("/", function (_, reply) {
    reply.send({ hello: "world" });
});

// Register routes
registerAuth(app);
registerDocuments(app);

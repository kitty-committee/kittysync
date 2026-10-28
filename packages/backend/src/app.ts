import { register as registerDocuments } from "./documents/documents.routes.ts";
import { register as registerAuth } from "./auth/auth.routes.ts";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { configuration } from "./configuration.ts";
import type { UserDb } from "@kittysync/common";
import staticFastify from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import { join } from "node:path";
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

app.register(staticFastify, {
    root: join(process.cwd(), "./public"),
    index: "index.html",
});

app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api")) return reply.code(404).send();
    return reply.type("text/html").sendFile("404.html");
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

// Register routes
registerAuth(app);
registerDocuments(app);

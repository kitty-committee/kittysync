import { registerWebsocketRoutes } from "./ws/websocket.handler.ts";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { configuration } from "./configuration.ts";
import { register } from "./auth/auth.routes.ts";
import type { UserDb } from "@kittysync/common";
import fastifyCookie from "@fastify/cookie";
import websocket from "@fastify/websocket";
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
app.register(websocket);

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

// Register auth routes
register(app);
registerWebsocketRoutes(app);

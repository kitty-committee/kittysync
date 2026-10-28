import { registerWebsocketRoutes } from "./ws/websocket.handler.ts";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { configuration } from "./configuration.ts";

import type { UserDb } from "@kittysync/common";
import { join } from "node:path";
import staticFastify from "@fastify/static";

//split the registers of auth and document to keep a consistent naming convetion
import { register as registerDocuments } from "./documents/documents.routes.ts";
import { register as registerAuth } from "./auth/auth.routes.ts";

import fastifyCookie from "@fastify/cookie";
import websocket from "@fastify/websocket";
import { Redis } from "ioredis";
import Fastify from "fastify";
import { Pool } from "pg";

const pool = new Pool(configuration.database);
export const db = drizzle({ client: pool });

/** Creates a Redis client instance */
export function createRedis() {
    return new Redis(6379, configuration.redisHost);
}

/** The global redis client, not to be used with subscriptions */
export const redis = createRedis();

declare module "fastify" {
    interface FastifyRequest {
        user: UserDb | null;
    }
}

/** Creates an instance of the KittySync backend application */
export async function createApp() {
    await migrate(db, { migrationsFolder: "./drizzle" });

    const app = Fastify({
        logger: true,
    });

    app.register(fastifyCookie);
    app.register(websocket);

    app.register(staticFastify, {
        root: join(process.cwd(), "./public"),
        index: "404.html",
    });

    app.setNotFoundHandler((request, reply) => {
        if (request.url.startsWith("/api")) return reply.code(404).send();
        return reply.type("text/html").sendFile("404.html");
    });

    // decorate fastify
    app.decorateRequest("user", null);

    // Register auth routes
    registerAuth(app);
    registerDocuments(app);
    registerWebsocketRoutes(app);

    // return the app instance
    return app;
}

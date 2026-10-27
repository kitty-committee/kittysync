import { registerWebsocketRoutes } from "./ws/websocket.handler.ts";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { configuration } from "./configuration.ts";

import type { UserDb } from "@kittysync/common";

//split the registers of auth and document to keep a consistent naming convetion
import { register as registerDocuments } from "./documents/documents.routes.ts";
import { register as registerAuth } from "./auth/auth.routes.ts";

import fastifyCookie from "@fastify/cookie";
import websocket from "@fastify/websocket";
import { Redis } from "ioredis";
import Fastify from "fastify";
import { Pool } from "pg";
export const redis = new Redis(6379, configuration.redisHost);

const pool = new Pool(configuration.database);
export const db = drizzle({ client: pool });

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

    // decorate fastify
    app.decorateRequest("user", null);

    // Declare a route
    app.get("/", function (_, reply) {
        reply.send({ hello: "world" });
    });

    // Register auth routes
    registerAuth(app);
    registerDocuments(app);
    await registerWebsocketRoutes(app);

    // return the app instance
    return app;
}

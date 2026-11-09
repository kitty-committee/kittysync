import {
    awarenessStateSchema,
    GLOBAL_PRESENCE_DOCUMENT,
    YJS_SHARED_TEXT,
    type AwarenessState,
    type UserDb,
} from "@kittysync/common";
import { NotAuthenticated, DocumentNotFound, DocumentIdConflict, UpdateForbidden } from "./collaboration/errors.ts";
import { register as registerHocus, contextSchema } from "./collaboration/collaboration.ts";
import { register as registerDocuments } from "./documents/documents.routes.ts";
import { store as dbStore } from "./collaboration/database/store.ts";
import { fetch as dbFetch } from "./collaboration/database/fetch.ts";
import { Redis as HocusRedis } from "@hocuspocus/extension-redis";
import { register as registerAuth } from "./auth/auth.routes.ts";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Database } from "@hocuspocus/extension-database";
import { getDocuments } from "./documents/get.handler.ts";
import { Logger } from "@hocuspocus/extension-logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { configuration } from "./configuration.ts";
import { Hocuspocus } from "@hocuspocus/server";
import { documentsTable } from "./db/schema.ts";
import staticFastify from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import websocket from "@fastify/websocket";
import { eq } from "drizzle-orm";
import { join } from "node:path";
import { Redis } from "ioredis";
import Fastify from "fastify";
import { Pool } from "pg";
import * as z from "zod";
import * as Y from "yjs";

const pool = new Pool(configuration.database);
export const db = drizzle({ client: pool });

/** Creates a Redis client instance */
export function createRedis() {
    return new Redis(6379, configuration.redisHost);
}

/** The global redis client, not to be used with subscriptions */
export const redis = createRedis();

export const hocuspocus = new Hocuspocus({
    extensions: [
        new Logger(),
        new HocusRedis({
            host: configuration.redisHost,
            port: 6379,
        }),
        new Database({
            fetch: dbFetch,
            store: dbStore,
        }),
    ],

    async onAuthenticate({ context, documentName }) {
        const c = contextSchema.parse(context);
        // This shouldn't  necessarily need to  be verified, since it should have been verified by
        // the authentication hook on the endpoint to open the websocket connection
        if (c.user === undefined) {
            throw new NotAuthenticated();
        }

        // If the document name is the global presence document, this should be handled
        // separately, since the document does not actually exist on the database
        if (documentName !== GLOBAL_PRESENCE_DOCUMENT) {
            // If this fails, a ZodError is thrown, and exposed to hocuspocus,
            // which does not proceed once an error is received.
            const docId = z.uuid().parse(documentName);
            const docs = await getDocuments(docId);
            if (docs.length === 0) {
                throw new DocumentNotFound();
            }
        }
    },

    // This function must be async, but eslint complains there is no await!
    // eslint-disable-next-line @typescript-eslint/require-await
    async beforeHandleAwareness({ context, states, awareness, removedClients }) {
        const c = contextSchema.parse(context);
        if (c.user === undefined) {
            throw new NotAuthenticated();
        }

        // states contains the new states being pushed to the document's awareness by a
        // single client. Here, we verify that all of the pushed states are valid against the
        // expected schema, and replace the user value with the server-supplied context, rather
        // than trusting the client.
        for (const k of states.keys()) {
            let state: AwarenessState;
            try {
                state = awarenessStateSchema.parse(states.get(k));
            } catch {
                states.delete(k);
                continue;
            }

            state.user = c.user;
            states.set(k, state);

            // Ensure that the current user is consistent with the current state.
            // Prevents client ID's from being hijacked.
            const currentState = awareness.getStates().get(k) as AwarenessState;
            if (currentState !== undefined && currentState.user.id !== c.user.id) {
                states.delete(k);
            }
        }

        // Check if the update attempts to remove any clients which are not owned
        // by the current user.
        for (const id of removedClients) {
            const state = awareness.getStates().get(id) as AwarenessState;
            if (state === undefined) continue;
            if (state.user.id !== c.user.id) {
                throw new UpdateForbidden();
            }
        }
    },
});

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

    await app.register(fastifyCookie);
    await app.register(websocket);

    await app.register(staticFastify, {
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
    await app.register(registerAuth);
    await app.register(registerDocuments);
    // Deprecated from hocuspocus integration
    // registerWebsocketRoutes(app);
    await app.register(registerHocus);

    app.addHook("onClose", (instance, done) => {
        hocuspocus.closeConnections();
        hocuspocus.flushPendingStores();

        done();
    });

    // return the app instance
    return app;
}

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
import { Redis as HocusRedis } from "@hocuspocus/extension-redis";
import { register as registerAuth } from "./auth/auth.routes.ts";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Database } from "@hocuspocus/extension-database";
import { getDocuments } from "./documents/get.handler.ts";
import { Logger } from "@hocuspocus/extension-logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { configuration } from "./configuration.ts";
import { Hocuspocus } from "@hocuspocus/server";
import { updateDocumentState } from "./util.ts";
import staticFastify from "@fastify/static";
import fastifyCookie from "@fastify/cookie";
import websocket from "@fastify/websocket";
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

export function createHocuspocus(name?: string) {
    return new Hocuspocus({
        name,
        extensions: [
            new Logger(),
            new HocusRedis({
                host: configuration.redisHost,
                port: 6379,
            }),
            new Database({
                fetch: async ({ documentName }) => {
                    // Global presence document has no state
                    if (documentName === GLOBAL_PRESENCE_DOCUMENT) {
                        return null;
                    }

                    let docs = await getDocuments(documentName, true);

                    if (docs.length !== 1) {
                        throw new DocumentIdConflict();
                    }

                    const state = docs[0].yDocState;
                    if (state !== null) return state;

                    // Re-select the document, locking it for update
                    docs = await getDocuments(documentName, true, true);

                    const newDoc = new Y.Doc();
                    const newDocText = newDoc.getText(YJS_SHARED_TEXT);
                    newDocText.insert(0, docs[0].content);

                    await updateDocumentState(documentName, newDoc);

                    docs = await getDocuments(documentName, true);

                    if (docs.length !== 1) {
                        throw new DocumentIdConflict();
                    }

                    return docs[0].yDocState;
                },

                store: async ({ documentName, state }) => {
                    // Global presence document has no state
                    if (documentName === GLOBAL_PRESENCE_DOCUMENT) {
                        return;
                    }

                    const docs = await getDocuments(documentName, true, true);

                    if (docs.length !== 1) {
                        throw new DocumentIdConflict();
                    }

                    const newState = Y.mergeUpdates([docs[0].yDocState!, state]);
                    const yDoc = new Y.Doc();
                    Y.applyUpdate(yDoc, newState);

                    await updateDocumentState(documentName, yDoc);
                },
            }),
        ],

        async onAuthenticate({ context, documentName }) {
            const c = contextSchema.parse(context);
            // This should already be verified by the websocket endpoint authentication hook.
            if (c.user === undefined) {
                throw new NotAuthenticated();
            }

            // The global presence document is not stored in the database.
            if (documentName !== GLOBAL_PRESENCE_DOCUMENT) {
                // Invalid document names throw a ZodError, preventing the connection from proceeding.
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

            // Validate submitted states and replace client-supplied users with the authenticated context.
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

                // Prevent a client from taking over another client's awareness ID.
                const currentState = awareness.getStates().get(k) as AwarenessState;
                if (currentState !== undefined && currentState.user.id !== c.user.id) {
                    states.delete(k);
                }
            }

            // A client may only remove awareness states belonging to the authenticated user.
            for (const id of removedClients) {
                const state = awareness.getStates().get(id) as AwarenessState;
                if (state === undefined) continue;
                if (state.user.id !== c.user.id) {
                    throw new UpdateForbidden();
                }
            }
        },
    });
}

declare module "fastify" {
    interface FastifyRequest {
        user: UserDb | null;
    }
}

/** Creates an instance of the KittySync backend application */
export async function createApp(options: { name?: string } = {}) {
    await migrate(db, { migrationsFolder: join(import.meta.dirname, "../drizzle") });

    const app = Fastify({
        logger: true,
    });
    const hocuspocus = createHocuspocus(options.name);

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
    await app.register(registerHocus, { hocuspocus });

    app.addHook("onClose", async () => {
        hocuspocus.closeConnections();
        hocuspocus.flushPendingStores();
        await hocuspocus.hooks("onDestroy", { instance: hocuspocus });
    });

    // return the app instance
    return app;
}

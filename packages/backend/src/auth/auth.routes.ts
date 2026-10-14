import Fastify from "fastify";
import { getUserHandler } from "./user/get.handler.ts";
import { postUserHandler } from "./user/post.handler.ts";
import { getSessionHandler } from "./session/get.handler.ts";
import { postSessionHandler } from "./session/post.handler.ts";

function routes(app: Fastify.FastifyInstance) {
    app.get("user", getUserHandler);
    app.post("user", postUserHandler);

    app.get("session", getSessionHandler);
    app.post("session", postSessionHandler);
}

/**
 * @brief Register the routes for the auth module to a fastify app instance. Routes are registered to the prefix "/api/auth".
 * @param app - Fastify app instance to register routes to
 */
export function register(app: Fastify.FastifyInstance) {
    app.register(routes, { prefix: "/api/auth/" });
}

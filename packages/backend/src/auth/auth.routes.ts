import { postSessionHandler } from "./session/post.handler.ts";
import { getSessionHandler } from "./session/get.handler.ts";
import { postUserHandler } from "./user/post.handler.ts";
import { getUserHandler } from "./user/get.handler.ts";
import { authenticationHook } from "../util.ts";
import Fastify from "fastify";

function routes(app: Fastify.FastifyInstance) {
    app.get("user", { preHandler: authenticationHook }, getUserHandler);
    app.post("user", postUserHandler);

    app.get("session", { preHandler: authenticationHook }, getSessionHandler);
    app.post("session", postSessionHandler);
}

/**
 * @brief Register the routes for the auth module to a fastify app instance. Routes are registered to the prefix "/api/auth".
 * @param app - Fastify app instance to register routes to
 */
export function register(app: Fastify.FastifyInstance) {
    app.register(routes, { prefix: "/api/auth/" });
}

import { getDocumentHandler } from "./get.handler.ts";
import { postDocumentHandler } from "./post.handler.ts";
import Fastify from "fastify";

function routes(app: Fastify.FastifyInstance) {
    app.get("document", getDocumentHandler);
    app.post("document", postDocumentHandler);

}

/**
 * @brief Register the routes for the auth module to a fastify app instance. Routes are registered to the prefix "/api/auth".
 * @param app - Fastify app instance to register routes to
 */
export function register(app: Fastify.FastifyInstance) {
    app.register(routes, { prefix: "/api/" });
}

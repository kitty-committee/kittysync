import { getDocumentHandler } from "./get.handler.ts";
import { postDocumentHandler } from "./post.handler.ts";
import Fastify from "fastify";

function routes(app: Fastify.FastifyInstance) {
    app.get<{ Params: { id?: string } }>("document/:id?", getDocumentHandler);
    app.post("document", postDocumentHandler);

}

export function register(app: Fastify.FastifyInstance) {
    app.register(routes, { prefix: "/api/" });
}

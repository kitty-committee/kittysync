//imports fastify and the handler functions for the get and post routes
import { postDocumentHandler } from "./post.handler.ts";
import { getDocumentHandler } from "./get.handler.ts";
import { authenticationHook } from "../util.ts";
import Fastify from "fastify";

/**
    defines the routes for the document endpoints 
    .get will retreive a document by id if provided, otherwise it will retrieve all documents
    .post will create a new document with the provided title    
*/

function routes(app: Fastify.FastifyInstance) {
    app.get<{ Params: { id?: string } }>("/documents/:id?", { preHandler: authenticationHook }, getDocumentHandler);
    app.post("/documents", { preHandler: authenticationHook }, postDocumentHandler);
}

/** registers the routes with the fastify instance and adds a prefix of /api/ to all routes */
export function register(app: Fastify.FastifyInstance) {
    app.register(routes, { prefix: "/api" });
}

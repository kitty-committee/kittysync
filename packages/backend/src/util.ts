import { TOKEN_PROVIDER } from "./auth/session/session-tokens.ts";
import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Prehandler for backend routes which enforces an authentication check. If the session token does not exist or cannot be verified, or redis is innaccessible, the response will be hijacked here and not proceed any further.
 */
export async function authenticationHook(request: FastifyRequest, reply: FastifyReply) {
    const token = request.cookies["session"];

    if (token === undefined) reply.hijack().code(401).send();
    else {
        try {
            if ((await TOKEN_PROVIDER.verify(token)) !== null) reply.hijack().code(401).send();
        } catch (error) {
            console.error(error);
            reply.hijack().code(503).send();
        }
    }
}

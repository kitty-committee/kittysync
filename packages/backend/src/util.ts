import { TOKEN_PROVIDER } from "./auth/session/session-tokens.ts";
import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Prehandler for backend routes which enforces an authentication check. If the session token does not exist or cannot be verified, or redis is innaccessible, the response will be hijacked here and not proceed any further.
 */
export async function authenticationHook(request: FastifyRequest, reply: FastifyReply) {
    const token = request.cookies["session"];

    if (token === undefined) return reply.code(401).send();
    else {
        try {
            const user = await TOKEN_PROVIDER.decode(token);
            if (user === null) return reply.code(401).send();
            else request.user = user;
        } catch (error) {
            console.error(error);
            return reply.code(503).send();
        }
    }
}

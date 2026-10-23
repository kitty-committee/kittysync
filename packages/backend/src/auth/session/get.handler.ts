import { type FastifyReply, type FastifyRequest } from "fastify";
import { TOKEN_PROVIDER } from "./session-tokens.ts";

export async function getSessionHandler(request: FastifyRequest, reply: FastifyReply) {
    const token = request.cookies["session"];

    try {
        if (token === undefined) reply.code(401).send();
        else {
            const user = await TOKEN_PROVIDER.decode(token);
            if (user === null) {
                reply.code(401).send();
            } else {
                reply.code(200).send(user);
            }
        }
    } catch (error) {
        console.error(error);
        reply.code(503).send();
    }
}

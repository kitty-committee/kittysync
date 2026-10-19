import { type FastifyReply, type FastifyRequest } from "fastify";
import { UUIDSessionToken } from "./session-tokens.ts";

export async function getSessionHandler(request: FastifyRequest, reply: FastifyReply) {
    const token = UUIDSessionToken.from(request);

    try {
        if (token === undefined || !(await token.verify())) {
            reply.code(401).send();
        } else {
            const user = await token.extractUser();
            if (user === undefined) {
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

import { type FastifyReply, type FastifyRequest } from "fastify";

export function getSessionHandler(request: FastifyRequest, reply: FastifyReply) {
    reply.code(200).send(request.user!);
}

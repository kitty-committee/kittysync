import { type FastifyReply, type FastifyRequest } from "fastify";
import type { UserDb } from "@kittysync/common";
import { redis } from "../../app.ts";

export async function getSessionHandler(request: FastifyRequest, reply: FastifyReply) {
    if (request.cookies["session"]) {
        const session = request.cookies["session"];
        const record = await redis.hgetall(`user_${session}`);
        if (record["id"] === undefined || record["username"] == undefined) {
            reply.code(401).send();
            return;
        }

        const user: UserDb = {
            id: record["id"],
            username: record["username"],
        };

        reply.statusCode = 200;
        reply.send(user);
    } else {
        reply.code(401).send();
    }
}

import type { UserDb } from "@kittysync/common";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import Redis from "ioredis";

export async function getSessionHandler(request: FastifyRequest, reply: FastifyReply) {
    const headers = request.headers;
    if (headers.cookie) {
        const regex = /session=([^;]*)/;
        let m;
        if ((m = headers.cookie.match(regex))) {
            const session = m[1];

            const redis = new Redis.Redis(6379, process.env["KITTYSYNC_REDIS_HOST"]!);
            const record = await redis.hgetall(`user_${session}`);

            const user: UserDb = {
                id: record["id"],
                username: record["username"],
            };

            reply.statusCode = 200;
            reply.send(user);
        }
    } else {
        reply.statusCode = 401;
    }
}

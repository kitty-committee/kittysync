import { type UserCredentials } from "@kittysync/common";
import { type FastifyReply, type FastifyRequest } from "fastify";
import * as z from "zod";
import { usersTable } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { v4 } from "uuid";
import { redis, db } from "../../app.ts";
import { userCredentialsFromMultipart } from "../../util.ts";
import type { MultipartFields } from "@fastify/multipart";

export async function postSessionHandler(request: FastifyRequest, reply: FastifyReply) {
    let body: UserCredentials;
    const requestBody: MultipartFields = request.body as MultipartFields;

    try {
        body = userCredentialsFromMultipart(requestBody);
    } catch (error) {
        // Validation failed, return BadRequest error
        if (error instanceof z.ZodError || error instanceof TypeError) {
            reply.statusCode = 400;
            reply.send(error);
            return;
        }

        throw error;
    }

    const result = await db.select().from(usersTable).where(eq(usersTable.username, body.username));

    if (result.length != 1) {
        reply.code(401).send();
        return;
    }

    const targetUser = result[0];
    if (!(await bcrypt.compare(body.password, targetUser.password))) {
        reply.code(401).send();
    } else {
        reply.statusCode = 200;

        const sessionToken = v4();
        reply.setCookie("session", sessionToken, {
            domain: process.env["KITTYSYNC_APP_DOMAIN"]!,
            path: "/",
            sameSite: "strict",
            maxAge: 86400,
        });

        await redis.hset(`user_${sessionToken}`, {
            id: targetUser.id,
            username: targetUser.username,
        });
        // Set TTL for user session to 1 day
        await redis.expire(`user_${sessionToken}`, 86400);
        await redis.quit();

        reply.send({
            id: targetUser.id,
            username: targetUser.username,
        });
    }
}

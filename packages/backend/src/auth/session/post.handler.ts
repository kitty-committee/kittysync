import { UserCredentialsSchema, type UserCredentials } from "@kittysync/common";
import { type FastifyReply, type FastifyRequest } from "fastify";
import { configuration } from "../../configuration.ts";
import { UUIDSessionToken } from "./session-tokens.ts";
import { usersTable } from "../../db/schema.ts";
import { db } from "../../app.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import * as z from "zod";

export async function postSessionHandler(request: FastifyRequest, reply: FastifyReply) {
    let body: UserCredentials;

    try {
        body = UserCredentialsSchema.parse(request.body);
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

        const sessionToken = await UUIDSessionToken.new(targetUser);
        reply.setCookie("session", sessionToken.getToken().toString(), {
            domain: configuration.appDomain,
            path: "/",
            sameSite: "strict",
            maxAge: 86400,
        });

        reply.send({
            id: targetUser.id,
            username: targetUser.username,
        });
    }
}

import { UserCredentialsSchema, type UserCredentials } from "@kittysync/common";
import { drizzle } from "drizzle-orm/node-postgres";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import * as z from "zod";
import { usersTable } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function postSessionHandler(request: FastifyRequest, reply: FastifyReply) {
    let body: UserCredentials;

    try {
        body = UserCredentialsSchema.parse(request.body);
    } catch (error) {
        // Validation failed, return BadRequest error
        if (error instanceof z.ZodError) {
            reply.statusCode = 400;
            reply.send(error);
        }

        return;
    }

    const db = drizzle(process.env["KITTYSYNC_DATABASE_URL"]!);
    const result = await db.select().from(usersTable).where(eq(usersTable.username, body.username));

    if (result.length != 1) {
        reply.statusCode = 401;
        return;
    }

    const target_user = result[0];
    if (!(await bcrypt.compare(body.password, target_user.password))) {
        reply.statusCode = 401;
    } else {
        reply.statusCode = 200;
        reply.send(target_user);
    }
}

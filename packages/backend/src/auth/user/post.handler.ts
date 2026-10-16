import { type FastifyReply, type FastifyRequest } from "fastify";
import { UserCredentialsSchema, type UserCredentials } from "@kittysync/common";
import * as z from "zod";
import { usersTable } from "../../db/schema.ts";
import bcrypt from "bcrypt";
import { db } from "../../app.ts";
import { DrizzleQueryError } from "drizzle-orm";

export async function postUserHandler(request: FastifyRequest, reply: FastifyReply) {
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

    const saltRounds = 10;
    body.password = await bcrypt.hash(body.password, saltRounds);

    try {
        await db.insert(usersTable).values(body);
    } catch (error) {
        if (error instanceof DrizzleQueryError) {
            if ((error as { cause?: { code?: string } }).cause?.code === "23505") {
                reply.code(409).send();
                return;
            }
        }

        throw error;
    }
    reply.code(201).send();
}

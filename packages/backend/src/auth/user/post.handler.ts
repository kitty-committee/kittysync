import { userCredentialsSchema, type UserCredentials } from "@kittysync/common";
import { type FastifyReply, type FastifyRequest } from "fastify";
import { usersTable } from "../../db/schema.ts";
import { DrizzleQueryError } from "drizzle-orm";
import { db } from "../../app.ts";
import { ZodError } from "zod";
import bcrypt from "bcrypt";

export async function postUserHandler(request: FastifyRequest, reply: FastifyReply) {
    let body: UserCredentials;

    try {
        body = userCredentialsSchema.parse(request.body);
    } catch (error) {
        if (error instanceof ZodError) {
            reply.code(400).send(error.issues);
        }
        return;
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

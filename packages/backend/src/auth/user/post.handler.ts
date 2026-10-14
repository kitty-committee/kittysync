import { type FastifyReply, type FastifyRequest } from "fastify";
import { UserRegistrationSchema, type UserRegistration } from "@kittysync/common";
import * as z from "zod";
import { drizzle } from "drizzle-orm/node-postgres";
import { usersTable } from "../../db/schema.ts";

export async function postUserHandler(request: FastifyRequest, reply: FastifyReply) {
    let body: UserRegistration;

    try {
        body = UserRegistrationSchema.parse(request.body);
    } catch (error) {
        // Validation failed, return BadRequest error
        if (error instanceof z.ZodError) {
            reply.statusCode = 400;
            reply.send(error);
        }

        return;
    }

    const db = drizzle(process.env["KITTYSYNC_DATABASE_URL"]!);
    await db.insert(usersTable).values(body);

    reply.statusCode = 200;
}

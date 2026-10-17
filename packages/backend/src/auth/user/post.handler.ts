import { type FastifyReply, type FastifyRequest } from "fastify";
import { UserCredentialsSchema, type UserCredentials } from "@kittysync/common";
import * as z from "zod";
import { drizzle } from "drizzle-orm/node-postgres";
import { usersTable } from "../../db/schema.ts";
import bcrypt from "bcrypt";
import type { MultipartFields, MultipartValue } from "@fastify/multipart";
import { userCredentialsFromMultipart } from "../../util.ts";

export async function postUserHandler(request: FastifyRequest, reply: FastifyReply) {
    let body: UserCredentials;
    const request_body: MultipartFields = request.body as MultipartFields;

    try {
        body = userCredentialsFromMultipart(request_body);
    } catch (error) {
        // Validation failed, return BadRequest error
        if (error instanceof z.ZodError) {
            reply.statusCode = 400;
            reply.send(error);
        }

        return;
    }

    const salt_rounds = 10;
    body.password = await bcrypt.hash(body.password, salt_rounds);

    const db = drizzle(process.env["KITTYSYNC_DATABASE_URL"]!);
    await db.insert(usersTable).values(body);

    reply.statusCode = 200;
}

import { userDbSchema, userSearchSchema, type UserDb, type UserSearch } from "@kittysync/common";
import { type FastifyReply, type FastifyRequest } from "fastify";
import { usersTable } from "../../db/schema.ts";
import { like } from "drizzle-orm";
import { db } from "../../app.ts";
import * as z from "zod";

export async function getUserHandler(request: FastifyRequest, reply: FastifyReply) {
    let query: UserSearch;

    try {
        query = userSearchSchema.parse(request.query);
    } catch (error) {
        if (error instanceof z.ZodError) {
            reply.statusCode = 400;
            return;
        } else {
            console.error(error);
            reply.statusCode = 500;
            return;
        }
    }

    const result = await db
        .select({ id: usersTable.id, username: usersTable.username })
        .from(usersTable)
        .where(like(usersTable.username, query.username));

    const parsedResults: UserDb[] = [];

    for (let i = 0; i < result.length; i++) {
        parsedResults.push(userDbSchema.parse(result[i]));
    }

    reply.statusCode = 200;
    reply.send(parsedResults);
}

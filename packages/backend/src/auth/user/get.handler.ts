import { UserDbSchema, UserSearchSchema, type UserDb, type UserSearch } from "@kittysync/common";
import { drizzle } from "drizzle-orm/node-postgres";
import { type FastifyReply, type FastifyRequest } from "fastify";
import * as z from "zod";
import { usersTable } from "../../db/schema.ts";
import { like } from "drizzle-orm";

export async function getUserHandler(request: FastifyRequest, reply: FastifyReply) {
    let query: UserSearch;

    try {
        query = UserSearchSchema.parse(request.query);
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

    const db = drizzle(process.env["KITTYSYNC_DATABASE_URL"]!);
    const result = await db
        .select({ id: usersTable.id, username: usersTable.username })
        .from(usersTable)
        .where(like(usersTable.username, query.username));

    const parsedResults: UserDb[] = [];

    for (let i = 0; i < result.length; i++) {
        parsedResults.push(UserDbSchema.parse(result[i]));
    }

    reply.statusCode = 200;
    reply.send(parsedResults);
}

import { userCredentialsSchema, type UserCredentials } from "@kittysync/common";
import { type FastifyReply, type FastifyRequest } from "fastify";
import { configuration } from "../../configuration.ts";
import { TOKEN_PROVIDER } from "./session-tokens.ts";
import { usersTable } from "../../db/schema.ts";
import { db } from "../../app.ts";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import bcrypt from "bcrypt";

export async function postSessionHandler(request: FastifyRequest, reply: FastifyReply) {
    let body: UserCredentials;

    try {
        body = userCredentialsSchema.parse(request.body);
    } catch (error) {
        if (error instanceof ZodError) {
            reply.code(400).send(error.issues);
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
        try {
            const sessionToken = await TOKEN_PROVIDER.new({
                username: targetUser.username,
                id: targetUser.id,
            });

            reply.setCookie("session", sessionToken, {
                maxAge: configuration.tokenLifetime,
                domain: configuration.appDomain,
                secure: configuration.isSecure,
                sameSite: "strict",
                path: "/",
            });

            reply.code(200).send({
                id: targetUser.id,
                username: targetUser.username,
            });
        } catch (error) {
            console.error(error);
            reply.code(503).send();
        }
    }
}

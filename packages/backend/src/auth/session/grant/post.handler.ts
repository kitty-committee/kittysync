import {
    authcatAccessTokenSchema,
    authcatGrantCodeSchema,
    authcatUserSchema,
    type AuthGrantCode,
    type UserDb,
} from "@kittysync/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { configuration } from "../../../configuration.ts";
import { authcatUserToKittysync } from "../../../util.ts";
import { TOKEN_PROVIDER } from "../session-tokens.ts";
import { usersTable } from "../../../db/schema.ts";
import { db } from "../../../app.ts";
import { ZodError } from "zod";
import { v5 } from "uuid";

type ACResponse = {
    access_token: string;
    token_type: string;
    expires_in: number;
};

export async function postGrantHandler(request: FastifyRequest, reply: FastifyReply) {
    // Get the grant code from the request
    let body: AuthGrantCode;

    try {
        body = authcatGrantCodeSchema.parse(request.body);
    } catch (error) {
        if (error instanceof ZodError) {
            reply.code(400).send(error.issues);
        }

        throw error;
    }

    // Create an access token
    const response = await fetch(`https://auth.nathcat.net/token?grant_type=authorization_code&code=${body.code}`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${configuration.authcat.client_id}:${configuration.authcat.secret}`,
        },
    });

    if (response.status === 200) {
        // Create a session token from the access token
        const responseBody = (await response.json()) as ACResponse;
        const token = authcatAccessTokenSchema.parse({ token: responseBody.access_token });

        const sessionToken = await TOKEN_PROVIDER.new(token);

        reply.setCookie("session", sessionToken, {
            maxAge: responseBody.expires_in,
            domain: configuration.appDomain,
            secure: configuration.isSecure,
            sameSite: "strict",
            path: "/",
        });

        const userResponse = await fetch("https://auth.nathcat.net/user", {
            method: "GET",
            headers: { Authorization: `Bearer ${token.token}` },
        });

        const targetUser = authcatUserSchema.parse(await userResponse.json());
        const translatedUser: UserDb = authcatUserToKittysync(targetUser);

        // ... and create a DB record for this user, with no password, so they can
        // only be logged in this way.
        await db.insert(usersTable).values(translatedUser).onConflictDoNothing({ target: usersTable.id });

        reply.code(200).send(translatedUser);
    } else {
        console.error("AuthCat responded with: " + response.status + ": " + response.statusText);
        reply.code(503).send("AuthCat OAuth responded with an error code.");
    }
}

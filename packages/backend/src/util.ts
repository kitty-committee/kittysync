import type { MultipartFields, MultipartValue } from "@fastify/multipart";
import { UUIDSessionToken } from "./auth/session/session-tokens.ts";
import type { FastifyReply, FastifyRequest } from "fastify";
import { userCredentialsSchema } from "@kittysync/common";

export function userCredentialsFromMultipart(form: MultipartFields) {
    return userCredentialsSchema.parse({
        username: (form["username"] as MultipartValue<string>).value,
        password: (form["password"] as MultipartValue<string>).value,
    });
}

/**
 * Prehandler for backend routes which enforces an authentication check. If the session token does not exist or cannot be verified, or redis is innaccessible, the response will be hijacked here and not proceed any further.
 */
export async function authenticationHook(request: FastifyRequest, reply: FastifyReply) {
    const token = UUIDSessionToken.from(request);

    if (token === undefined) {
        reply.hijack();
        reply.code(401).send();
        return;
    }
    try {
        if (!(await token?.verify())) {
            reply.hijack();
            reply.code(401).send();
            return;
        }
    } catch (error) {
        console.error(error);
        reply.hijack();
        reply.code(503).send();
    }
}

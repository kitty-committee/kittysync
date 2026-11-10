import { authcatGrantCodeSchema, type AuthGrantCode } from "@kittysync/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export async function postGrantHandler(request: FastifyRequest, reply: FastifyReply) {
    let body: AuthGrantCode;

    try {
        body = authcatGrantCodeSchema.parse(request.body);
    } catch (error) {
        if (error instanceof ZodError) {
            reply.code(400).send(error.issues);
        }

        throw error;
    }
}

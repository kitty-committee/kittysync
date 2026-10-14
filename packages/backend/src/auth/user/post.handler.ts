import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { UserRegistrationSchema, type UserRegistration } from "@kittysync/common";
import * as z from "zod";

export async function postUserHandler(request: FastifyRequest, reply: FastifyReply) {
    let body: UserRegistration;

    try {
        body = UserRegistrationSchema.parse(request.body);
    } catch (error) {
        // Validation failed, return BadRequest error
        if (error instanceof z.ZodError) {
            reply.statusCode = 400;
            reply.send(error);
            return;
        }
    }
}

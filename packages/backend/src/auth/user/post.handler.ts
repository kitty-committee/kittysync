import { userCredentialsSchema, type UserCredentials } from "@kittysync/common";
import { type FastifyReply, type FastifyRequest } from "fastify";
import { usersTable } from "../../db/schema.ts";
import { DrizzleQueryError } from "drizzle-orm";
import { db } from "../../app.ts";
import { ZodError } from "zod";
import bcrypt from "bcrypt";

const COLOURS = [
    "#FDE68A", // soft yellow
    "#A7F3D0", // mint green
    "#BFDBFE", // soft blue
    "#FBCFE8", // pink
    "#DDD6FE", // lavender
    "#FED7AA", // peach
    "#BAE6FD", // sky blue
    "#D9F99D", // lime
    "#FECACA", // soft red
    "#C7D2FE", // periwinkle
    "#E9D5FF", // soft purple
    "#F5D0FE", // orchid
    "#CCFBF1", // pale teal
    "#D1FAE5", // pale emerald
    "#FEF3C7", // cream yellow
    "#FFE4E6", // rose
    "#E0E7FF", // light indigo
    "#E2E8F0", // soft slate
    "#F3E8FF", // pale violet
    "#FFEDD5", // light apricot
    "#ECFCCB", // pale chartreuse
    "#CFFAFE", // pale cyan
    "#FCE7F3", // light blush
    "#EDE9FE", // soft lavender
    "#FEE2E2", // pale coral
    "#D1F5E0", // soft seafoam
    "#E0F2FE", // ice blue
    "#FAE8FF", // pale magenta
    "#F1F5D8", // pale sage
    "#FDF2F8", // powder pink
];

export async function postUserHandler(request: FastifyRequest, reply: FastifyReply) {
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

    const saltRounds = 10;
    body.password = await bcrypt.hash(body.password, saltRounds);

    try {
        await db.insert(usersTable).values({ ...body, color: COLOURS[Math.floor(Math.random() * COLOURS.length)] });
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

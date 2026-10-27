import { TOKEN_PROVIDER } from "./auth/session/session-tokens.ts";
import type { FastifyReply, FastifyRequest } from "fastify";
import { documentsTable } from "./db/schema.ts";
import { eq } from "drizzle-orm";
import { db } from "./app.ts";

/**
 * Prehandler for backend routes which enforces an authentication check. If the session token does not exist or cannot be verified, or redis is innaccessible, the response will be hijacked here and not proceed any further.
 */
export async function authenticationHook(request: FastifyRequest, reply: FastifyReply) {
    const token = request.cookies["session"];

    if (token === undefined) return reply.code(401).send();
    else {
        try {
            const user = await TOKEN_PROVIDER.decode(token);
            if (user === null) return reply.code(401).send();
            else request.user = user;
        } catch (error) {
            console.error(error);
            return reply.code(503).send();
        }
    }
}

/*
    Update a document in the database by its ID.
    @param id - The ID of the document to update.
    @param title - The new title for the document.
    @param content - The new content for the document.
    will throw an error if the update fails.
*/
export async function updateDocument(id: number, title: string, content: string) {
    try {
        const idString = id.toString();
        await db.update(documentsTable).set({ title, content }).where(eq(documentsTable.id, idString));
        await db.update(documentsTable).set({ title, content }).where(eq(documentsTable.id, id));
        console.log("Document updated successfully");
    } catch (error) {
        console.error("Error updating document:", error);
        throw error;
    }
}

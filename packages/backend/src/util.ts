import { TOKEN_PROVIDER } from "./auth/session/session-tokens.ts";
import type { FastifyReply, FastifyRequest } from "fastify";
import { YJS_SHARED_TEXT } from "@kittysync/common";
import { documentsTable } from "./db/schema.ts";
import { eq } from "drizzle-orm";
import { db } from "./app.ts";
import * as Y from "yjs";

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

/**
    Update a document in the database by its ID.
    @param {string} id - The ID of the document to update.
    @param {string | undefined} title - The new title for the document.
    @param {string} content - The new content for the document.
    will throw an error if the update fails.
*/
export async function updateDocument(id: string, title: string | undefined, content: string) {
    try {
        if (title === undefined) {
            await db.update(documentsTable).set({ content }).where(eq(documentsTable.id, id));
        } else {
            await db.update(documentsTable).set({ title, content }).where(eq(documentsTable.id, id));
        }
    } catch (error) {
        console.error("Error updating document:", error);
        throw error;
    }
}

/**
 * Update a document's state. This function will also update the 'content' column of the document to match the new state.
 * @param {string} id - The ID of the document to update
 * @param {Y.Doc} state - The new state of the document
 */
export async function updateDocumentState(id: string, state: Y.Doc) {
    try {
        await db
            .update(documentsTable)
            .set({
                yDocState: Buffer.from(Y.encodeStateAsUpdate(state)),
                content: state.getText(YJS_SHARED_TEXT).toString(),
            })
            .where(eq(documentsTable.id, id));
    } catch (error) {
        console.error("Error while updating document state: ", error);
        throw error;
    }
}

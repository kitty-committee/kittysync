import { authcatAccessTokenSchema, authcatUserSchema, type AuthCatUser, type UserDb } from "@kittysync/common";
import { TOKEN_PROVIDER } from "./auth/session/session-tokens.ts";
import type { FastifyReply, FastifyRequest } from "fastify";
import { YJS_SHARED_TEXT } from "@kittysync/common";
import { configuration } from "./configuration.ts";
import { documentsTable } from "./db/schema.ts";
import { eq } from "drizzle-orm";
import { db } from "./app.ts";
import { v5 } from "uuid";
import * as Y from "yjs";

/**
 * @param user - Translate an AuthCat user to a Kittysync user.
 * @returns The Kittysync user linked to an AuthCat user
 */
export function authcatUserToKittysync(user: AuthCatUser): UserDb {
    // Kittysync uses a UUID for the user ID, so we must translate the AuthCat user ID
    // to a deterministic UUID.
    return {
        id: v5(`${user.id}`, configuration.authcat.uuidNamespace),
        username: user.username,
    };
}

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
            else {
                // Parse the token contents
                const parseResult = authcatAccessTokenSchema.safeParse(user);

                if (!parseResult.success) {
                    // If this fails, the user is a raw kittysync user
                    request.user = user as UserDb;
                } else {
                    // If this passes, the token contains an AuthCat access token.
                    //
                    // Obtain the AuthCat user data
                    const response = await fetch("https://auth.nathcat.net/user", {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${parseResult.data.token}`,
                        },
                    });

                    if (response.status !== 200) {
                        return reply.code(401).send();
                    } else {
                        // Translate the AuthCat user to a Kittysync user, and set the request parameter
                        const body = authcatUserSchema.parse(await response.json());
                        request.user = authcatUserToKittysync(body);
                    }
                }
            }
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
                // YJS does not explicitly expose the definition of toString in their types in such a way that satisfies eslint,
                // but an implementation will exist in runtime. I can't see a way around this annoyingly.
                // eslint-disable-next-line
                content: state.getText(YJS_SHARED_TEXT).toString(),
            })
            .where(eq(documentsTable.id, id));
    } catch (error) {
        console.error("Error while updating document state: ", error);
        throw error;
    }
}

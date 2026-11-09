import { type FastifyReply, type FastifyRequest } from "fastify";
import { documentsTable } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { db } from "../app.ts";
import * as z from "zod/v3";
import "dotenv/config";
/** 
    Fetch documents from the database.
    @param {string | undefined} id - The ID of the document to fetch.
    @returns {Promise<any[]>} A list of documents or a single document if an ID is provided.
*/
export async function getDocuments(): Promise<Pick<typeof documentsTable.$inferSelect, "id" | "title">[]>;
export async function getDocuments(
    id: string,
): Promise<Pick<typeof documentsTable.$inferSelect, "id" | "title" | "content" | "authorId">[]>;
export async function getDocuments(id: string, binary: boolean): Promise<(typeof documentsTable.$inferSelect)[]>;
export async function getDocuments(id?: string, binary?: boolean) {
    if (id !== undefined) {
        try {
            let columns;
            if (binary === true) {
                columns = {
                    id: documentsTable.id,
                    title: documentsTable.title,
                    content: documentsTable.content,
                    authorId: documentsTable.authorId,
                    yDocState: documentsTable.yDocState,
                };
            } else {
                columns = {
                    id: documentsTable.id,
                    title: documentsTable.title,
                    content: documentsTable.content,
                    authorId: documentsTable.authorId,
                };
            }

            return await db.select(columns).from(documentsTable).where(eq(documentsTable.id, id));
        } catch (error) {
            console.error("Error fetching document by ID:", error);
            throw error;
        }
    }

    try {
        const result = await db.select({ id: documentsTable.id, title: documentsTable.title }).from(documentsTable);
        return result;
    } catch (error) {
        console.error("Error fetching documents:", error);
        throw error;
    }
}

/**
    Handle the GET request for documents.
    @param {FastifyRequest} request - The Fastify request object.
    @param {FastifyReply} reply - The Fastify reply object.
    @returns {Promise<void>} A list of documents or a single document if an ID is provided.
    will throw a 500 error if the fetch fails or if the document is not found.
*/
export async function getDocumentHandler(request: FastifyRequest<{ Params: { id?: string } }>, reply: FastifyReply) {
    let id: string | undefined;
    if (request.params?.id != undefined) {
        try {
            id = z.string().uuid().parse(request.params?.id);
        } catch {
            reply.code(400).send();
            return;
        }
    }

    try {
        const documents = id !== undefined ? await getDocuments(id) : await getDocuments();

        if (id !== undefined && documents.length == 0) {
            reply.code(404).send();
            return;
        }

        reply.statusCode = 200;
        reply.send(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        reply.statusCode = 500;
        reply.send({ error: "Internal Server Error" });
    }
}

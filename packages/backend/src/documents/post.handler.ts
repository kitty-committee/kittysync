import { type FastifyReply, type FastifyRequest } from "fastify";
import { documentsTable } from "../db/schema.ts";
import { z, ZodError } from "zod/v3";
import { db } from "../app.ts";
import "dotenv/config";

/**
    Insert a new document into the database.
    @param {string} title - The title of the document to insert.
    @param {string} authorId - The ID of the author of the document.
    will throw an error if the insert fails.
*/
export async function insertDocument(title: string, authorId: string) {
    try {
        const document = await db.insert(documentsTable).values({ title, authorId }).returning();
        console.log("Document inserted successfully");
        return document;
    } catch (error) {
        console.error("Error inserting document:", error);
        throw error;
    }
}

/**
    define the type for the document body
    contains the following properties:
    - title: string, the title of the document
    - content: string, the content of the document
 */
const documentBodySchema = z.object({
    title: z.string().trim().min(1).max(255),
});

/**
    Handle the POST request for documents.
    @param {FastifyRequest} request - The Fastify request object.
    @param {FastifyReply} reply - The Fastify reply object.
    will throw a 500 error if the insert fails.
*/
export async function postDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
    let title: string;
    let authorId: string;
    try {
        const doc = documentBodySchema.parse(request.body);
        title = doc.title;
        if (!request.user) {
            reply.code(401).send({ error: "Unauthorized" });
            return;
        }
        authorId = request.user.id;
    } catch (error) {
        if (error instanceof ZodError) {
            reply.code(400).send(error.issues);
            return;
        }
        throw error;
    }

    try {
        const [document] = await insertDocument(title, authorId);
        reply.statusCode = 201;
        reply.send(document);
    } catch (error) {
        console.error("Error creating document:", error);
        reply.statusCode = 500;
        reply.send({ error: "Internal Server Error" });
    }
}

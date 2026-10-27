import 'dotenv/config';
import { documentsTable } from '../db/schema.ts'
import {db} from '../app.ts'
import { eq } from 'drizzle-orm';
import { type FastifyReply, type FastifyRequest } from "fastify";
import * as z from 'zod/v3';
/* 
    Fetch documents from the database.
    @param id - The ID of the document to fetch.
    @returns - A list of documents or a single document if an ID is provided.
*/
export async function getDocuments(id?: string) {
    if (id !== undefined) {
        try {
            const result = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
            return result;
        } catch (error) {
            console.error('Error fetching document by ID:', error);
            throw error;
        }
    }

    try {
        const result = await db.select({ id: documentsTable.id, title: documentsTable.title }).from(documentsTable);
        return result;
    } catch (error) {
        console.error('Error fetching documents:', error);
        throw error;
    }
}

/*
    Handle the GET request for documents.
    @param request - The Fastify request object.
    @param reply - The Fastify reply object.
    @returns - A list of documents or a single document if an ID is provided.
    will throw a 500 error if the fetch fails or if the document is not found.
*/
export async function getDocumentHandler(
    request: FastifyRequest<{ Params: { id?: string } }>,
    reply: FastifyReply,
) {
    let id: string;
    try {
            id = z.string().uuid().parse(request.params?.id);
    } catch {
            reply.code(404).send();
            return;
    }

    try {
        const documents = await getDocuments(id);
        if (documents.length === 0) {
                reply.code(404).send();
                return;
        }
        reply.statusCode = 200;
        reply.send(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        reply.statusCode = 500;
        reply.send({ error: 'Internal Server Error' });
    }
}

import 'dotenv/config';
import { documentsTable } from '../db/schema.ts'
import {db} from '../app.ts'
import { eq } from 'drizzle-orm';
import { type FastifyReply, type FastifyRequest } from "fastify";
export async function getDocuments(id?: number) {
    if (id) {
        const idString = id.toString();
        try {
            const result = await db.select().from(documentsTable).where(eq(documentsTable.id, idString));
            return result;
        } catch (error) {
            console.error('Error fetching document by ID:', error);
            throw error;
        }
    }

    try {
        const result = await db.select().from(documentsTable);
        return result;
    } catch (error) {
        console.error('Error fetching documents:', error);
        throw error;
    }
}
export async function getDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
    const id = request.params?.id ? parseInt(request.params.id) : undefined;

    try {
        const documents = await getDocuments(id);
        reply.statusCode = 200;
        reply.send(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        reply.statusCode = 500;
        reply.send({ error: 'Internal Server Error' });
    }
}

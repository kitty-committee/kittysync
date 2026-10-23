import 'dotenv/config';
import { documentsTable } from '../db/schema.ts'
import {db} from '../app.ts'
import { type FastifyReply, type FastifyRequest } from "fastify";

export async function insertDocument(title: string, slug: string, content: string) {
    try {
        await db.insert(documentsTable).values({ title, slug, content });
        console.log('Document inserted successfully');
    } catch (error) {
        console.error('Error inserting document:', error);
        throw error;
    }
}

type DocumentBody = {
    title: string;
    slug: string;
    content: string;
};

export async function postDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
    const { title, slug, content } = request.body as DocumentBody;

    try {
        await insertDocument(title, slug, content);
        reply.statusCode = 201;
        reply.send({ message: 'Document created successfully' });
    } catch (error) {
        console.error('Error creating document:', error);
        reply.statusCode = 500;
        reply.send({ error: 'Internal Server Error' });
    }
}

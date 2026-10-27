import 'dotenv/config';
import { documentsTable } from '../db/schema.ts'
import {db} from '../app.ts'
import { type FastifyReply, type FastifyRequest } from "fastify";

/*
    Insert a new document into the database.
    @param title - The title of the document to insert.
    will throw an error if the insert fails.
*/
export async function insertDocument(title: string,) {
    try {
        await db.insert(documentsTable).values({ title});
        console.log('Document inserted successfully');
    } catch (error) {
        console.error('Error inserting document:', error);
        throw error;
    }
}

/*
    define the type for the document body
    contains the following properties:
    - title: string, the title of the document
    - content: string, the content of the document
 */
type DocumentBody = {
    title: string;
    content: string;
};

/*
    Handle the POST request for documents.
    @param request - The Fastify request object.
    @param reply - The Fastify reply object.
    will throw a 500 error if the insert fails.
*/
export async function postDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
    const { title } = request.body as DocumentBody;

    try {
        await insertDocument(title);
        reply.statusCode = 201;
        reply.send({ message: 'Document created successfully' });
    } catch (error) {
        console.error('Error creating document:', error);
        reply.statusCode = 500;
        reply.send({ error: 'Internal Server Error' });
    }
}

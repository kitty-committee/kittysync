import type { MultipartFields, MultipartValue } from "@fastify/multipart";
import { UserCredentialsSchema } from "@kittysync/common";
import 'dotenv/config';
import { documentsTable } from './db/schema.ts'
import {db} from './app.ts'
import { eq } from 'drizzle-orm';

export function userCredentialsFromMultipart(form: MultipartFields) {
    return UserCredentialsSchema.parse({
        username: (form["username"] as MultipartValue<string>).value,
        password: (form["password"] as MultipartValue<string>).value,
    });
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
        await db.update(documentsTable)
            .set({ title, content })
            .where(eq(documentsTable.id, idString));
        console.log('Document updated successfully');
    } catch (error) {
        console.error('Error updating document:', error);
        throw error;
    }
}
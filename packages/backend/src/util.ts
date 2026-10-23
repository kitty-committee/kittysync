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

export async function updateDocument(id: number, title: string, slug: string, content: string) {
    try {
        const idString = id.toString();
        await db.update(documentsTable)
            .set({ title, slug, content })
            .where(eq(documentsTable.id, idString));
        console.log('Document updated successfully');
    } catch (error) {
        console.error('Error updating document:', error);
        throw error;
    }
}
import 'dotenv/config';
import { documentsTable } from './schema.ts'
import {db} from '../app.ts'
import { eq } from 'drizzle-orm';

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
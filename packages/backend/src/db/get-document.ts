import 'dotenv/config';
import { documentsTable } from './schema.ts'
import {db} from '../app.ts'
import { eq } from 'drizzle-orm';

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
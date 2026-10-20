import 'dotenv/config';
import { documentsTable } from './schema.ts'
import {db} from '../app.ts'

export async function insertDocument(title: string, slug: string, content: string) {
    try {
        await db.insert(documentsTable).values({ title, slug, content });
        console.log('Document inserted successfully');
    } catch (error) {
        console.error('Error inserting document:', error);
        throw error;
    }
}
import type { PageLoad } from "./$types";
import {error} from "@sveltejs/kit";

type DocimentRecord = {
    id: string;
    title: string;
    slug: string;
    content: string;
};

export const load: PageLoad = async ({fetch }) => {
    const response = await fetch(`/api/document`);

    if (!response.ok) {
        throw error(response.status, 'Failed to fetch documents');
    }

    const documents: DocimentRecord[] = await response.json() as DocimentRecord[];
    
    return {    


        summaries: documents.map((documents) => ({
            id: documents.id,
            slug: documents.slug,
            title: documents.title
        }))
    };
}

export const actions = {
    default: async ({ request, fetch }) => {
        const formData = await request.formData();
        const title = formData.get('title') as string;

        if (!title) {
            throw error(400, 'Title is required');
        }

        const response = await fetch(`/api/document`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
        });

        if (!response.ok) {
            throw error(response.status, 'Failed to create document');
        }

        return { success: true };
    }
};
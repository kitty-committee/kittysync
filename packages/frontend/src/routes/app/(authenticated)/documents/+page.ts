import type { PageLoad } from "./$types";
import {error} from "@sveltejs/kit";

type DocimentRecord = {
    id: string;
    title: string;
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
            title: documents.title
        }))
    };
}

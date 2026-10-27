import type { PageLoad } from "./$types";
import { error } from "@sveltejs/kit";

/**
    data type for the document record
    contains the following properties:
    - id: string, the id of the document
    - title: string, the title of the document
    - content: string, the content of the document
*/
type DocumentRecord = {
    id: string;
    title: string;
    content: string;
};

/* 
    Load the documents for the page.
    @param fetch - The fetch function for making API requests.
    @returns - A promise resolving to the loaded documents.
    will throw an error if the fetch fails.
*/
export const load: PageLoad = async ({ fetch }) => {
    const response = await fetch(`/api/documents`);

    if (!response.ok) {
        throw error(response.status, "Failed to fetch documents");
    }

    const documents: DocumentRecord[] = (await response.json()) as DocumentRecord[];

    return {
        summaries: documents.map((documents) => ({
            id: documents.id,
            title: documents.title,
        })),
    };
};

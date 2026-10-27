
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/*
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
    Load the document for the page.
    @param params - The URL parameters for the request, containing the document ID.
    @param fetch - The fetch function for making API requests.
    @returns - A promise resolving to the loaded document.
    will throw an error if the fetch fails.
*/
export const load: PageLoad = async ({params, fetch }) => {
    const response = await fetch(`/api/documents/${encodeURIComponent(params.id)}`);

    //404 error if the document is not found
    if (response.status === 404) {
        throw error(404, 'Document not found');
    }

    //500 error if the fetch fails
    if (!response.ok) {
        throw error(response.status, 'Failed to fetch document');
    }

    const documents: DocumentRecord[] = await response.json() as DocumentRecord[];
    const document = documents[0];

    //404 error if the document is not found
    if (!document) {
        throw error(404, 'Document not found');
    }

    return {
        document
    };
}
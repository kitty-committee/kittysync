
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

type DocumentRecord = {
    id: string;
    title: string;
    content: string;
};

export const load: PageLoad = async ({params, fetch }) => {
    const response = await fetch(`/api/document/${encodeURIComponent(params.id)}`);

    if (response.status === 404) {
        throw error(404, 'Document not found');
    }

    if (!response.ok) {
        throw error(response.status, 'Failed to fetch document');
    }

    const document: DocumentRecord = await response.json() as DocumentRecord;

    return {
        document
    };
}
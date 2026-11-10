import { fetchApi } from "#lib";
import type { PageLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageLoad = async ({ params, fetch }) => {
    switch ((await fetchApi(fetch, `documents/${params.id}`)).status) {
        case 200:
            break;
        case 404:
            throw error(404, "Document not found");
        default:
            throw error(500, "Failed to fetch document");
    };

    return {
        documentId: params.id,
    };
};

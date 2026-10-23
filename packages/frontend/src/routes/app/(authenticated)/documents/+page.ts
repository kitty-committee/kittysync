import { posts } from './data.js';
import { getDocuments } from '../../../../../backend/src/db/get-document.ts';
export function load() {
    return {
        summaries: posts.map((post) => ({
            id: post.id,
            slug: post.slug,
            title: post.title
        }))
    };
}
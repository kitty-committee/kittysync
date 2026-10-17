import { posts } from './data.js';

export function load() {
    return {
        summaries: posts.map((post) => ({
            id: post.id,
            slug: post.slug,
            title: post.title
        }))
    };
}
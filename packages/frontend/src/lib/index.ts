// place files you want to import through the `#lib` alias in this folder.

import { goto } from "$app/navigation";
import { resolve } from "$app/paths";

export function fetchApi(fetch: typeof window.fetch, url: string, init?: RequestInit): Promise<Response>;
export function fetchApi(url: string, init?: RequestInit): Promise<Response>;
export async function fetchApi(
    fetchOrUrl?: typeof window.fetch | string,
    urlOrInit?: string | RequestInit,
    init?: RequestInit,
): Promise<Response> {
    const fetch = typeof fetchOrUrl === "function" ? fetchOrUrl : window.fetch;
    const url = typeof fetchOrUrl === "string" ? fetchOrUrl : (urlOrInit as string);
    const options = typeof fetchOrUrl === "string" ? (urlOrInit as RequestInit | undefined) : init;
    const api = await fetch(`/api/${url}`, { credentials: "include", ...options });
    if (api.status === 401) goto(resolve("/app/login"));
    return api;
}

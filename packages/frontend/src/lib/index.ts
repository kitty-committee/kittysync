// place files you want to import through the `#lib` alias in this folder.

export async function fetchApi(url: string, init?: RequestInit) {
    const api = await fetch(`/api/${url}`, { credentials: "include", ...init });
    return api;
}

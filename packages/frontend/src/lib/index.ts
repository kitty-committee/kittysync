// place files you want to import through the `#lib` alias in this folder.
import { redirect } from "@sveltejs/kit";

export async function fetchApi(url: string, init?: RequestInit) {
    const api = await fetch(`/api/${url}`, { credentials: "include", ...init });
    if (api.status == 401) {
        redirect(307, "../login?login");
    }
    return api;
}

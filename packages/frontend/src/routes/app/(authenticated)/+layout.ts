import type { LayoutLoad } from "../../$types";
import { redirect } from "@sveltejs/kit";
import { fetchApi } from "#lib";
const loginLink = "/app/login?returnPage=";

// replace with code for redirecting to the login page if the user is not authenticated
export const load: LayoutLoad = async ({ url }) => {
    // If statement to redirect loggedout users
    if (window.cookieStore?.get && (await window.cookieStore.get("session")) === null) {
        redirect(307, loginLink + url.pathname);
    }

    // userData defined
    const api = await fetchApi("auth/session?session");

    // If statement to redirect loggedout users
    if (!api.ok) {
        redirect(307, loginLink + url.pathname);
    }

    return { api };
};

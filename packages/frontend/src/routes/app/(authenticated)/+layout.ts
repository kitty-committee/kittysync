import { redirect } from "@sveltejs/kit";
import { fetchApi } from "#lib";

// replace with code for redirecting to the login page if the user is not authenticated
export async function load() {
    // If statement to redirect loggedout users
    if (window.cookieStore?.get && (await window.cookieStore.get("session")) === null) {
        redirect(307, "../login?login");
    }

    // userData defined
    const api = await fetchApi("auth/session?session");

    // If statement to redirect loggedout users
    if (!api.ok) {
        redirect(307, "../login?login");
    }

    return { api };
}

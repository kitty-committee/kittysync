import type { LayoutLoad } from "../../$types";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { fetchApi } from "#lib";

// replace with code for redirecting to the login page if the user is not authenticated
export const load: LayoutLoad = async ({ url }) => {
    // If statement to redirect loggedout users
    if (window.cookieStore?.get && (await window.cookieStore.get("session")) === null) {
        loginRedirect(url.pathname);
    }

    // userData defined
    const api = await fetchApi("auth/session?session");

    // If statement to redirect loggedout users
    if (!api.ok) {
        loginRedirect(url.pathname);
    }

    return { api };
};

async function loginRedirect(url: string) {
    sessionStorage.setItem("return-page", url);
    await goto(resolve("/app/login"));
}

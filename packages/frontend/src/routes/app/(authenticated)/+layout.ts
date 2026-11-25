import { userDbSchema } from "@kittysync/common";
import { fetchApi, loginRedirect } from "#lib";
import type { LayoutLoad } from "./$types";
import { error } from "@sveltejs/kit";

// replace with code for redirecting to the login page if the user is not authenticated
export const load: LayoutLoad = async ({ url, fetch }) => {
    // If statement to redirect loggedout users
    if (window.cookieStore?.get && (await window.cookieStore.get("session")) === null) {
        await loginRedirect(url.pathname);
        error(401, "User not authenticated");
    }

    // userData defined
    const api = await fetchApi(fetch, "auth/session?session");

    // If statement to redirect loggedout users
    if (!api.ok) {
        await loginRedirect(url.pathname);
        error(401, "User not authenticated");
    }

    const user = userDbSchema.parse(await api.json());

    return { user };
};

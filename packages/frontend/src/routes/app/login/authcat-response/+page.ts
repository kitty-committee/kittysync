import type { PageLoad } from "./$types";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";

export const load: PageLoad = async ({ url }) => {
    if (url.searchParams.has("error")) {
        return {
            error: url.searchParams.get("error"),
        };
    } else {
        if (!url.searchParams.has("code")) {
            return { error: "Grant code is missing!" };
        }

        const response = await fetch("/api/auth/session/grant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: url.searchParams.get("code"),
            }),
        });

        if (response.status === 200) {
            goto(resolve("/app/(authenticated)/documents"));
        } else {
            return { error: `Backend returned unexpected status ${response.status}: ${response.statusText}` };
        }
    }

    return { error: undefined };
};

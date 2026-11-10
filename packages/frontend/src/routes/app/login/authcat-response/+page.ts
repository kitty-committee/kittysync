import type { PageLoad } from "./$types";

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
            body: JSON.stringify({
                code: url.searchParams.get("code"),
            }),
        });
    }

    return { error: undefined };
};

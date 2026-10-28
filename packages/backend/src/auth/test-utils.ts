import type { UserDb } from "@kittysync/common";

/**
 * Creates a valid session token for the given user and returns a cookie header object which can be used to authenticate requests.
 * @param {string | number} port - The port on which the API is running
 * @param {UserDb} user - The user for whom to create a session token
 * @returns {Promise<{ Cookie: string }>} A promise resolving to an object containing the session cookie
 */
export async function mockSession(
    port: string | number,
    user: UserDb = { username: "mock-user", id: crypto.randomUUID() },
) {
    const password = "hello-world";

    console.log("===== CREATING MOCK USER =====");
    const newUserResponse = await fetch(`http:localhost:${port}/api/auth/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, password: password }),
    });

    if (newUserResponse.status === 500) {
        throw new Error("Failed to create mock user, API returned 500.");
    }

    // At this point, either the user already exists and new_user_response gave 500, or it
    // was created and returned 201.

    const loginResponse = await fetch(`http://localhost:${port}/api/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: user.username,
            password: password,
        }),
    });

    if (loginResponse.status !== 200) {
        throw new Error("Failed to login to mock user.");
    }

    console.log("===== CREATED AND LOGGED IN MOCK USER =====");

    const setCookies = loginResponse.headers.getSetCookie();
    let sessionToken: string | undefined;
    for (let i = 0; i < setCookies.length; i++) {
        if (setCookies[i].match(/session=(.*)/) !== null) {
            sessionToken = setCookies[i];
            break;
        }
    }

    if (sessionToken === undefined) {
        throw new Error("Failed to extract session token from login response.");
    }

    return {
        Cookie: sessionToken,
    };
}

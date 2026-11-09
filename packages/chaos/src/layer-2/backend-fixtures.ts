import { userDbSchema, type UserDb } from "@kittysync/common";

export type TestIdentity = {
    cookie: string;
    user: UserDb;
};

export async function createIdentity(baseUrl: string, username: string): Promise<TestIdentity> {
    const password = "chaos-test-password";
    const createUserResponse = await fetch(`${baseUrl}/api/auth/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, password }),
    });
    if (createUserResponse.status !== 201) {
        throw new Error(`Failed to create chaos test user: HTTP ${createUserResponse.status}`);
    }

    const loginResponse = await fetch(`${baseUrl}/api/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, password }),
    });
    if (loginResponse.status !== 200) {
        throw new Error(`Failed to authenticate chaos test user: HTTP ${loginResponse.status}`);
    }

    const cookieHeader = loginResponse.headers.getSetCookie().find((cookie) => cookie.startsWith("session="));
    const cookieValue = cookieHeader?.match(/^session=([^;]+)/)?.[1];
    if (cookieValue === undefined) {
        throw new Error("Backend did not return a session cookie for the chaos test user");
    }

    const userResponse = await fetch(`${baseUrl}/api/auth/session`, {
        headers: { Cookie: `session=${cookieValue}` },
    });
    if (userResponse.status !== 200) {
        throw new Error(`Failed to retrieve chaos test user: HTTP ${userResponse.status}`);
    }

    return {
        cookie: `session=${cookieValue}`,
        user: userDbSchema.parse(await userResponse.json()),
    };
}

export async function createDocument(baseUrl: string, cookie: string, title: string): Promise<string> {
    const response = await fetch(`${baseUrl}/api/documents`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: cookie,
        },
        body: JSON.stringify({ title }),
    });
    if (response.status !== 201) {
        throw new Error(`Failed to create chaos test document: HTTP ${response.status}`);
    }

    const document: unknown = await response.json();
    if (document === null || typeof document !== "object" || !("id" in document) || typeof document.id !== "string") {
        throw new Error("Backend returned an invalid document response");
    }

    return document.id;
}

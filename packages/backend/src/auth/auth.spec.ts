import { expect, test, beforeEach, afterEach } from "vitest";
import { type UserDb } from "@kittysync/common";
import { mockSession } from "./test-utils.ts";
import { createApp } from "../app.ts";

let app: Awaited<ReturnType<typeof createApp>>;

beforeEach(async () => {
    app = await createApp();
    await app.listen();
});

afterEach(async () => {
    await app.close();
});

test("Create user", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    let response = await fetch(`http://localhost:${port}/api/auth/user`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: `test-user_${new Date().getTime()}`,
            password: "hello-world",
        }),
    });

    expect(response.status).toBe(201);
});

test("Create user - Bad request", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    const response = await fetch(`http://localhost:${port}/api/auth/user`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: "t",
            password: "hello-world",
        }),
    });

    expect(response.status).toBe(400);
});

test("Create new session", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    const session = await mockSession(port!);

    expect(session.Cookie).toMatch(/session=(.*)/);
});

test("Create new session - Bad request", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    const response = await fetch(`http://localhost:${port}/api/auth/session`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: "t",
            password: "hello-world",
        }),
    });

    expect(response.status).toBe(400);
});

test("Create new session - Invalid credentials", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    const response = await fetch(`http://localhost:${port}/api/auth/session`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: "test-user",
            password: "hello",
        }),
    });

    expect(response.status).toBe(401);
});

test("Get / Validate session data", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    const response = await fetch(`http://localhost:${port}/api/auth/session`, {
        method: "GET",
        headers: {
            ...(await mockSession(port!)),
        },
    });

    expect(response.status).toBe(200);
    const body: UserDb = (await response.json()) as UserDb;
    expect(body.username).toBe("mock-user");
});

test("Search user data", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    const response = await fetch(`http://localhost:${port}/api/auth/user?username=test-user%`, {
        headers: await mockSession(port!),
        method: "GET",
    });

    expect(response.status).toBe(200);

    const body: UserDb[] = (await response.json()) as UserDb[];
    expect(body.length).toBeGreaterThan(0);
});

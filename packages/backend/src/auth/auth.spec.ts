import { expect, test } from "vitest";
import { app } from "../app.ts";
import { regex } from "zod";
import { type UserDb } from "@kittysync/common";

test("Create user", async () => {
    await app.listen();
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;
    let form = new FormData();
    form.append("username", "test-user");
    form.append("password", "hello-world");

    let response = await fetch(`http://localhost:${port}/api/auth/user`, {
        method: "POST",
        body: form,
    });

    expect(response.status).toBe(200);

    form = new FormData();
    form.append("username", "t");
    form.append("password", "hello-world");

    response = await fetch(`http://localhost:${port}/api/auth/user`, {
        method: "POST",
        body: form,
    });

    expect(response.status).toBe(400);
});

test("Create new session", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;
    let form = new FormData();
    form.append("username", "test-user");
    form.append("password", "hello-world");

    let response = await fetch(`http://localhost:${port}/api/auth/session`, {
        method: "POST",
        body: form,
    });

    const set_cookies = response.headers.getSetCookie();
    expect(set_cookies.length).toBe(1);
    expect(set_cookies[0]).toMatch(/session=(.*)/);
    expect(response.status).toBe(200);
});

test("Create new session - Bad request", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;
    let form = new FormData();
    form.append("username", "t");
    form.append("password", "hello-world");

    const response = await fetch(`http://localhost:${port}/api/auth/session`, {
        method: "POST",
        body: form,
    });

    expect(response.status).toBe(400);
});

test("Create new session - Invalid credentials", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;
    let form = new FormData();
    form.append("username", "test-user");
    form.append("password", "hello");

    const response = await fetch(`http://localhost:${port}/api/auth/session`, {
        method: "POST",
        body: form,
    });

    expect(response.status).toBe(401);
});

test("Get / Validate session data", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;
    let form = new FormData();
    form.append("username", "test-user");
    form.append("password", "hello-world");

    let response = await fetch(`http://localhost:${port}/api/auth/session`, {
        method: "POST",
        body: form,
    });

    expect(response.status).toBe(200);
    const cookie = response.headers.getSetCookie()[0];
    const regex = /session=([^;]*)/;
    const session = cookie.match(regex)![1];

    response = await fetch(`http://localhost:${port}/api/auth/session`, {
        method: "GET",
        headers: {
            Cookie: `session=${session}`,
        },
    });

    expect(response.status).toBe(200);
    const body: UserDb = (await response.json()) as UserDb;
    expect(body.username).toBe("test-user");
});

test("Search user data", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    let response = await fetch(`http://localhost:${port}/api/auth/user?username=%`, {
        method: "GET",
    });

    expect(response.status).toBe(200);

    const body: UserDb[] = (await response.json()) as UserDb[];

    expect(body[0].username).toBe("test-user");
});

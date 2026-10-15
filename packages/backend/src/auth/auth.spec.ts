import { expect, test } from "vitest";
import { app } from "../app.ts";

test("Create user", async () => {
    await app.listen();
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    let response = await fetch(`http://localhost:${port}/api/auth/user`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: "test-user",
            password: "hello-world",
        }),
    });

    expect(response.status).toBe(200);

    response = await fetch(`http://localhost:${port}/api/auth/user`, {
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

    let response = await fetch(`http://localhost:${port}/api/auth/session`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: "test-user",
            password: "hello-world",
        }),
    });

    expect(response.status).toBe(200);

    response = await fetch(`http://localhost:${port}/api/auth/session`, {
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
            password: "oogabooga",
        }),
    });

    expect(response.status).toBe(401);
});

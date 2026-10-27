
import { expect, test } from "vitest";
import { app } from "../app.ts";

test("Create document", async () => {
    await app.listen();
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    let response = await fetch(`http://localhost:${port}/api/document/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            title: "test-document",
        }),
    });

    expect(response.status).toBe(201);

    response = await fetch(`http://localhost:${port}/api/document/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    expect(response.status).toBe(500);
});

test("Get document by ID", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    let response = await fetch(`http://localhost:${port}/api/document/db11a2dd-d4a1-4386-a839-8d1cbfdba7a9/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    expect(response.status).toBe(200);

    response = await fetch(`http://localhost:${port}/api/document/invalid-id/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    expect(response.status).toBe(404);
});

test("get all documents", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    const response = await fetch(`http://localhost:${port}/api/document/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    expect(response.status).toBe(200);
});


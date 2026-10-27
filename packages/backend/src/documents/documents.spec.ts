import { mockSession } from "../auth/test-utils.ts";
import { expect, test, beforeEach, afterEach } from "vitest";
import { createApp } from "../app.ts";

let app: Awaited<ReturnType<typeof createApp>>;

beforeEach(async () => {
    app = await createApp();
    await app.listen();
});

afterEach(async () => {
    await app.close();
});

test("Create document", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    let response = await fetch(`http://localhost:${port}/api/documents`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession(port!)),
        },
        body: JSON.stringify({
            title: "test-document",
        }),
    });

    expect(response.status).toBe(201);

    response = await fetch(`http://localhost:${port}/api/documents`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession(port!)),
        },
    });

    expect(response.status).toBe(400);
});

test("Get document by ID", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;
    await fetch(`http://localhost:${port}/api/documents`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession(port!)),
        },
        body: JSON.stringify({
            title: "test-document",
        }),
    });

    const getDocument = await fetch(`http://localhost:${port}/api/documents`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession(port!)),
        },
    });

    const documentId = (await getDocument.json()) as { id: string; title: string }[];
    let response = await fetch(`http://localhost:${port}/api/documents/${documentId[0].id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession(port!)),
        },
    });

    expect(response.status).toBe(200);

    response = await fetch(`http://localhost:${port}/api/documents/invalid-id`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession(port!)),
        },
    });

    expect(response.status).toBe(400);
});

test("get all documents", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    const response = await fetch(`http://localhost:${port}/api/documents`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession(port!)),
        },
    });

    expect(response.status).toBe(200);
});

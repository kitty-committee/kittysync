import { mockSession } from "../auth/auth.spec.ts";
import { expect, test } from "vitest";
import { app } from "../app.ts";

test("Create document", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    let response = await fetch(`http://localhost:${port}/api/documents`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession()),
        },
        body: JSON.stringify({
            title: "test-document",
        }),
    });

    expect(response.status).toBe(201);

    response = await fetch(`http://localhost:${port}/api/documents`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession()),
        },
    });

    expect(response.status).toBe(500);
});

test("Get document by ID", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;
    const tempdocument = await fetch(`http://localhost:${port}/api/documents`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession()),
        },
        body: JSON.stringify({
            title: "test-document",
        }),
    });

    const documentId: string = (await tempdocument.json()) as string;

    let response = await fetch(`http://localhost:${port}/api/documents/${documentId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession()),
        },
    });

    expect(response.status).toBe(200);

    response = await fetch(`http://localhost:${port}/api/documents/invalid-id`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession()),
        },
    });

    expect(response.status).toBe(404);
});

test("get all documents", async () => {
    await app.ready();

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    const response = await fetch(`http://localhost:${port}/api/documents`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession()),
        },
    });

    expect(response.status).toBe(200);
});

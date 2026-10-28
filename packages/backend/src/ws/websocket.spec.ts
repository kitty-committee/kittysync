import { parseWebsocketPacket } from "./websocket.handler.ts";
import { expect, test, beforeEach, afterEach } from "vitest";
import { mockSession } from "../auth/test-utils.ts";
import { type WsPacket } from "@kittysync/common";
import { createApp } from "../app.ts";

let app: Awaited<ReturnType<typeof createApp>>;

let id = "";

let address = undefined;
let port: string | number | undefined = undefined;
beforeEach(async () => {
    app = await createApp();
    await app.listen();
    address = app.server.address();
    port = typeof address === "string" ? address : address?.port;
    id = await createMockDocument();
});

afterEach(async () => {
    await app.close();
});

/**
 * Creates a valid session token for the given user and returns a cookie header object which can be used to authenticate requests.
 * @param user
 * @returns
 */

export async function createMockDocument() {
    await app.ready();
    const createResponse = await fetch(`http://localhost:${port}/api/documents`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await mockSession(port!)),
        },
        body: JSON.stringify({
            title: "abc.txt",
        }),
    });

    expect(createResponse.status).toBe(201);

    const createdDocument = (await createResponse.json()) as {
        id: string;
        title: string;
        content: string;
        authorId: string;
    };

    return createdDocument.id;
}

test("connect to websocket", async () => {
    await app.ready();

    const ws = await app.injectWS(`/api/websocket?fileID=${id}`, { headers: await mockSession(port!) });

    let fileResolve: (value: WsPacket | PromiseLike<WsPacket>) => void;
    const filePromise = new Promise<WsPacket>((r) => {
        fileResolve = r;
    });

    let userResolve: (value: WsPacket | PromiseLike<WsPacket>) => void;
    const userPromise = new Promise<WsPacket>((r) => {
        userResolve = r;
    });

    const packet: WsPacket = { type: "open", data: null };
    ws.send(JSON.stringify(packet));

    ws.on("message", (data) => {
        const packetData = parseWebsocketPacket(data);
        switch (packetData.type) {
            case "updateFile":
                fileResolve(packetData);
                break;
            case "updateUsers":
                userResolve(packetData);
                break;
            default:
                break;
        }
    });

    expect((await filePromise).data).toStrictEqual({ file: "this is a file" });
    expect(((await userPromise).data as { userList: string[] }).userList.length).toStrictEqual(1);

    ws.terminate();
});

test("connect two users to websocket", async () => {
    await app.ready();

    const ws1 = await app.injectWS(`/api/websocket?fileID=${id}`, { headers: await mockSession(port!) });
    const ws2 = await app.injectWS(`/api/websocket?fileID=${id}`, { headers: await mockSession(port!) });

    let ws1UserCountResolve: (value: number | PromiseLike<number>) => void;
    const ws1UserCountPromise = new Promise<number>((r) => {
        ws1UserCountResolve = r;
    });

    let ws2UserCountResolve: (value: number | PromiseLike<number>) => void;
    const ws2UserCountPromise = new Promise<number>((r) => {
        ws2UserCountResolve = r;
    });

    ws1.on("message", (data) => {
        const packetData = parseWebsocketPacket(data);
        switch (packetData.type) {
            case "updateFile":
                break;
            case "updateUsers":
                ws1UserCountResolve(packetData.data.userList.length);
                break;
            default:
                break;
        }
    });

    ws2.on("message", (data) => {
        const packetData = parseWebsocketPacket(data);
        switch (packetData.type) {
            case "updateFile":
                break;
            case "updateUsers":
                ws2UserCountResolve(packetData.data.userList.length);
                break;
            default:
                break;
        }
    });

    const packet: WsPacket = { type: "open", data: null };
    ws1.send(JSON.stringify(packet));
    const usercount1 = await ws1UserCountPromise;

    ws2.send(JSON.stringify(packet));
    const usercount2 = await ws2UserCountPromise;

    ws1.terminate();
    ws2.terminate();

    expect(usercount1).toBe(1);
    expect(usercount2).toBe(2);
});

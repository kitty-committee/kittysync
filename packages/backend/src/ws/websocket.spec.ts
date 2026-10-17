import { expect, test } from "vitest";
import { app } from "../app.ts";
import { packetSchema, type WsPacket } from "@kittysync/common";

test("connect to websocket", async () => {
    await app.listen();
    await app.ready();

    const ws = await app.injectWS('/websocket?fileID=abc.txt', { headers: { "api-key": "some-random-key" } });

    let fileResolve: (value: WsPacket | PromiseLike<WsPacket>) => void;
    const filePromise = new Promise<WsPacket>(r => { fileResolve = r })

    let userResolve: (value: WsPacket | PromiseLike<WsPacket>) => void;
    const userPromise = new Promise<WsPacket>(r => { userResolve = r })

    ws.on('message', (data: string) => {
        const packetData = packetSchema.parse(data);
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
    })

    ws.close();

    expect((await filePromise).data).toBe({ file: "this is a file" });
    expect(((await userPromise).data as { userList: string[] }).userList.length).toBe(1);
})
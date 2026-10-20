import { expect, test } from "vitest";
import { app } from "../app.ts";
import { packetSchema, type WsPacket } from "@kittysync/common";
import { send } from "process";

test("connect to websocket", async () => {
    await app.listen();
    await app.ready();

    console.log("app ready");

    const ws = await app.injectWS('/api/websocket?fileID=abc.txt',);


    let fileResolve: (value: WsPacket | PromiseLike<WsPacket>) => void;
    const filePromise = new Promise<WsPacket>(r => { fileResolve = r })

    let userResolve: (value: WsPacket | PromiseLike<WsPacket>) => void;
    const userPromise = new Promise<WsPacket>(r => { userResolve = r })

    const packet: WsPacket = { type: "open", data: null }
    ws.send(JSON.stringify(packet));

    ws.on('message', data => {
        const messageData = JSON.parse(data.toString());
        const packetData = packetSchema.parse(messageData);
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

    expect((await filePromise).data).toStrictEqual({ file: "this is a file" });
    expect(((await userPromise).data as { userList: string[] }).userList.length).toStrictEqual(1);
})
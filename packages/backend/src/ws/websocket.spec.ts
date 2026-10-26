import { expect, test } from "vitest";
import { app } from "../app.ts";
import { packetSchema, type WsPacket } from "@kittysync/common";

test("connect to websocket", async () => {
    await app.listen();
    await app.ready();

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

    expect((await filePromise).data).toStrictEqual({ file: "this is a file" });
    expect(((await userPromise).data as { userList: string[] }).userList.length).toStrictEqual(1);

    ws.terminate();

})

test("connect two users to websocket", async () => {
    await app.ready();

    const ws1 = await app.injectWS('/api/websocket?fileID=abc.txt',);
    const ws2 = await app.injectWS('/api/websocket?fileID=abc.txt',);

    let ws1UserCountResolve: (value: number | PromiseLike<number>) => void;
    const ws1UserCountPromise = new Promise<number>(r => { ws1UserCountResolve = r })

    let ws2UserCountResolve: (value: number | PromiseLike<number>) => void;
    const ws2UserCountPromise = new Promise<number>(r => { ws2UserCountResolve = r })


    ws1.on('message', data => {
        const messageData = JSON.parse(data.toString());
        const packetData = packetSchema.parse(messageData);
        console.log(packetData)
        switch (packetData.type) {
            case "updateFile":
                break;
            case "updateUsers":
                ws1UserCountResolve((packetData.data).userList.length)
                break;
            default:
                break;
        }
    })

    ws2.on('message', data => {
        const messageData = JSON.parse(data.toString());
        const packetData = packetSchema.parse(messageData);
        console.log(packetData)
        switch (packetData.type) {
            case "updateFile":
                break;
            case "updateUsers":
                ws2UserCountResolve((packetData.data).userList.length)
                break;
            default:
                break;
        }
    })

    const packet: WsPacket = { type: "open", data: null }
    ws1.send(JSON.stringify(packet));

    ws2.send(JSON.stringify(packet));

    const usercount1 = await ws1UserCountPromise;
    const usercount2 = await ws2UserCountPromise;

    ws2.terminate();

    ws1.terminate();


    expect(usercount1).toBe(1);
    expect(usercount2).toBe(2);
})
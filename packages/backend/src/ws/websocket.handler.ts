import Fastify from "fastify";
import { type WebSocket } from "@fastify/websocket";
import { packetSchema, type WsPacket } from "@kittysync/common";
import * as z from "zod";

const fileUsersMap = new Map<string, string[]>();

export function registerWebsocketRoutes(app: Fastify.FastifyInstance) {
    fileUsersMap.clear();
    app.get('/websocket', { websocket: true }, (socket: WebSocket, req: Fastify.FastifyRequest<{ Querystring: { fileId: string } }>) => {
        // update file user map
        const { fileId } = req.query;

        fileUsersMap.getOrInsert(fileId, []).push(req.ip)

        //send the file on connection
        let packet: WsPacket;
        packet = { type: "updateFile", data: { file: "this is a file" } }
        socket.send(JSON.stringify(packet));

        // send list of users connected to that file
        packet = { type: "updateUsers", data: { userList: fileUsersMap.get(fileId) ?? [] } }
        socket.send(JSON.stringify(packet));

    })
}
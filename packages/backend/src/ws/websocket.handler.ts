import Fastify from "fastify";
import { type WebSocket } from "@fastify/websocket";
import { packetSchema, type WsPacket, } from "@kittysync/common";
import { clearMaps, addNewUserToFile, removeUserFromFile, updateFileForAllUsers } from "./websocket.files.ts";
import * as z from "zod";

const fileIdSchema = z.object({
    fileID: z.string()
});

export function registerWebsocketRoutes(app: Fastify.FastifyInstance) {
    clearMaps();
    app.get('/api/websocket', { websocket: true }, (socket: WebSocket, req: Fastify.FastifyRequest<{Querystring:{fileID:string}}>) => {
        const request = (req as unknown as{ request: { query: {fileID: string} }}).request;

        // update file user map
        const fileID = fileIdSchema.parse(request.query).fileID;

        addNewUserToFile(fileID, socket, req.ip);

        // recived message handling

        socket.on('message', message => {
            const packet: WsPacket = packetSchema.parse(message);

            switch (packet.type) {
                case "saveFile":
                    updateFileForAllUsers(fileID, (packet.data as { file: string }).file)
                    break;
                case "error":
                    console.log(packet.data);
                    break;
                default:
                    console.log("unknown packet type");
                    break;
            }
        })

        socket.on('close', () => removeUserFromFile(fileID, socket, req.ip));
    })
}
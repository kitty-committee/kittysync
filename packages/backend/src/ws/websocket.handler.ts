import Fastify from "fastify";
import { type WebSocket } from "@fastify/websocket";
import { packetSchema, type WsPacket, } from "@kittysync/common";
import { clearMaps, addNewUserToFile, removeUserFromFile, updateFileForAllUsers } from "./websocket.files.ts";
import * as z from "zod";
import { convertProcessSignalToExitCode } from "util";

const fileIdSchema = z.object({
    fileID: z.string()
});

export function registerWebsocketRoutes(app: Fastify.FastifyInstance) {
    clearMaps();
    app.register(async function (app) {
        app.get('/api/websocket', { websocket: true }, (socket: WebSocket, req: Fastify.FastifyRequest<{ Querystring: { fileID: string } }>) => {

            const{fileID} = req.query;

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
    })
}
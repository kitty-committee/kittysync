import Fastify from "fastify";
import { type WebSocket } from "@fastify/websocket";
import { packetSchema, } from "@kittysync/common";
import { clearMaps, addNewUserToFile } from "./websocket.files.ts";


export function registerWebsocketRoutes(app: Fastify.FastifyInstance) {
    clearMaps();
    app.get('/websocket', { websocket: true }, (socket: WebSocket, req: Fastify.FastifyRequest<{ Querystring: { fileId: string } }>) => {
        // update file user map
        const { fileId } = req.query;

        addNewUserToFile(fileId, socket, req.ip);

        // recived message handling

        socket.on('message', message => {
            const packet = packetSchema.parse(message);

            switch (packet.type) {
                case "saveFile":
                    console.log(packet.data);
                    break;
                case "error":
                    console.log(packet.data);
                    break;
                default:
                    console.log("unknown packet type");
                    break;
            }
        })
    })
}
import Fastify from "fastify";
import { type WebSocket } from "@fastify/websocket";
import { packetSchema, type WsPacket, } from "@kittysync/common";
import { clearMaps, addNewUserToFile, removeUserFromFile, updateFileForAllUsers, addNewUserToFileMap, removeUserFromFileMap } from "./websocket.files.ts";
import { redis } from "../app.ts";
import { wsRedisPacketSchema, type WsRedisPacket } from "./ws-redis-packet.ts";


export async function registerWebsocketRoutes(app: Fastify.FastifyInstance) {
    clearMaps();
    await redis.subscribe("ws-channel", (err) => {
        if (err) {
            console.log(err)
        }
    })

    redis.on("message", (channel, message) => {
        if (channel === "ws-channel") {
            const messageData: WsRedisPacket = wsRedisPacketSchema.parse(JSON.parse(message));
            switch (messageData.command) {
                case "addUserFile":
                    addNewUserToFileMap(messageData.data.fileID, messageData.data.userID);
                    break;
                case "removeUserFile":
                    removeUserFromFileMap(messageData.data.fileID, messageData.data.userID);
                    break;
                case "saveFile":
                    updateFileForAllUsers(messageData.data.fileID, messageData.data.fileData);
                    break;
            }
        }
    })

    app.register(function (app) {
        app.get('/api/websocket', { websocket: true }, (socket: WebSocket, req: Fastify.FastifyRequest<{ Querystring: { fileID: string } }>) => {

            const { fileID } = req.query;


            // recived message handling
            socket.on('message', (message) => {
                const packet: WsPacket = packetSchema.parse(JSON.parse(message.toString()));

                switch (packet.type) {
                    case "open":
                        addNewUserToFile(fileID, socket, req.ip ?? "user");
                        break;
                    case "saveFile":
                        updateFileForAllUsers(fileID, (packet.data).file)
                        break;
                    case "error":
                        console.log(packet.data);
                        break;
                    default:
                        console.log("unknown packet type");
                        break;
                }
            })

            socket.on('close', () => removeUserFromFile(fileID, socket, req.ip ?? "user"));
        })
    })
}
import {
    clearMaps,
    addNewUserToFile,
    removeUserFromFile,
    updateFileForAllUsers,
    addNewUserToFileMap,
    removeUserFromFileMap,
} from "./websocket.files.ts";
import { wsRedisPacketSchema, type WsRedisPacket } from "./ws-redis-packet.ts";
import { packetSchema, type WsPacket } from "@kittysync/common";
import { type WebSocket } from "@fastify/websocket";
import { authenticationHook } from "../util.ts";
import { redis } from "../app.ts";
import type { RawData } from "ws";
import Fastify from "fastify";

/**
 * Parses a raw WebSocket message into a WsPacket object.
 * @param message Raw data received from the WebSocket connection
 * @returns A WsPacket object parsed from the message
 * @throws SyntaxError if the message is not a valid JSON string
 * @throws ZodError if the message does not conform to the WsPacket schema
 */
export function parseWebsocketPacket(message: RawData): WsPacket {
    let buffer: Buffer;
    if (Array.isArray(message)) buffer = Buffer.concat(message);
    else if (Buffer.isBuffer(message)) buffer = message;
    else buffer = Buffer.from(message);
    return packetSchema.parse(JSON.parse(buffer.toString("utf8")));
}

export async function registerWebsocketRoutes(app: Fastify.FastifyInstance) {
    console.log("beforemaps")
    clearMaps();
    console.log("after maps")
    await redis.subscribe("ws-channel", (err) => {
        if (err) {
            console.log(err);
        }
    });


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
    });

    app.register(function (app) {
        app.addHook("preHandler", authenticationHook);

        app.get(
            '/api/websocket',
            { websocket: true, },
            (socket: WebSocket, req: Fastify.FastifyRequest<{ Querystring: { fileID: string } }>) => {
                const { fileID } = req.query;

                // received message handling
                socket.on("message", (message) => {
                    const packet = parseWebsocketPacket(message);

                    switch (packet.type) {
                        case "open":
                            addNewUserToFile(fileID, socket, req.user?.username ?? "unknownUser");
                            break;
                        case "saveFile":
                            updateFileForAllUsers(fileID, packet.data.file);
                            break;
                        case "error":
                            console.log(packet.data);
                            break;
                        default:
                            console.log("unknown packet type");
                            break;
                    }
                });

                socket.on("close", () => removeUserFromFile(fileID, socket, req.user?.username ?? "unknownUser"));
            },
        );
    });
}

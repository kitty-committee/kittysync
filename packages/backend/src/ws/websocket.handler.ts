import { authenticationHook, updateDocument } from "../util.ts";
import { type WebSocket } from "@fastify/websocket";
import { createRedis, redis } from "../app.ts";
import type { RawData } from "ws";
import Fastify from "fastify";
import { serverboundPacketSchema, clientboundPacketSchema, type ClientboundPacket, type ServerboundPacket } from "@kittysync/common/src/packet.ts";
import type { UserDb } from "@kittysync/common";
import { getDocuments } from "../documents/get.handler.ts";
import type Redis from "ioredis";

const documents = new Map<string, DocumentManager>();

/**
 * Parses a raw WebSocket message into a WsPacket object.
 * @param {RawData}message Raw data received from the WebSocket connection
 * @returns {WsPacket} A WsPacket object parsed from the message
 * @throws {SyntaxError} if the message is not a valid JSON string
 * @throws {ZodError} if the message does not conform to the WsPacket schema
 */
export function parseWebsocketPacket(message: RawData): ServerboundPacket {
    let buffer: Buffer;
    if (Array.isArray(message)) buffer = Buffer.concat(message);
    else if (Buffer.isBuffer(message)) buffer = message;
    else buffer = Buffer.from(message);
    return serverboundPacketSchema.parse(JSON.parse(buffer.toString("utf8")));
}

export function registerWebsocketRoutes(app: Fastify.FastifyInstance) {
    documents.clear();

    app.addHook("onClose", () => {
        for (const manager of documents.values()) {
            manager.close();
        }
    });

    app.register(function (app) {
        app.addHook("preHandler", authenticationHook);

        app.get(
            "/api/document/:id/websocket",
            { websocket: true },
            async (socket: WebSocket, req: Fastify.FastifyRequest<{ Params: { id: string } }>) => {
                const documentId = req.params.id;

                if (getDocuments(documentId) === undefined) {
                    socket.send(JSON.stringify({ type: "error", data: { message: "404 Document not found" } }));
                    socket.close();
                    return;
                }

                const manager = documents.get(documentId) ?? await DocumentManager.create(documentId);
                await manager.addClient(socket, req.user as UserDb);
            },
        );
    });
}

class DocumentManager {
    private managedUsers: Set<UserManager> = new Set();
    private users: Set<string> = new Set();
    public readonly id: string;
    private redis: Redis.Redis;
    private content: string;

    static async create(id: string) {
        const users = new Set<string>(await redis.zrange(`document:${id}:users`, "0", "-1"));
        const content = (await getDocuments(id)).at(0);
        const manager = new DocumentManager(id, content?.content ?? "Example Document", users, createRedis());

        await manager.redis.subscribe(`document:${id}`, (err) => {
            if (err) console.error("Failed to subscribe to Redis channel:", err);
        });

        manager.redis.on("message", manager.redisListener.bind(manager));

        return manager;
    }

    private constructor(id: string, content: string, users: Set<string>, redis: Redis.Redis) {
        this.content = content;
        this.users = users;
        this.redis = redis;
        this.id = id;
    }

    private async heartbeat() {
        const key = `document:${this.id}:users`;
        const now = Date.now();

        const r = redis.multi();
        r.zadd(key, ...this.managedUsers.values().flatMap((user) => [now, user.salted]));
        r.zremrangebyscore(key, '-inf', now - 30_000);
        r.zrange(key, "0", "-1");
        const results = await r.exec();

        if (!results) {
            console.error("Heartbeat failed: no results from Redis exec");
            return;
        }

        for (const [err] of results) {
            if (err) {
                console.error("Heartbeat failed:", err);
                return;
            }
        }

        const current = new Set(results[results.length - 1][1] as string[]);
        if (this.users != current) {
            await this.publish({ type: "updateUsers", data: { userList: Array.from(current) } });
            this.users = current;
        }

    }

    public async addClient(socket: WebSocket, user: UserDb) {
        const manager = new UserManager(socket, user, this);
        manager.send({ type: "updateFile", data: { file: this.content } });
        this.managedUsers.add(manager);
        await this.heartbeat(); // heartbeat to propagate the new user
        return manager;
    }

    public async removeClient(manager: UserManager) {
        this.managedUsers.delete(manager);
        if (this.managedUsers.size === 0) this.close();

        // notify other users that this user has left
        this.users.delete(manager.salted);
        await redis.multi().zrem(`document:${this.id}:users`, manager.user.username).publish(`document:${this.id}`, JSON.stringify({ type: "updateUsers", data: { userList: Array.from(this.users) } } satisfies ClientboundPacket)).exec();
    }

    public close() {
        documents.delete(this.id);
        this.redis.disconnect();
    }

    private redisListener(channel: string, message: string) {
        if (channel !== `document:${this.id}`) return;

        let packet: ClientboundPacket;

        try {
            packet = clientboundPacketSchema.parse(JSON.parse(message));
        } catch (e) {
            console.error("Failed to parse message from Redis:", e);
            return;
        }

        switch (packet.type) {
            case "updateFile":
                this.content = packet.data.file;
                break;
            case "updateUsers":
                this.users = new Set(packet.data.userList);
                break;
            case "error":
                console.error("Error from Redis:", packet.data.message);
                break;
        }

        this.managedUsers.forEach((user) => user.send(packet));
    }

    public async publish(packet: ClientboundPacket) {
        await redis.publish(`document:${this.id}`, JSON.stringify(packet));
    }
}

class UserManager {
    public readonly document: DocumentManager;
    public readonly user: UserDb;
    public readonly salt: string;
    private socket: WebSocket;

    public get salted() {
        return `${this.user.id}:${this.salt}`;
    }

    constructor(socket: WebSocket, user: UserDb, document: DocumentManager) {
        this.salt = crypto.randomUUID();
        this.document = document;
        this.socket = socket;
        this.user = user;

        this.socket.on("message", (message) => void this.socketListener(message));
        this.socket.on("close", () => void this.document.removeClient(this));
        this.socket.on("error", (err) => {
            console.error("WebSocket error:", err);
            this.socket.close();
        });
    }

    public send(packet: ClientboundPacket) {
        this.socket.send(JSON.stringify(packet));
    }

    private async socketListener(message: RawData) {
        const packet = parseWebsocketPacket(message);

        switch (packet.type) {
            case "saveFile":
                await this.document.publish({ type: "updateFile", data: { file: packet.data.file } });
                await updateDocument(this.document.id, undefined, packet.data.file);
                break;
            case "error":
                console.error(packet.data);
                break;
            default:
                console.warn("unknown packet type");
                break;
        }
    }
}
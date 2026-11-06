import { SOCKET_ERROR_UNBOUND_CONNECTION, SOCKET_ERROR_UNSUPPORTED_MESSAGE, userDbSchema } from "@kittysync/common";
import type { Hocuspocus } from "@hocuspocus/server";
import { configuration } from "../configuration.ts";
import { type WebSocket } from "@fastify/websocket";
import { authenticationHook } from "../util.ts";
import { hocuspocus } from "../app.ts";
import Fastify from "fastify";
import * as z from "zod";

// Grrrrrrr
// Had to do this to get around some annoying type problems in @hocuspocus/server
// Ideally:
// import { type ClientConnection } from "@hocuspocus/server";
// ... but my LSP was complaining that this was not en exported type.
type ClientConnection = ReturnType<Hocuspocus["handleConnection"]>;

/** Maps sockets to client connections */
const clientConnections: Map<WebSocket, ClientConnection> = new Map<WebSocket, ClientConnection>();

export const contextSchema = z.object({
    user: userDbSchema,
});

/**
 * Register collaboration plugin
 * @param app Fastify instance
 */
export function register(app: Fastify.FastifyInstance) {
    app.get(
        "/api/collaboration",
        { preHandler: authenticationHook, websocket: true },
        (socket: WebSocket, req: Fastify.FastifyRequest) => {
            console.log("WebSocket handler reached");
            socket.binaryType = "arraybuffer";

            // Convert the fastify request to a base request type accepted by Hocuspocus,
            // making sure to include vital information (URL, headers, cookies, etc...)
            const request: Request = {
                url: `http://localhost:${configuration.backendPort}/api/collaboration`,
                headers: { ...req.headers },
                method: req.method,
                startTime: Date.now(),
                socket: req.raw.socket,
                raw: req.raw,
            } as unknown as Request;

            setImmediate(() => {
                console.log("Fastify handler complete, proxying websocket to hocuspocus.");

                socket.onmessage = (event) => {
                    const conn = clientConnections.get(event.target);

                    if (conn !== undefined) {
                        if (event.data instanceof ArrayBuffer) {
                            conn.handleMessage(new Uint8Array(event.data));
                        } else {
                            event.target.close(SOCKET_ERROR_UNSUPPORTED_MESSAGE, "String messages not supported");
                        }
                    } else {
                        event.target.close(SOCKET_ERROR_UNBOUND_CONNECTION, "Client connection does not exist!");
                        console.error("Client websocket connection could not be linked to a hocuspocus connection!");
                    }
                };

                socket.onclose = (event) => {
                    const conn = clientConnections.get(event.target);

                    if (conn !== undefined) {
                        conn.handleClose(event);
                    } else {
                        event.target.close(SOCKET_ERROR_UNBOUND_CONNECTION, "Client connection does not exist!");
                        console.error("Client websocket connection could not be linked to a hocuspocus connection!");
                    }
                };

                socket.on("pong", () => {
                    const conn = clientConnections.get(socket);

                    if (conn !== undefined) {
                        conn.touch();
                    } else {
                        socket.close(SOCKET_ERROR_UNBOUND_CONNECTION, "Client connection does not exist!");
                        console.error("Client websocket connection could not be linked to a hocuspocus connection!");
                    }
                });

                // Pass the raw request to hocuspocus to handle

                const clientConnection: ClientConnection = hocuspocus.handleConnection(socket, request, {
                    user: req.user,
                });
                clientConnections.set(socket, clientConnection);

                console.log("Deferred WebSocket setup complete");
            });

            console.log("WebSocket handler complete");
            return;
        },
    );
}

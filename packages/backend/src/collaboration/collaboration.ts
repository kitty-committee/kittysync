import { SOCKET_ERROR_UNBOUND_CONNECTION, SOCKET_ERROR_UNSUPPORTED_MESSAGE, userDbSchema } from "@kittysync/common";
import type { Hocuspocus } from "@hocuspocus/server";
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
            socket.binaryType = "arraybuffer";

            // Convert the fastify request to a vanilla request type accepted by Hocuspocus,
            // making sure to include vital information (URL, headers, cookies, etc...)
            const headers = new Headers();
            for (const [name, value] of Object.entries(req.headers)) {
                if (typeof value === "string") headers.set(name, value);
                else if (Array.isArray(value)) headers.set(name, value.join(", "));
            }

            const request = new Request(new URL(req.url, `http://${req.headers.host ?? "localhost"}`), {
                method: req.method,
                headers,
            });

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
                    clientConnections.delete(event.target);
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

            return;
        },
    );
}

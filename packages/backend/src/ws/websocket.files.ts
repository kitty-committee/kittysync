// import { getDocuments } from "../documents/get.handler.ts";
// import { type WsRedisPacket } from "./ws-redis-packet.ts";
// import { type WebSocket } from "@fastify/websocket";
// import { redis } from "../app.ts";

// const fileSocketsMap = new Map<string, WebSocket[]>();
// const fileUsersMap = new Map<string, string[]>();

// /**
//  * Clears the maps storing what sockets and what users are connected to what files
//  */
// export function clearMaps() {
//     fileUsersMap.clear();
//     fileSocketsMap.clear();
// }

// /**
//  * adds a new user and their connection to a file,
//  * @param {string} fileID the file to connect to
//  * @param {WebSocket} socket the ws connection
//  * @param {string} userID the user connecting
//  */
// export async function addNewUserToFile(fileID: string, socket: WebSocket, userID: string) {
//     let packet: WsPacket;
//     const file = (await getDocuments(fileID)).at(0);

//     if (file === undefined) {
//         packet = { type: "error", data: { message: "404 File not found" } };
//     } else {
//         packet = { type: "updateFile", data: { file: file.content } };

//         if (fileSocketsMap.get(fileID) === undefined) {
//             fileSocketsMap.set(fileID, []);
//         }
//         fileSocketsMap.get(fileID)?.push(socket);

//         const redisPacket: WsRedisPacket = { command: "addUserFile", data: { fileID: fileID, userID: userID } };
//         void redis.publish("ws-channel", JSON.stringify(redisPacket));
//     }

//     socket.send(JSON.stringify(packet));
// }

// /**
//  * adds a new user to the file map and then lets all users connected to that file know
//  * @param {string} fileID file to add the user to
//  * @param {string} userID the user to add
//  */
// export function addNewUserToFileMap(fileID: string, userID: string) {
//     if (fileUsersMap.get(fileID) === undefined) {
//         fileUsersMap.set(fileID, []);
//     }
//     fileUsersMap.get(fileID)?.push(userID);
//     console.log("updating user lists");
//     updateAllUserListsOnFile(fileID);
// }

// /**
//  * sends the userlist for a specific file to all connections to that file on this server
//  * @param {string} fileID the file send the user list for
//  */
// function updateAllUserListsOnFile(fileID: string) {
//     const packet: WsPacket = { type: "updateUsers", data: { userList: fileUsersMap.get(fileID) ?? [] } };
//     const jsonPacket = JSON.stringify(packet);
//     (fileSocketsMap.get(fileID) ?? []).forEach((e) => {
//         e.send(jsonPacket);
//     });
// }

// /**
//  * sends the filedata to all the connections connected to that file
//  * @param {string} fileID the file to update the users with
//  * @param {string} fileData the data to send to the users
//  */
// export function updateFileForAllUsers(fileID: string, fileData: string) {
//     // this will change once database implemented
//     const packet: WsPacket = { type: "updateFile", data: { file: fileData } };
//     const jsonPacket = JSON.stringify(packet);
//     (fileSocketsMap.get(fileID) ?? []).forEach((e) => {
//         e.send(jsonPacket);
//     });
// }

// /**
//  * removes a user and their connection from a file
//  * @param {string} fileID the file to remove them from
//  * @param {WebSocket} socket the connection to remove
//  * @param {string} userID the user to remove
//  */
// export function removeUserFromFile(fileID: string, socket: WebSocket, userID: string) {
//     const socketList = fileSocketsMap.get(fileID);
//     const index = socketList?.indexOf(socket) ?? -1;
//     if (socketList === undefined || index === -1) return;
//     socketList.splice(index, 1);
//     if (socketList.length === 0) fileSocketsMap.delete(fileID);

//     const redisPacket: WsRedisPacket = { command: "removeUserFile", data: { fileID: fileID, userID: userID } };
//     void redis.publish("ws-channel", JSON.stringify(redisPacket));
// }

// /**
//  * removes a user from a file and then updates the connections on that file
//  * @param {string} fileID the file to remove the user from
//  * @param {string} userID the user to remove
//  */
// export function removeUserFromFileMap(fileID: string, userID: string) {
//     const userlist = fileUsersMap.get(fileID) ?? [];
//     const index = userlist.indexOf(userID);
//     if (index !== -1) userlist.splice(index, 1);

//     console.log("removing users");
//     updateAllUserListsOnFile(fileID);
// }

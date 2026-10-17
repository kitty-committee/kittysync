import { type WebSocket } from "@fastify/websocket";
import { type WsPacket } from "@kittysync/common";

const fileUsersMap = new Map<string, string[]>();
const fileSocketsMap = new Map<string, WebSocket[]>();

export function clearMaps() {
    fileUsersMap.clear();
    fileSocketsMap.clear();
}

export function addNewUserToFile(fileID: string, socket: WebSocket, userID: string) {
    fileUsersMap.getOrInsert(fileID, []).push(userID);
    fileSocketsMap.getOrInsert(fileID, []).push(socket);

    const packet: WsPacket = { type: "updateFile", data: { file: "this is a file" } }
    socket.send(JSON.stringify(packet));

    updateAllUserListsOnFile(fileID);
}

function updateAllUserListsOnFile(fileID: string) {
    const packet: WsPacket = { type: "updateUsers", data: { userList: fileUsersMap.getOrInsert(fileID, []) } };
    const jsonPacket = JSON.stringify(packet);
    fileSocketsMap.getOrInsert(fileID, []).forEach((e) => {
        e.send(jsonPacket);
    });
}

export function updateFileForAllUsers(fileID: string, fileData: string) {
    // this will change once database implemented
    const packet: WsPacket = { type: "updateFile", data: { file: fileData } };
    const jsonPacket = JSON.stringify(packet);
    fileSocketsMap.getOrInsert(fileID, []).forEach((e) => {
        e.send(jsonPacket);
    })
}

export function removeUserFromFile(fileID: string, socket: WebSocket, userID: string) {
    const userlist = fileUsersMap.getOrInsert(fileID, []);
    userlist.splice(userlist.indexOf(userID), 1);

    const socketList = fileSocketsMap.getOrInsert(fileID, []);
    socketList.splice(socketList.indexOf(socket), 1);

    updateAllUserListsOnFile(fileID);
}
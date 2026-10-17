import { packetSchema, type WsPacket } from "./ws-packet.ts";

export { packetSchema as packetSchema, type WsPacket };

import {
    userCredentialsSchema,
    type UserCredentials,
    userDbSchema,
    type UserDb,
    userSearchSchema,
    type UserSearch,
} from "./validation.ts";

export const SHARED = "This is a shared constant from the common package.";

export {
    userCredentialsSchema as UserCredentialsSchema,
    type UserCredentials,
    userDbSchema as UserDbSchema,
    type UserDb,
    userSearchSchema as UserSearchSchema,
    type UserSearch,
};

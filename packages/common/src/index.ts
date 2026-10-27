import { packetSchema, type WsPacket } from "./ws-packet.ts";

export { packetSchema as packetSchema, type WsPacket };

export {
    userCredentialsSchema,
    type UserCredentials,
    userDbSchema,
    type UserDb,
    userSearchSchema,
    type UserSearch,
} from "./validation.ts";

export const SHARED = "This is a shared constant from the common package.";

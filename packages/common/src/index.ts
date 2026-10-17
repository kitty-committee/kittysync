import { UserRegistrationSchema, type UserRegistration } from "./validation.ts";
import { packetSchema, type WsPacket } from "./ws-packet.ts";

export const SHARED = "This is a shared constant from the common package.";

export { UserRegistrationSchema as UserRegistrationSchema, type UserRegistration };
export { packetSchema as packetSchema, type WsPacket };

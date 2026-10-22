import * as z from "zod";

const fileUserDataSchema = z.object({ fileID: z.string(), userID: z.string() });

const fileDataDataSchema = z.object({ fileID: z.string(), fileData: z.string() });

export const wsRedisPacketSchema = z.discriminatedUnion("command", [
    z.object({
        command: z.literal("addUserFile"),
        data: fileUserDataSchema
    }),
    z.object({
        command: z.literal("removeUserFile"),
        data: fileUserDataSchema
    }),
    z.object({
        command: z.literal("saveFile"),
        data: fileDataDataSchema
    }),
]);

export type WsRedisPacket = z.infer<typeof wsRedisPacketSchema>;
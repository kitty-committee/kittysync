import * as z from "zod";

const fileDataSchema = z.object({ file: z.string() });

const userListDataSchema = z.object({ userList: z.array(z.string()) });

const messageDataSchema = z.object({ message: z.string() });

export const packetSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("updateFile"),
        data: fileDataSchema,
    }),
    z.object({
        type: z.literal("saveFile"),
        data: fileDataSchema,
    }),
    z.object({
        type: z.literal("updateUsers"),
        data: userListDataSchema,
    }),
    z.object({
        type: z.literal("error"),
        data: messageDataSchema,
    }),
    z.object({
        type: z.literal("open"),
        data: z.null(),
    }),
]);

export type WsPacket = z.infer<typeof packetSchema>;

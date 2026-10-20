import * as z from "zod";

const fileDataSchema = z.object({ file: z.string() });


const userListDataSchema = z.object({ userList: z.array(z.string()) });


const messageDataSchema = z.object({ message: z.string() });

export const packetSchema = z.object({
    type: z.string(),
    data: z.union([fileDataSchema, userListDataSchema, messageDataSchema, z.null()])
});

export type WsPacket = z.infer<typeof packetSchema>;

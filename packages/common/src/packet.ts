import * as z from "zod";

const errorPacketSchema = z.object({
    type: z.literal("error"),
    data: z.object({ message: z.string() }),
});

export const clientboundPacketSchema = z.discriminatedUnion("type", [
    errorPacketSchema,
    z.object({
        type: z.literal("updateFile"),
        data: z.object({ file: z.string() }),
    }),
    z.object({
        type: z.literal("updateUsers"),
        data: z.object({ userList: z.array(z.string()) }),
    }),
]);

export const serverboundPacketSchema = z.discriminatedUnion("type", [
    errorPacketSchema,
    z.object({
        type: z.literal("saveFile"),
        data: z.object({ file: z.string() }),
    }),
]);

export type ServerboundPacket = z.infer<typeof serverboundPacketSchema>;

export type ClientboundPacket = z.infer<typeof clientboundPacketSchema>;

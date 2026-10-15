import * as z from "zod";

export const UserCredentialsSchema = z.object({
    username: z.string().trim().min(5).max(255),
    password: z.string().trim().min(5).max(255),
});

export type UserCredentials = z.infer<typeof UserCredentialsSchema>;

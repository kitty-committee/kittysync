import * as z from "zod";

export const userCredentialsSchema = z.object({
    username: z.string().trim().min(5).max(255),
    password: z.string().trim().min(5).max(255),
});

export type UserCredentials = z.infer<typeof userCredentialsSchema>;

export const userDbSchema = z.object({
    id: z.uuidv4(),
    username: z.string().trim().min(5).max(255),
});

export type UserDb = z.infer<typeof userDbSchema>;

export const userSearchSchema = z.object({
    username: z.string().trim(),
});

export type UserSearch = z.infer<typeof userSearchSchema>;

import * as z from "zod";

export const UserCredentialsSchema = z.object({
    username: z.string().trim().min(5).max(255),
    password: z.string().trim().min(5).max(255),
});

export type UserCredentials = z.infer<typeof UserCredentialsSchema>;

export const UserDbSchema = z.object({
    id: z.uuidv4(),
    username: z.string().trim().min(5).max(255),
});

export type UserDb = z.infer<typeof UserDbSchema>;

export const UserSearchSchema = z.object({
    username: z.string().trim(),
});

export type UserSearch = z.infer<typeof UserSearchSchema>;

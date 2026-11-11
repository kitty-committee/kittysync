import * as z from "zod";

export const userCredentialsSchema = z.object({
    username: z.string().trim().min(5).max(255),
    password: z.string().trim().min(5).max(255),
});

export const authcatGrantCodeSchema = z.object({
    code: z.string().trim(),
});

export const authcatAccessTokenSchema = z.object({
    token: z.string().trim(),
});

export type UserCredentials = z.infer<typeof userCredentialsSchema>;
export type AuthGrantCode = z.infer<typeof authcatGrantCodeSchema>;
export type AuthCatAccessToken = z.infer<typeof authcatAccessTokenSchema>;

export const userDbSchema = z.object({
    id: z.uuid(),
    username: z.string().trim().min(5).max(255),
});

export type UserDb = z.infer<typeof userDbSchema>;

export const userSearchSchema = z.object({
    username: z.string().trim(),
});

export type UserSearch = z.infer<typeof userSearchSchema>;

export const authcatUserSchema = z.object({
    id: z.int(),
    username: z.string(),
    fullName: z.string(),
    pfpPath: z.string(),
});

export type AuthCatUser = z.infer<typeof authcatUserSchema>;

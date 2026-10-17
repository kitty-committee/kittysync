import * as z from "zod";

export const UserRegistrationSchema = z.object({
    username: z.string().trim().min(5).max(255),
    password: z.string().trim().min(5).max(255),
});

export type UserRegistration = z.infer<typeof UserRegistrationSchema>;

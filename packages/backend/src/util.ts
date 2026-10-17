import type { MultipartFields, MultipartValue } from "@fastify/multipart";
import { UserCredentialsSchema } from "@kittysync/common";

export function userCredentialsFromMultipart(form: MultipartFields) {
    return UserCredentialsSchema.parse({
        username: (form["username"] as MultipartValue<string>).value,
        password: (form["password"] as MultipartValue<string>).value,
    });
}

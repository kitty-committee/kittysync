import type { MultipartFields, MultipartValue } from "@fastify/multipart";
import { userCredentialsSchema } from "@kittysync/common";

export function userCredentialsFromMultipart(form: MultipartFields) {
    return userCredentialsSchema.parse({
        username: (form["username"] as MultipartValue<string>).value,
        password: (form["password"] as MultipartValue<string>).value,
    });
}

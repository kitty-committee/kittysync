import Fastify from "fastify";
import { register } from "./auth/auth.routes.ts";
import * as dotenv from "dotenv";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";

dotenv.config();

export const app = Fastify({
    logger: true,
});

app.register(fastifyCookie);

app.register(fastifyMultipart, {
    attachFieldsToBody: true,
} as fastifyMultipart.FastifyMultipartAttachFieldsToBodyOptions);

// Declare a route
app.get("/", function (_, reply) {
    reply.send({ hello: "world" });
});

// Register auth routes
register(app);

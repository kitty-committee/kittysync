import Fastify from "fastify";
import { register } from "./auth/auth.routes.ts";
import * as dotenv from "dotenv";

dotenv.config();

export const app = Fastify({
    logger: true,
});

app.register(require("@fastify/cookie"), {
    secret: "",
    hook: false,
    parseOptions: {},
});

app.register(require("@fastify/multipart"), { attachFieldsToBody: true });

// Declare a route
app.get("/", function (_, reply) {
    reply.send({ hello: "world" });
});

// Register auth routes
register(app);

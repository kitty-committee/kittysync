import Fastify from "fastify";
import { register } from "./auth/auth.routes.ts";
import * as dotenv from "dotenv";

dotenv.config();

export const app = Fastify({
    logger: true,
});

// Declare a route
app.get("/", function (_, reply) {
    reply.send({ hello: "world" });
});

// Register auth routes
register(app);

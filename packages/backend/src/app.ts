import Fastify from "fastify";
import { register } from "./auth/auth.routes.ts";
import * as dotenv from "dotenv";
import fastifyCookie from "@fastify/cookie";
import { Redis } from "ioredis";
import { drizzle } from "drizzle-orm/node-postgres";

dotenv.config();

export const redis = new Redis(6379, process.env["KITTYSYNC_REDIS_HOST"]!);
export const db = drizzle(process.env["KITTYSYNC_DATABASE_URL"]!);

export const app = Fastify({
    logger: true,
});

app.register(fastifyCookie);

app.addHook("onClose", async (_instance) => {
    await redis.quit();
});

// Declare a route
app.get("/", function (_, reply) {
    reply.send({ hello: "world" });
});

// Register auth routes
register(app);

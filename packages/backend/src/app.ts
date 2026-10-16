import Fastify from "fastify";
import { register } from "./auth/auth.routes.ts";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import { Redis } from "ioredis";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { configuration } from "./configuration.ts";

export const redis = new Redis(6379, configuration.KITTYSYNC_REDIS_HOST);

const pool = new Pool(configuration.database);
export const db = drizzle({ client: pool });
await migrate(db, { migrationsFolder: "./drizzle" });

export const app = Fastify({
    logger: true,
});

app.register(fastifyCookie);

app.register(fastifyMultipart, {
    attachFieldsToBody: true,
} as fastifyMultipart.FastifyMultipartAttachFieldsToBodyOptions);

app.addHook("onClose", async (_instance) => {
    await Promise.all([redis.quit(), pool.end()]);
});

// Declare a route
app.get("/", function (_, reply) {
    reply.send({ hello: "world" });
});

// Register auth routes
register(app);

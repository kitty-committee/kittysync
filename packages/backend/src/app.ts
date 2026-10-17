import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { configuration } from "./configuration.ts";
import { register } from "./auth/auth.routes.ts";
import fastifyCookie from "@fastify/cookie";
import { Redis } from "ioredis";
import Fastify from "fastify";
import { Pool } from "pg";

export const redis = new Redis(6379, configuration.redisHost);

const pool = new Pool(configuration.database);
export const db = drizzle({ client: pool });
await migrate(db, { migrationsFolder: "./drizzle" });

export const app = Fastify({
    logger: true,
});

app.register(fastifyCookie);

app.addHook("onClose", async (_instance) => {
    await Promise.all([redis.quit(), pool.end()]);
});

// Declare a route
app.get("/", function (_, reply) {
    reply.send({ hello: "world" });
});

// Register auth routes
register(app);

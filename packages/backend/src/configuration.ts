import findConfig from "find-config";
import dotenv from "dotenv";
import * as z from "zod";

// Load environment variables from .env file if it exists
const envPath = findConfig(".env");
if (envPath) dotenv.config({ path: envPath });

// Define a schema for the expected environment variables
const env = z
    .object({
        KITTYSYNC_APP_DOMAIN: z.hostname(),
        KITTYSYNC_REDIS_HOST: z.hostname(),
        KITTYSYNC_DB_PASSWORD: z.string(),
        KITTYSYNC_DB_HOST: z.hostname(),
        KITTYSYNC_DB_NAME: z.string(),
        KITTYSYNC_DB_USER: z.string(),
        KITTYSYNC_IS_SECURE: z.stringbool(),
    })
    .parse(process.env);

/**
 * Configuration object containing application settings loaded from environment variables.
 */
export const configuration = {
    appDomain: env.KITTYSYNC_APP_DOMAIN,
    redisHost: env.KITTYSYNC_REDIS_HOST,
    isSecure: env.KITTYSYNC_IS_SECURE,
    database: {
        password: env.KITTYSYNC_DB_PASSWORD,
        database: env.KITTYSYNC_DB_NAME,
        host: env.KITTYSYNC_DB_HOST,
        user: env.KITTYSYNC_DB_USER,
    },
};

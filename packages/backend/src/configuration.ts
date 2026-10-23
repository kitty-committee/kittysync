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
        KITTYSYNC_SECRET_KEY: z.string(),
        KITTYSYNC_TOKEN_LIFETIME: z
            .string()
            .transform((val) => parseInt(val, 10))
            .default(86400),
    })
    .parse(process.env);

/**
 * Configuration object containing application settings loaded from environment variables.
 */
export const configuration = {
    /// The domain of the application, used for for cookie settings.
    appDomain: env.KITTYSYNC_APP_DOMAIN,
    /// The host of the Redis server used for session management.
    redisHost: env.KITTYSYNC_REDIS_HOST,
    /// Indicates whether the application is running in a secure context (HTTPS).
    isSecure: env.KITTYSYNC_IS_SECURE,
    /// The secret key used for signing and verifying JWT tokens.
    secretKey: env.KITTYSYNC_SECRET_KEY,
    /// The lifetime of a session token in seconds. Defaults to 86400 (24 hours) if not specified in the environment variables.
    tokenLifetime: env.KITTYSYNC_TOKEN_LIFETIME,
    /// Database configuration settings for connecting to the application's database.
    database: {
        password: env.KITTYSYNC_DB_PASSWORD,
        database: env.KITTYSYNC_DB_NAME,
        host: env.KITTYSYNC_DB_HOST,
        user: env.KITTYSYNC_DB_USER,
    },
};

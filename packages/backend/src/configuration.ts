import findConfig from "find-config";
import dotenv from "dotenv";
import * as z from "zod";

dotenv.config({ path: findConfig(".env")! });

export const configuration = {
    /** The database connection credentials from environment variables */
    get database(): {
        password: string;
        database: string;
        host: string;
        user: string;
    } {
        return {
            host: this.KITTYSYNC_DB_HOST,
            user: this.KITTYSYNC_DB_USER,
            password: this.KITTYSYNC_DB_PASSWORD,
            database: this.KITTYSYNC_DB_NAME,
        };
    },
    ...z
        .object({
            KITTYSYNC_APP_DOMAIN: z.hostname(),
            KITTYSYNC_REDIS_HOST: z.hostname(),
            KITTYSYNC_DB_PASSWORD: z.string(),
            KITTYSYNC_DB_HOST: z.hostname(),
            KITTYSYNC_DB_NAME: z.string(),
            KITTYSYNC_DB_USER: z.string(),
        })
        .parse(process.env),
};

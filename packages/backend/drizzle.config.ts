import { configuration } from "@kittysync/common";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dbCredentials: configuration.database,
    schema: "./src/db/schema.ts",
    dialect: "postgresql",
    out: "./drizzle",
});

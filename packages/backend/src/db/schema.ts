import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: uuid().primaryKey().notNull().defaultRandom(),
    username: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 60 }).notNull(),
});


export const documentsTable = pgTable("documents", {
    id: uuid().primaryKey().notNull().defaultRandom(),
    title: varchar({ length: 255 }).notNull(),
    content: varchar({ length: 10000 }).notNull().default(""),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

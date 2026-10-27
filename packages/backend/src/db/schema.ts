import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: uuid().primaryKey().notNull().defaultRandom(),
    username: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 60 }).notNull(),
});

/**
    Define the documents table
    contsains the following columns:
    - id: UUID, primary key, not null, default random
    - title: varchar(255), not null
    - content: varchar(10000), not null, defaults to an empty string
*/
export const documentsTable = pgTable("documents", {
    id: uuid().primaryKey().notNull().defaultRandom(),
    title: varchar({ length: 255 }).notNull(),
    content: text().notNull().default(""),
    authorId: uuid()
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

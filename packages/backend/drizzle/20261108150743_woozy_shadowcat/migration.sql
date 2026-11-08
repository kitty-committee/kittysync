ALTER TABLE "users" RENAME COLUMN "username" TO "name";--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "yDocState" bytea;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "color" char(7) NOT NULL;
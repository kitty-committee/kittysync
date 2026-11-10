ALTER TABLE "users" RENAME COLUMN "username" TO "name";--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "yDocState" bytea;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "color" char(7);--> statement-breakpoint
UPDATE "users" SET "color" = '#DDD6FE' WHERE "color" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "color" SET NOT NULL;
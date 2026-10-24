ALTER TABLE "documents" DROP CONSTRAINT "documents_slug_key";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "content" SET DEFAULT '';
ALTER TABLE "documents" ADD COLUMN "authorId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "content" SET DATA TYPE text USING "content"::text;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_authorId_users_id_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE;
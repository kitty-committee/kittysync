CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" varchar(255) NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"authorId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_authorId_users_id_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE;
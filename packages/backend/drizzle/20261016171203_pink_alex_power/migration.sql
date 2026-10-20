CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"username" varchar(255) NOT NULL UNIQUE,
	"password" varchar(60) NOT NULL
);

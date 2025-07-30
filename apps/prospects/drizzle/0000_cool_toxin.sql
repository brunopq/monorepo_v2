CREATE TABLE "user" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"auauthId" uuid NOT NULL,
	"name" text NOT NULL,
	"fullName" text,
	CONSTRAINT "user_auauthId_unique" UNIQUE("auauthId"),
	CONSTRAINT "user_name_unique" UNIQUE("name")
);

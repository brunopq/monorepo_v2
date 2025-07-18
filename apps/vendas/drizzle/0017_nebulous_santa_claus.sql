ALTER TABLE "users" ADD COLUMN "auauth_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "user_role";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "account_active";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auauth_id_unique" UNIQUE("auauth_id");
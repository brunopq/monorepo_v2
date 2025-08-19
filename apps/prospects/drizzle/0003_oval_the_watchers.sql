ALTER TABLE "leads" ALTER COLUMN "cpf" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."lead_interactions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."interaction_statuses";--> statement-breakpoint
CREATE TYPE "public"."interaction_statuses" AS ENUM('waiting_response', 'no_response', 'wrong_person', 'no_interest', 'not_reachable', 'interested', 'converted', 'lost');--> statement-breakpoint
ALTER TABLE "public"."lead_interactions" ALTER COLUMN "status" SET DATA TYPE "public"."interaction_statuses" USING "status"::"public"."interaction_statuses";
CREATE TYPE "public"."sub_list_states" AS ENUM('new', 'in_progress', 'completed', 'canceled');--> statement-breakpoint
ALTER TABLE "sub_lists" ADD COLUMN "state" "sub_list_states" NOT NULL;
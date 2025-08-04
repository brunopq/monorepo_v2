ALTER TABLE "lists" RENAME COLUMN "created_by" TO "creator_id";--> statement-breakpoint
ALTER TABLE "lists" DROP CONSTRAINT "lists_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
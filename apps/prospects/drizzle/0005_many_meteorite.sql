CREATE TABLE "reminders" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"remind_at" timestamp with time zone NOT NULL,
	"message" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
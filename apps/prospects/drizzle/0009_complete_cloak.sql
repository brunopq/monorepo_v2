ALTER TABLE "lead_interactions" RENAME COLUMN "lead_serial_id" TO "lead_id";--> statement-breakpoint
ALTER TABLE "reminders" RENAME COLUMN "lead_serial_id" TO "lead_id";--> statement-breakpoint
ALTER TABLE "lead_interactions" DROP CONSTRAINT "lead_interactions_lead_serial_id_leads_serial_id_fk";
--> statement-breakpoint
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_lead_serial_id_leads_serial_id_fk";
--> statement-breakpoint
ALTER TABLE "lead_interactions" ADD CONSTRAINT "lead_interactions_lead_id_leads_serial_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("serial_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_lead_id_leads_serial_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("serial_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "id";
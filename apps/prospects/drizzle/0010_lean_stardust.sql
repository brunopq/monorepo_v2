ALTER TABLE "leads" RENAME COLUMN "serial_id" TO "id";--> statement-breakpoint
ALTER TABLE "lead_interactions" DROP CONSTRAINT "lead_interactions_lead_id_leads_serial_id_fk"; --> statement-breakpoint
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_lead_id_leads_serial_id_fk"; --> statement-breakpoint
ALTER TABLE "leads" DROP CONSTRAINT "leads_serialId_unique";--> statement-breakpoint

ALTER TABLE "leads" ADD CONSTRAINT "leads_id_unique" UNIQUE("id");
ALTER TABLE "lead_interactions" ADD CONSTRAINT "lead_interactions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
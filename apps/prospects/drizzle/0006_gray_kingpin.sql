-- reordered manually to apply constraints correctly
ALTER TABLE "leads" ADD COLUMN "serial_id" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_serialId_unique" UNIQUE("serial_id");

ALTER TABLE "lead_interactions" ADD COLUMN "lead_serial_id" integer;--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "lead_serial_id" integer;--> statement-breakpoint
ALTER TABLE "lead_interactions" ADD CONSTRAINT "lead_interactions_lead_serial_id_leads_serial_id_fk" FOREIGN KEY ("lead_serial_id") REFERENCES "public"."leads"("serial_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_lead_serial_id_leads_serial_id_fk" FOREIGN KEY ("lead_serial_id") REFERENCES "public"."leads"("serial_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
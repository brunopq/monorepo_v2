ALTER TABLE "lead_interactions" DROP CONSTRAINT "lead_interactions_lead_id_leads_id_fk";
--> statement-breakpoint
ALTER TABLE "reminders" DROP CONSTRAINT "reminders_lead_id_leads_id_fk";
--> statement-breakpoint
ALTER TABLE "lead_interactions" ALTER COLUMN "lead_serial_id" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "leads" DROP CONSTRAINT "leads_pkey";--> statement-breakpoint
ALTER TABLE "leads" ADD PRIMARY KEY ("serial_id");--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reminders" ALTER COLUMN "lead_serial_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lead_interactions" DROP COLUMN "lead_id";--> statement-breakpoint
ALTER TABLE "reminders" DROP COLUMN "lead_id";
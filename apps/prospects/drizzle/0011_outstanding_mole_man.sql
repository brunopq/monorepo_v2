CREATE TYPE "public"."message_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."messaging_campaign_type" AS ENUM('oficial_whatsapp_api');--> statement-breakpoint
CREATE TABLE "messaging_campaign" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"sub_list_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" "messaging_campaign_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oficial_whatsapp_api_message" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"lead_id" integer NOT NULL,
	"phone_number" text NOT NULL,
	"message_template_name" text NOT NULL,
	"template_parameters" jsonb NOT NULL,
	"rendered_text" text NOT NULL,
	"sent_at" timestamp with time zone,
	"status" "message_status" DEFAULT 'pending' NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "messaging_campaign" ADD CONSTRAINT "messaging_campaign_sub_list_id_sub_lists_id_fk" FOREIGN KEY ("sub_list_id") REFERENCES "public"."sub_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oficial_whatsapp_api_message" ADD CONSTRAINT "oficial_whatsapp_api_message_campaign_id_messaging_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."messaging_campaign"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oficial_whatsapp_api_message" ADD CONSTRAINT "oficial_whatsapp_api_message_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;
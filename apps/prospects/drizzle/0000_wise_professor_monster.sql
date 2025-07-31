CREATE TYPE "public"."interaction_statuses" AS ENUM('waiting_response', 'no_response', 'wrong_person', 'no_interest', 'has_interest', 'not_reachable', 'not_interested', 'interested', 'converted', 'lost');--> statement-breakpoint
CREATE TYPE "public"."interaction_types" AS ENUM('whatsapp_message', 'whatsapp_call', 'call', 'email', 'other');--> statement-breakpoint
CREATE TABLE "lead_interactions" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"contacted_at" timestamp with time zone NOT NULL,
	"interaction_type" "interaction_types" NOT NULL,
	"status" "interaction_statuses" NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"list_id" text NOT NULL,
	"sub_list_id" text,
	"name" text NOT NULL,
	"phone_number" text NOT NULL,
	"cpf" char(11),
	"birth_date" date,
	"state" char(2),
	"extra_info" jsonb
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"origin" text NOT NULL,
	"size" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_lists" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"parent_list_id" text NOT NULL,
	"assignee_id" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"auauth_id" uuid NOT NULL,
	"name" text NOT NULL,
	"full_name" text,
	CONSTRAINT "users_auauthId_unique" UNIQUE("auauth_id"),
	CONSTRAINT "users_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "lead_interactions" ADD CONSTRAINT "lead_interactions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_interactions" ADD CONSTRAINT "lead_interactions_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_sub_list_id_sub_lists_id_fk" FOREIGN KEY ("sub_list_id") REFERENCES "public"."sub_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_lists" ADD CONSTRAINT "sub_lists_parent_list_id_lists_id_fk" FOREIGN KEY ("parent_list_id") REFERENCES "public"."lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_lists" ADD CONSTRAINT "sub_lists_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
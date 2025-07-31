CREATE TYPE "public"."interaction_statuses" AS ENUM('waiting_response', 'no_response', 'wrong_person', 'no_interest', 'has_interest', 'not_reachable', 'not_interested', 'interested', 'converted', 'lost');--> statement-breakpoint
CREATE TYPE "public"."interaction_types" AS ENUM('whatsapp_message', 'whatsapp_call', 'call', 'email', 'other');--> statement-breakpoint
CREATE TABLE "lead_interactions" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"leadId" text NOT NULL,
	"sellerId" text NOT NULL,
	"contactedAt" timestamp with time zone NOT NULL,
	"interactionType" "interaction_types" NOT NULL,
	"status" "interaction_statuses" NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"listId" text NOT NULL,
	"subListId" text,
	"name" text NOT NULL,
	"phoneNumber" text NOT NULL,
	"cpf" char(11),
	"birthDate" date,
	"state" char(2),
	"extraInfo" jsonb
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"createdBy" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"origin" text NOT NULL,
	"size" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_lists" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"parentListId" text NOT NULL,
	"assigneeId" text
);
--> statement-breakpoint
ALTER TABLE "user" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "user_auauthId_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "user_name_unique";--> statement-breakpoint
ALTER TABLE "lead_interactions" ADD CONSTRAINT "lead_interactions_leadId_leads_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_interactions" ADD CONSTRAINT "lead_interactions_sellerId_users_id_fk" FOREIGN KEY ("sellerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_listId_lists_id_fk" FOREIGN KEY ("listId") REFERENCES "public"."lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_subListId_sub_lists_id_fk" FOREIGN KEY ("subListId") REFERENCES "public"."sub_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_lists" ADD CONSTRAINT "sub_lists_parentListId_lists_id_fk" FOREIGN KEY ("parentListId") REFERENCES "public"."lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_lists" ADD CONSTRAINT "sub_lists_assigneeId_users_id_fk" FOREIGN KEY ("assigneeId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auauthId_unique" UNIQUE("auauthId");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_name_unique" UNIQUE("name");
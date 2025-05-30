CREATE TYPE "public"."field_types" AS ENUM('text', 'textarea', 'number', 'date', 'checkbox');--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"template_id" char(12) NOT NULL,
	"submitter_id" char(12) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "submitted_fields" (
	"submission_id" char(12) NOT NULL,
	"template_field_id" char(12) NOT NULL,
	"text_value" text,
	"textarea_value" text,
	"number_value" integer,
	"date_value" timestamp with time zone,
	"checkbox_value" boolean,
	CONSTRAINT "submitted_fields_submission_id_template_field_id_pk" PRIMARY KEY("submission_id","template_field_id"),
	CONSTRAINT "only_one_submission_per_field" UNIQUE("template_field_id","submission_id"),
	CONSTRAINT "only_one_field_value_check" CHECK ((
        CASE WHEN "submitted_fields"."text_value" IS NOT NULL THEN 1 ELSE 0 END + 
        CASE WHEN "submitted_fields"."number_value" IS NOT NULL THEN 1 ELSE 0 END + 
        CASE WHEN "submitted_fields"."textarea_value" IS NOT NULL THEN 1 ELSE 0 END + 
        CASE WHEN "submitted_fields"."checkbox_value" IS NOT NULL THEN 1 ELSE 0 END + 
        CASE WHEN "submitted_fields"."date_value" IS NOT NULL THEN 1 ELSE 0 END
      ) = 1)
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "template_fields" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"template_id" char(12) NOT NULL,
	"name" text NOT NULL,
	"required" boolean NOT NULL,
	"type" "field_types" NOT NULL,
	"order" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submitted_fields" ADD CONSTRAINT "submitted_fields_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submitted_fields" ADD CONSTRAINT "submitted_fields_template_field_id_template_fields_id_fk" FOREIGN KEY ("template_field_id") REFERENCES "public"."template_fields"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_fields" ADD CONSTRAINT "template_fields_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;
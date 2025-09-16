-- Custom SQL migration file, put your code below! --
UPDATE "lead_interactions" SET "lead_serial_id" = (SELECT "serial_id" FROM "leads" WHERE "leads"."id" = "lead_id");
UPDATE "reminders" SET "lead_serial_id" = (SELECT "serial_id" FROM "leads" WHERE "leads"."id" = "lead_id");
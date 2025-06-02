ALTER TABLE "submissions" ALTER COLUMN "submitter_id" SET DATA TYPE uuid USING "submitter_id"::uuid;

ALTER TABLE "enquiries" ADD COLUMN "unique_id" text PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "user_verifications" ADD COLUMN "unique_id" text PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "user_verifications" DROP COLUMN "id";
ALTER TABLE "enquiries" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "mobile" text NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "updated_at" timestamp DEFAULT now();
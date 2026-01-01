CREATE TABLE "user_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"father_name" text NOT NULL,
	"mother_name" text NOT NULL,
	"date_of_birth" text NOT NULL,
	"mobile" text NOT NULL,
	"alternate_mobile" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"pincode" text NOT NULL,
	"aadhar_number" text NOT NULL,
	"pan_number" text NOT NULL,
	"photo_url" text NOT NULL,
	"aadhar_front_url" text NOT NULL,
	"aadhar_back_url" text,
	"pan_card_url" text,
	"status" text DEFAULT 'pending',
	"rejection_reason" text,
	"verified_at" timestamp,
	"verified_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "verification_data";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "verification_history";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "documents";
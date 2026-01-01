ALTER TABLE "enquiries" DROP CONSTRAINT "enquiries_buyer_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" DROP COLUMN "buyer_id";
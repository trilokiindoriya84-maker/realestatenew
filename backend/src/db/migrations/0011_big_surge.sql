ALTER TABLE "enquiries" DROP CONSTRAINT "enquiries_property_unique_id_properties_unique_id_fk";
--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_property_unique_id_published_properties_unique_id_fk" FOREIGN KEY ("property_unique_id") REFERENCES "public"."published_properties"("unique_id") ON DELETE no action ON UPDATE no action;
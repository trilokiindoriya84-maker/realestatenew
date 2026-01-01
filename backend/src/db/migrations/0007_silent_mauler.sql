ALTER TABLE "properties" DROP CONSTRAINT "properties_unique_id_unique";--> statement-breakpoint
ALTER TABLE "published_properties" DROP CONSTRAINT "published_properties_unique_id_unique";--> statement-breakpoint
ALTER TABLE "enquiries" DROP CONSTRAINT "enquiries_property_id_properties_id_fk";
--> statement-breakpoint
ALTER TABLE "published_properties" DROP CONSTRAINT "published_properties_original_property_id_properties_id_fk";
--> statement-breakpoint
ALTER TABLE "properties" ADD PRIMARY KEY ("unique_id");--> statement-breakpoint
ALTER TABLE "published_properties" ADD PRIMARY KEY ("unique_id");--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "property_unique_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "published_properties" ADD COLUMN "original_property_unique_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_property_unique_id_properties_unique_id_fk" FOREIGN KEY ("property_unique_id") REFERENCES "public"."properties"("unique_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_properties" ADD CONSTRAINT "published_properties_original_property_unique_id_properties_unique_id_fk" FOREIGN KEY ("original_property_unique_id") REFERENCES "public"."properties"("unique_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" DROP COLUMN "property_id";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "published_properties" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "published_properties" DROP COLUMN "original_property_id";
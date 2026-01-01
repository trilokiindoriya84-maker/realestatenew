ALTER TABLE "properties" DROP CONSTRAINT "properties_seller_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "property_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "property_title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "state" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "district" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "city" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "locality" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "pincode" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "latitude" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "longitude" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "total_area" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "area_unit" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "front_road_width" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "road_width_unit" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "property_facing" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "open_sides" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "bedrooms" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "bathrooms" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "floors" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "floor_number" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "construction_status" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "land_type" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "boundary_wall" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "amenities" jsonb;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "selling_price" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "price_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "negotiable" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "circle_rate" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "property_photos" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "ownership_docs" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "sale_deed_docs" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "khasra_docs" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "approved_map_docs" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "encumbrance_docs" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "identity_proof_docs" text[];--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "seller_id";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "location";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "images";--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "documents";
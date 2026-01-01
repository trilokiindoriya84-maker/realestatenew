ALTER TABLE "properties" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "unique_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "property_description" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "east_road_width" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "west_road_width" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "north_road_width" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "south_road_width" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_blocked" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_unique_id_unique" UNIQUE("unique_id");

import { pgTable, text, serial, boolean, timestamp, uuid, integer, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    fullName: text('full_name'),
    avatarUrl: text('avatar_url'), // Google profile picture
    role: text('role').default('user'), // 'user', 'admin'
    phoneNumber: text('phone_number'),
    isVerified: boolean('is_verified').default(false),
    isBlocked: boolean('is_blocked').default(false), // Block user from logging in
    verificationStatus: text('verification_status').default('unverified'), // 'unverified', 'pending', 'verified', 'rejected'
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const userVerifications = pgTable('user_verifications', {
    uniqueId: text('unique_id').primaryKey(), // Primary key - unique identifier
    userId: uuid('user_id').references(() => users.id).notNull(),
    
    // Personal Details
    fullName: text('full_name').notNull(),
    fatherName: text('father_name').notNull(),
    motherName: text('mother_name').notNull(),
    dateOfBirth: text('date_of_birth').notNull(),
    
    // Contact Details
    mobile: text('mobile').notNull(),
    alternateMobile: text('alternate_mobile'),
    
    // Address Details
    address: text('address').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    pincode: text('pincode').notNull(),
    
    // Legal Documents
    aadharNumber: text('aadhar_number').notNull(),
    panNumber: text('pan_number').notNull(),
    
    // Document URLs
    photoUrl: text('photo_url').notNull(),
    aadharFrontUrl: text('aadhar_front_url').notNull(),
    aadharBackUrl: text('aadhar_back_url'),
    panCardUrl: text('pan_card_url'),
    
    // Status & Metadata
    status: text('status').default('pending'), // 'pending', 'verified', 'rejected'
    rejectionReason: text('rejection_reason'),
    verifiedAt: timestamp('verified_at'),
    verifiedBy: uuid('verified_by').references(() => users.id),
    
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const properties = pgTable('properties', {
    uniqueId: text('unique_id').primaryKey(), // Primary key - unique identifier
    userId: uuid('user_id').references(() => users.id).notNull(),
    
    // Step 1: Property Type & Location
    propertyType: text('property_type').notNull(), // 'House', 'Apartment', 'Plot', 'Land', 'Farm'
    propertyTitle: text('property_title').notNull(),
    propertyDescription: text('property_description'), // New field for description
    state: text('state').notNull(),
    district: text('district').notNull(),
    city: text('city').notNull(),
    locality: text('locality').notNull(),
    pincode: text('pincode').notNull(),
    latitude: text('latitude'),
    longitude: text('longitude'),
    totalArea: text('total_area').notNull(),
    areaUnit: text('area_unit').notNull(), // 'sqft', 'sqm', 'acre', 'bigha'
    frontRoadWidth: text('front_road_width'),
    roadWidthUnit: text('road_width_unit'),
    propertyFacing: text('property_facing').notNull(),
    openSides: text('open_sides').notNull(),
    
    // Road widths for each open side
    eastRoadWidth: text('east_road_width'),
    westRoadWidth: text('west_road_width'),
    northRoadWidth: text('north_road_width'),
    southRoadWidth: text('south_road_width'),
    
    // Step 2: Specifications (conditional based on property type)
    bedrooms: text('bedrooms'),
    bathrooms: text('bathrooms'),
    floors: text('floors'),
    floorNumber: text('floor_number'),
    constructionStatus: text('construction_status'),
    landType: text('land_type'),
    boundaryWall: text('boundary_wall'),
    amenities: jsonb('amenities'), // Store as JSON
    
    // Step 3: Price Details
    sellingPrice: text('selling_price').notNull(),
    priceType: text('price_type').notNull(), // 'total', 'per-unit'
    negotiable: text('negotiable').notNull(), // 'yes', 'no'
    circleRate: text('circle_rate'),
    
    // Step 4: Documents (URLs stored as arrays)
    propertyPhotos: text('property_photos').array(),
    ownershipDocs: text('ownership_docs').array(),
    saleDeedDocs: text('sale_deed_docs').array(),
    khasraDocs: text('khasra_docs').array(),
    approvedMapDocs: text('approved_map_docs').array(),
    encumbranceDocs: text('encumbrance_docs').array(),
    identityProofDocs: text('identity_proof_docs').array(),
    
    // Status & Verification
    status: text('status').default('draft'), // 'draft', 'pending', 'approved', 'rejected', 'sold'
    rejectionReason: text('rejection_reason'),
    approvedAt: timestamp('approved_at'),
    approvedBy: uuid('approved_by').references(() => users.id),
    
    // Metadata
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const enquiries = pgTable('enquiries', {
    uniqueId: text('unique_id').primaryKey(), // Primary key - unique identifier
    propertyUniqueId: text('property_unique_id').references(() => publishedProperties.uniqueId).notNull(),
    userId: uuid('user_id').references(() => users.id), // User who made the enquiry
    name: text('name').notNull(),
    mobile: text('mobile').notNull(),
    message: text('message'),
    status: text('status').default('pending'), // 'pending', 'contacted', 'closed'
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const publishedProperties = pgTable('published_properties', {
    uniqueId: text('unique_id').primaryKey(), // Primary key - unique identifier for published property
    originalPropertyUniqueId: text('original_property_unique_id').references(() => properties.uniqueId).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    
    // SEO-friendly URL fields (generated at publish time)
    slug: text('slug').unique(), // Optional initially, required when published
    
    // Editable Property Details for Public Display
    propertyType: text('property_type').notNull(),
    propertyTitle: text('property_title').notNull(),
    propertyDescription: text('property_description'),
    state: text('state').notNull(),
    district: text('district').notNull(),
    city: text('city').notNull(),
    locality: text('locality').notNull(),
    pincode: text('pincode').notNull(),
    latitude: text('latitude'),
    longitude: text('longitude'),
    totalArea: text('total_area').notNull(),
    areaUnit: text('area_unit').notNull(),
    propertyFacing: text('property_facing').notNull(),
    openSides: text('open_sides').notNull(),
    
    // Road widths for each open side
    eastRoadWidth: text('east_road_width'),
    westRoadWidth: text('west_road_width'),
    northRoadWidth: text('north_road_width'),
    southRoadWidth: text('south_road_width'),
    
    // Specifications
    bedrooms: text('bedrooms'),
    bathrooms: text('bathrooms'),
    floors: text('floors'),
    floorNumber: text('floor_number'),
    constructionStatus: text('construction_status'),
    landType: text('land_type'),
    boundaryWall: text('boundary_wall'),
    amenities: jsonb('amenities'),
    
    // Price Details
    sellingPrice: text('selling_price').notNull(),
    priceType: text('price_type').notNull(),
    negotiable: text('negotiable').notNull(),
    circleRate: text('circle_rate'),
    
    // Published Images (separate from original property images)
    publishedPhotos: text('published_photos').array(),
    
    // Publishing Status
    isLive: boolean('is_live').default(false), // Whether property is live on website
    publishedAt: timestamp('published_at'),
    publishedBy: uuid('published_by').references(() => users.id),
    
    // Metadata
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const savedProperties = pgTable('saved_properties', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    propertyUniqueId: text('property_unique_id').references(() => publishedProperties.uniqueId).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

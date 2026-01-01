-- Add slug and uniqueId columns to properties table
ALTER TABLE properties 
ADD COLUMN slug TEXT,
ADD COLUMN unique_id TEXT;

-- These will be populated by migration script, then made NOT NULL
-- For now, allow NULL to avoid breaking existing data

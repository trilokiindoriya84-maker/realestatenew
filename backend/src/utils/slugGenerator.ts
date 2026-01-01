import { customAlphabet } from 'nanoid';

/**
 * Generate a URL-friendly slug from property title
 * Example: "3 BHK House Near Bus Stand" -> "3-bhk-house-near-bus-stand"
 */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique alphanumeric ID
 * Example: "abc123xyz789" (12 characters)
 * Uses nanoid for cryptographically strong random IDs
 */
export function generateUniqueId(): string {
    // Use only lowercase letters and numbers (URL-safe)
    const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 12);
    return nanoid();
}

/**
 * Generate complete SEO-friendly URL path
 * Example: "3-bhk-house-near-bus-stand/p/abc123xyz789"
 */
export function generatePropertyUrl(slug: string, uniqueId: string): string {
    return `${slug}/p/${uniqueId}`;
}

/**
 * Extract uniqueId from URL path
 * Example: "3-bhk-house-near-bus-stand/p/abc123xyz789" -> "abc123xyz789"
 */
export function extractUniqueIdFromUrl(urlPath: string): string | null {
    const match = urlPath.match(/\/p\/([a-z0-9]+)$/);
    return match ? match[1] : null;
}

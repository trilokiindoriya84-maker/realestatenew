/**
 * Generate SEO-friendly property URL
 * @param slug - Property slug (e.g., "3-bhk-house-near-bus-stand")
 * @param uniqueId - Property unique ID (e.g., "abc123xyz789")
 * @returns Full URL path (e.g., "/3-bhk-house-near-bus-stand/p/abc123xyz789")
 */
export function getPropertyUrl(slug: string, uniqueId: string): string {
  return `/${slug}/p/${uniqueId}`;
}

/**
 * Generate slug from property title (client-side preview)
 * @param title - Property title
 * @returns Slug string
 */
export function generateSlugPreview(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

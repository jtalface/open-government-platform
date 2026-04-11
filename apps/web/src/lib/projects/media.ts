export const MAX_PROJECT_IMAGES = 3;

export type ProjectImageRef = { url: string };

/** Parse `descriptionMedia` / `attachments` JSON from API or DB */
export function parseStoredImageUrls(media: unknown): string[] {
  if (!media || !Array.isArray(media)) return [];
  const urls: string[] = [];
  for (const item of media) {
    if (typeof item === "string" && item.trim()) urls.push(item.trim());
    else if (item && typeof item === "object" && "url" in item) {
      const u = (item as { url?: string }).url;
      if (typeof u === "string" && u.trim()) urls.push(u.trim());
    }
  }
  return urls;
}

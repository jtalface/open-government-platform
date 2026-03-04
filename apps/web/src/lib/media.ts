export function normalizeIncidentMediaUrl(url: string | null | undefined): string {
  if (!url) return "";

  try {
    // Handle absolute URLs
    const parsed = new URL(url, "http://dummy");
    const pathname = parsed.pathname;
    if (pathname.includes("/uploads/incidents/")) {
      const parts = pathname.split("/");
      const filename = parts[parts.length - 1];
      if (filename) {
        return `/api/uploads/incidents/${filename}`;
      }
    }
  } catch {
    // Not an absolute URL, fall through to relative handling
  }

  // Handle relative URLs
  if (url.includes("/uploads/incidents/")) {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    if (filename) {
      return `/api/uploads/incidents/${filename}`;
    }
  }

  return url;
}


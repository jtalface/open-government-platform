export function isAndroidDevice(userAgent?: string): boolean {
  if (!userAgent && typeof navigator === "undefined") {
    return false;
  }

  const ua = (userAgent ?? navigator.userAgent ?? "").toLowerCase();
  return /android/.test(ua);
}

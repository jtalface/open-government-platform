export function isAndroidDevice(userAgent?: string): boolean {
  if (!userAgent && typeof navigator === "undefined") {
    return false;
  }

  const ua = (userAgent ?? navigator.userAgent ?? "").toLowerCase();
  return /android/.test(ua);
}

function getUserAgent(userAgent?: string): string {
  if (userAgent) {
    return userAgent.toLowerCase();
  }

  if (typeof navigator === "undefined") {
    return "";
  }

  return (navigator.userAgent ?? "").toLowerCase();
}

export function isIosDevice(userAgent?: string): boolean {
  const ua = getUserAgent(userAgent);
  if (!ua) {
    return false;
  }

  const isIphoneOrIpad = /iphone|ipad|ipod/.test(ua);
  const isIpadOsDesktopMode = /macintosh/.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1;

  return isIphoneOrIpad || isIpadOsDesktopMode;
}

export function isSafariOnIos(userAgent?: string): boolean {
  const ua = getUserAgent(userAgent);
  if (!ua || !isIosDevice(ua)) {
    return false;
  }

  const isSafari = /safari/.test(ua);
  const isOtherIosBrowser = /crios|fxios|edgios|opios|opt\//.test(ua);

  return isSafari && !isOtherIosBrowser;
}

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const byDisplayMode = window.matchMedia("(display-mode: standalone)").matches;
  const byNavigatorStandalone = typeof navigator !== "undefined" && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

  return byDisplayMode || byNavigatorStandalone;
}

"use client";

import { useEffect } from "react";

/**
 * Register the service worker as early as possible so Chrome can consider the
 * app installable (beforeinstallprompt). Secure contexts only (HTTPS,
 * localhost, 127.0.0.1); plain http://LAN-IP will reject — we catch and ignore.
 */
export function PwaBootstrap() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Expected on http://192.168.x.x etc. (not a secure context).
      });
    };

    registerServiceWorker();

    if (document.readyState !== "complete") {
      window.addEventListener("load", registerServiceWorker, { once: true });
    }

    return () => {
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);

  return null;
}

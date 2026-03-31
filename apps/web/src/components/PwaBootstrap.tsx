"use client";

import { useEffect } from "react";

function canRegisterServiceWorker(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  return "serviceWorker" in navigator && (window.isSecureContext || isLocalhost);
}

export function PwaBootstrap() {
  useEffect(() => {
    if (!canRegisterServiceWorker()) {
      return;
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Fail silently to avoid affecting normal site rendering.
      });
    };

    if (document.readyState === "complete") {
      registerServiceWorker();
      return;
    }

    window.addEventListener("load", registerServiceWorker, { once: true });

    return () => {
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);

  return null;
}

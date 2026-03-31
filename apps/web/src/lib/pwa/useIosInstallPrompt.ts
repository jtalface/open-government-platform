"use client";

import { useEffect, useState } from "react";
import { isIosDevice, isSafariOnIos, isStandaloneMode } from "./device";

const DISMISS_KEY = "ogp_ios_install_hint_dismissed_at";
const HINT_DELAY_MS = 1500;
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function wasDismissedRecently(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  const rawValue = window.localStorage.getItem(DISMISS_KEY);
  if (!rawValue) {
    return false;
  }

  const dismissedAt = Number(rawValue);
  if (!Number.isFinite(dismissedAt)) {
    return false;
  }

  return Date.now() - dismissedAt < DISMISS_TTL_MS;
}

export function useIosInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isIosDevice() || !isSafariOnIos() || isStandaloneMode() || wasDismissedRecently()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, HINT_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const dismiss = () => {
    setIsVisible(false);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
  };

  return { isVisible, dismiss };
}

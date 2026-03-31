"use client";

import { useCallback, useEffect, useState } from "react";
import { isAndroidDevice } from "./device";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(display-mode: standalone)").matches;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const android = isAndroidDevice();
    setIsAndroid(android);

    if (!android || isStandaloneMode()) {
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      // Prevent Chrome mini-infobar and rely on explicit in-app CTA.
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
      setCanInstall(true);
    };

    const onAppInstalled = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt || isInstalling) {
      return false;
    }

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setCanInstall(false);
      setDeferredPrompt(null);
      return true;
    } catch {
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt, isInstalling]);

  return {
    isAndroid,
    canInstall,
    isInstalling,
    install,
  };
}

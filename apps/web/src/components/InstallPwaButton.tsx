"use client";

import { useEffect, useState } from "react";
import { usePwaInstall } from "@/lib/pwa/usePwaInstall";
import { isStandaloneMode } from "@/lib/pwa/device";

interface InstallPwaButtonProps {
  className?: string;
}

const defaultButtonClass =
  "fixed bottom-4 start-4 z-50 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70";

const ANDROID_CHROME_HINT_DISMISSED_KEY = "ogp_android_chrome_install_hint_dismissed";

export function InstallPwaButton({ className }: InstallPwaButtonProps) {
  const { isAndroid, canInstall, isInstalling, install } = usePwaInstall();
  const [showChromeMenuHint, setShowChromeMenuHint] = useState(false);

  useEffect(() => {
    if (!isAndroid || isStandaloneMode() || canInstall) {
      setShowChromeMenuHint(false);
      return;
    }

    // Only on HTTPS (or localhost). On http://192.168… Chrome is not installable — no in-app nag.
    if (typeof window === "undefined" || !window.isSecureContext) {
      return;
    }

    if (sessionStorage.getItem(ANDROID_CHROME_HINT_DISMISSED_KEY) === "1") {
      return;
    }

    const id = window.setTimeout(() => setShowChromeMenuHint(true), 6000);
    return () => window.clearTimeout(id);
  }, [isAndroid, canInstall]);

  if (!isAndroid || isStandaloneMode()) {
    return null;
  }

  if (canInstall) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        disabled={isInstalling}
        className={className ?? defaultButtonClass}
      >
        {isInstalling ? "A instalar…" : "Instalar app"}
      </button>
    );
  }

  if (!showChromeMenuHint) {
    return null;
  }

  const dismissHint = () => {
    setShowChromeMenuHint(false);
    sessionStorage.setItem(ANDROID_CHROME_HINT_DISMISSED_KEY, "1");
  };

  return (
    <div
      className="fixed bottom-4 start-4 z-50 max-w-[min(92vw,280px)] rounded-xl border border-gray-200 bg-white/95 py-2 pl-3 pr-2 text-xs leading-snug text-gray-700 shadow-lg backdrop-blur-sm"
      role="note"
    >
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 pt-0.5">
          Toque em <strong>⋮</strong> e em <strong>Instalar aplicação</strong> se o botão não aparecer.
        </p>
        <button
          type="button"
          onClick={dismissHint}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          aria-label="Fechar dica"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

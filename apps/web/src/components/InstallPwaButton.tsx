"use client";

import { usePwaInstall } from "@/lib/pwa/usePwaInstall";

interface InstallPwaButtonProps {
  className?: string;
}

export function InstallPwaButton({ className }: InstallPwaButtonProps) {
  const { isAndroid, canInstall, isInstalling, install } = usePwaInstall();

  if (!isAndroid || !canInstall) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => void install()}
      disabled={isInstalling}
      className={
        className ??
        "rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      }
    >
      {isInstalling ? "Installing..." : "Install App"}
    </button>
  );
}

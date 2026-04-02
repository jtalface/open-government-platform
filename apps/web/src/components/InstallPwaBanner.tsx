"use client";

import { usePwaInstall } from "@/lib/pwa/usePwaInstall";
import { isStandaloneMode } from "@/lib/pwa/device";

/** Matches fixed bar: safe-area + 44px tap row + 1px border */
const BANNER_BLOCK =
  "h-[calc(44px+1px+max(0.375rem,env(safe-area-inset-top)))] shrink-0 w-full";

function InstallIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InstallPwaBanner() {
  const { isAndroid, canInstall, isInstalling, install } = usePwaInstall();

  if (!isAndroid || isStandaloneMode() || !canInstall) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white pt-[max(0.375rem,env(safe-area-inset-top))]"
        role="region"
        aria-label="Instalação da aplicação"
      >
        <button
          type="button"
          onClick={() => void install()}
          disabled={isInstalling}
          className="flex h-11 w-full items-center gap-2.5 px-3 text-start transition hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <InstallIcon className="shrink-0 text-blue-600" />
          <span className="min-w-0 flex-1 text-sm font-normal leading-snug text-blue-600">
            {isInstalling ? "A instalar…" : "Instalar o aplicativo Beira É Wawa."}
          </span>
        </button>
      </div>
      <div className={BANNER_BLOCK} aria-hidden />
    </>
  );
}

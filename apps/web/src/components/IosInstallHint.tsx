"use client";

import { useIosInstallPrompt } from "@/lib/pwa/useIosInstallPrompt";

export function IosInstallHint() {
  const { isVisible, dismiss } = useIosInstallPrompt();

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto w-auto max-w-md rounded-2xl border border-blue-100 bg-white p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg" aria-hidden="true">
          ⤴
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">Como instalar o aplicativo:</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-gray-600">
            <li>
              Clica em "<strong className="text-gray-800">…</strong>" no canto inferior direito.
            </li>
            <li>
              Clica em <strong className="text-gray-800">Partilhar</strong>.
            </li>
            <li>
              Clica em <strong className="text-gray-800">Adicionar ao ecrã principal</strong>.
            </li>
          </ol>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="-mr-1 -mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          aria-label="Fechar dica de instalação"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

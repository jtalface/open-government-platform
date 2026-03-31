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
          <p className="text-sm font-medium text-gray-900">Instale esta app no iPhone</p>
          <p className="mt-1 text-sm text-gray-600">
            Toque em Partilhar e depois em <strong>Adicionar ao Ecrã principal</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Fechar dica de instalação"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

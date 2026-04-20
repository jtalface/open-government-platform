import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export function LegalPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <Logo role="CITIZEN" size="sm" />
            <span className="text-sm font-medium">Home</span>
          </Link>
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}

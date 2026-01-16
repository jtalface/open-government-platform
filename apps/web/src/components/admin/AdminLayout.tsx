"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Utilizadores", href: "/admin/users", icon: "👥" },
    { name: "Categorias", href: "/admin/categories", icon: "📂" },
  ];

  const otherLinks = [
    { name: "← Voltar ao Manager", href: "/dashboard", icon: "🔙" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-white">⚙️ OGP Admin</h1>

              <nav className="flex gap-4">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-white bg-opacity-20 text-white"
                        : "text-white text-opacity-80 hover:bg-white hover:bg-opacity-10"
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <span className="rounded-full bg-white bg-opacity-20 px-3 py-1 text-xs font-semibold text-white">
                ADMIN
              </span>
              <span className="text-sm text-white">{session?.user.name}</span>
              <button
                onClick={() => signOut()}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white text-opacity-80 hover:bg-white hover:bg-opacity-10"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="flex gap-4">
            {otherLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {item.icon} {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}


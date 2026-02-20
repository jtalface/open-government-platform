"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { Logo } from "../Logo";
import { UserDropdown } from "../UserDropdown";
import { CreatePostButton } from "../channels/CreatePostButton";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: t("nav.dashboard"), href: "/admin", icon: "📊" },
    { name: t("admin.users"), href: "/admin/users", icon: "👥" },
    { name: t("admin.categories"), href: "/admin/categories", icon: "📂" },
    { name: "Canais Oficiais", href: "/admin/channels", icon: "📢" },
  ];

  const otherLinks = [
    { name: `← ${t("admin.backToManager")}`, href: "/dashboard", icon: "🔙" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Logo role="ADMIN" size="md" textColor="text-white" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
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

            {/* Right side */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden rounded-lg p-2 text-white text-opacity-80 hover:bg-white hover:bg-opacity-10"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {/* Desktop controls */}
              <div className="hidden lg:flex items-center gap-2">
                <span className="rounded-full bg-white bg-opacity-20 px-3 py-1 text-xs font-semibold text-white whitespace-nowrap">
                  ADMIN
                </span>
                <CreatePostButton />
                <UserDropdown userName={session?.user.name || ""} textColor="text-white" />
              </div>

              {/* Mobile controls */}
              <div className="lg:hidden flex items-center gap-2">
                <span className="rounded-full bg-white bg-opacity-20 px-2 py-1 text-xs font-semibold text-white">
                  ADMIN
                </span>
                <UserDropdown userName={session?.user.name || ""} textColor="text-white" />
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-white border-opacity-20 py-4">
              <nav className="flex flex-col gap-2">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-white bg-opacity-20 text-white"
                        : "text-white text-opacity-80 hover:bg-white hover:bg-opacity-10"
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
                <div className="mt-2 pt-2 border-t border-white border-opacity-20">
                  <CreatePostButton />
                </div>
              </nav>
            </div>
          )}
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


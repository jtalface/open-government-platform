"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { Logo } from "./Logo";
import { UserDropdown } from "./UserDropdown";

interface CitizenHeaderProps {
  session: any;
  activeTab?: "incidents" | "map" | "channels" | "projects";
}

export function CitizenHeader({ session, activeTab }: CitizenHeaderProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showDashboard = session.user.role === "MANAGER" || session.user.role === "ADMIN";

  const navItems = [
    { href: "/incidents", label: t("nav.incidentsList"), icon: "📋", key: "incidents" },
    { href: "/map", label: t("nav.map"), icon: "🗺️", key: "map" },
    { href: "/channels", label: t("nav.channels"), icon: "📢", key: "channels" },
    { href: "/projects", label: t("nav.projects"), icon: "🏗️", key: "projects" },
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (item.key === "incidents") return activeTab === "incidents" || pathname === "/incidents";
    if (item.key === "map") return activeTab === "map" || pathname === "/map";
    if (item.key === "channels") return activeTab === "channels" || pathname.startsWith("/channels");
    if (item.key === "projects") return activeTab === "projects" || pathname.startsWith("/projects");
    return false;
  };

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Logo role="CITIZEN" size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-2 lg:px-3 py-2 text-sm font-medium whitespace-nowrap ${
                  isActive(item)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="mr-1 lg:mr-2">{item.icon}</span>
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side - User dropdown and Dashboard button */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100"
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

            {/* Desktop user controls */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              <UserDropdown userName={session.user.name} />
              {showDashboard && (
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                >
                  {t("nav.dashboard")}
                </Link>
              )}
            </div>

            {/* Mobile user dropdown */}
            <div className="md:hidden">
              <UserDropdown userName={session.user.name} />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`rounded-lg px-4 py-3 text-base font-medium ${
                    isActive(item)
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              {showDashboard && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg bg-blue-600 px-4 py-3 text-base font-medium text-white hover:bg-blue-700"
                >
                  {t("nav.dashboard")}
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}


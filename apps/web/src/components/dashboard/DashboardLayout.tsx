"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { CreatePostButton } from "../channels/CreatePostButton";
import { Logo } from "../Logo";
import { UserDropdown } from "../UserDropdown";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const navigation = [
    { name: t("nav.dashboard"), href: "/dashboard", icon: "📊" },
    { name: t("nav.incidents"), href: "/dashboard/incidents", icon: "📍" },
    { name: t("nav.map"), href: "/dashboard/map", icon: "🗺️" },
    { name: t("nav.projects"), href: "/projects", icon: "🏗️" },
    { name: t("nav.tickets"), href: "/dashboard/tickets", icon: "🎫" },
    { name: t("nav.polls"), href: "/dashboard/polls", icon: "📊" },
  ];

  if (session?.user.role === "ADMIN") {
    navigation.push({ name: t("nav.admin"), href: "/admin", icon: "⚙️" });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Logo role="MANAGER" size="md" />
              </div>

              <nav className="flex gap-4">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <CreatePostButton />
              <UserDropdown userName={session?.user.name || ""} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}


"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MunicipalityDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = pathname === "/municipio/sobre" || pathname === "/municipio/organograma";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg px-2 lg:px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
          isActive
            ? "bg-blue-50 text-blue-600"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <span className="mr-1 lg:mr-2">🏛️</span>
        <span className="hidden lg:inline">Município</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <Link
            href="/municipio/sobre"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              pathname === "/municipio/sobre"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>📄</span>
            Sobre o Município
          </Link>
          <Link
            href="/municipio/organograma"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              pathname === "/municipio/organograma"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>📊</span>
            Organograma
          </Link>
        </div>
      )}
    </div>
  );
}

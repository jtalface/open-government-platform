"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { ChangeSecurityQuestionsDialog } from "./ChangeSecurityQuestionsDialog";

interface UserDropdownProps {
  userName: string;
  textColor?: string;
}

export function UserDropdown({ userName, textColor = "text-gray-600" }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [securityQuestionsDialogOpen, setSecurityQuestionsDialogOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:bg-opacity-20 ${textColor}`}
      >
        <span>{userName}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <ChangePasswordDialog
        isOpen={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
      />
      <ChangeSecurityQuestionsDialog
        isOpen={securityQuestionsDialogOpen}
        onClose={() => setSecurityQuestionsDialogOpen(false)}
      />

      {isOpen && (
        <div className="absolute right-0 z-40 mt-2 w-64 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setPasswordDialogOpen(true);
            }}
            className="flex w-full justify-start items-start gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <span className="min-w-0 flex-1 leading-snug">Alterar palavra-passe</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setSecurityQuestionsDialogOpen(true);
            }}
            className="flex w-full justify-start items-start gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="min-w-0 flex-1 leading-snug">Alterar perguntas de segurança</span>
          </button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex w-full justify-start items-start gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="min-w-0 flex-1 leading-snug">Terminar sessão</span>
          </button>
        </div>
      )}
    </div>
  );
}

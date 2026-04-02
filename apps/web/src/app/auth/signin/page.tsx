"use client";

import { useState, useEffect } from "react";
import { Poppins } from "next/font/google";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { Logo } from "@/components/Logo";
import { ZeusBranding } from "@/components/ZeusBranding";

const beiraTitleFont = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default function SignInPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetBanner, setResetBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("reset");
    setResetBanner(q === "1");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("auth.invalidCredentials"));
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <Logo size="lg" fixedWidth={120} fixedHeight={120} className="justify-center" />
          </div>
          <h1
            className={`${beiraTitleFont.className} mt-2 text-3xl font-semibold tracking-tight text-gray-900`}
          >
            Beira É Wawa
          </h1>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          {resetBanner && (
            <div className="mb-6 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              {t("auth.passwordResetSuccessBanner")}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t("auth.emailOrPhone")}
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder={t("auth.emailOrPhonePlaceholder")}
            />

            <Input
              label={t("auth.password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div>
              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                {isLoading ? t("auth.signingIn") : t("auth.signIn")}
              </Button>
              <div className="mt-[3px] text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            </div>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm font-medium text-gray-500">{t("auth.or")}</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <Link
            href="/auth/signup"
            className="inline-flex h-14 w-full items-center justify-center rounded-lg border-2 border-gray-300 bg-transparent text-base font-medium text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            {t("auth.createAccount")}
          </Link>
        </div>

        <ZeusBranding />
      </div>
    </div>
  );
}

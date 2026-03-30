"use client";

import { useState } from "react";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { Button, Input } from "@ogp/ui";
import { Logo } from "@/components/Logo";
import { ZeusBranding } from "@/components/ZeusBranding";
import { useTranslation } from "@/lib/i18n/TranslationContext";

const beiraTitleFont = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
});

type QuestionRow = { label: string };

export default function ForgotPasswordPage() {
  const { t, locale } = useTranslation();
  const [step, setStep] = useState<"phone" | "answers">("phone");
  const [phone, setPhone] = useState("");
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [answer3, setAnswer3] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchQuestions = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || t("common.error"));
        return;
      }
      setQuestions(data.questions || []);
      setStep("answers");
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError(t("auth.signUpPasswordHint"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          answer1,
          answer2,
          answer3,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || t("common.error"));
        return;
      }
      setSuccess(true);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
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
          <p className="mt-2 text-gray-600">{t("auth.forgotPasswordTitle")}</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          {success ? (
            <div className="space-y-4 text-center">
              <p className="text-gray-700">{t("auth.forgotPasswordSuccess")}</p>
              <Link
                href="/auth/signin?reset=1"
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-medium text-white hover:bg-blue-700"
              >
                {t("auth.forgotPasswordGoSignIn")}
              </Link>
            </div>
          ) : step === "phone" ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">{t("auth.forgotPasswordDescription")}</p>
              <Input
                label={t("auth.forgotPasswordPhoneHint")}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder={t("auth.signUpPhonePlaceholder")}
                autoComplete="tel"
              />
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}
              <Button
                type="button"
                className="w-full"
                size="lg"
                isLoading={loading}
                onClick={fetchQuestions}
                disabled={phone.trim().length < 9}
              >
                {t("auth.forgotPasswordContinue")}
              </Button>
              <p className="text-center text-sm text-gray-600">
                <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                  ← {t("auth.signIn")}
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={submitReset} className="space-y-5">
              <p className="text-xs text-gray-600">{t("auth.forgotPasswordAnswersCaseHint")}</p>
              <p className="text-xs text-gray-500">
                {t("auth.forgotPasswordPhoneHint")}:{" "}
                <span className="font-medium text-gray-700">{phone}</span>{" "}
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => {
                    setStep("phone");
                    setQuestions([]);
                    setError("");
                  }}
                >
                  ({t("auth.forgotPasswordBack")})
                </button>
              </p>

              {questions[0] && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {questions[0].label}
                  </label>
                  <input
                    type="text"
                    className="flex h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={answer1}
                    onChange={(e) => setAnswer1(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
              )}
              {questions[1] && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {questions[1].label}
                  </label>
                  <input
                    type="text"
                    className="flex h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={answer2}
                    onChange={(e) => setAnswer2(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
              )}
              {questions[2] && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {questions[2].label}
                  </label>
                  <input
                    type="text"
                    className="flex h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={answer3}
                    onChange={(e) => setAnswer3(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
              )}

              <Input
                label={t("auth.forgotPasswordNewPassword")}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <Input
                label={t("auth.forgotPasswordConfirm")}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                {t("auth.forgotPasswordSubmit")}
              </Button>
            </form>
          )}
        </div>

        <ZeusBranding />
      </div>
    </div>
  );
}

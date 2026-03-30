"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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

type QuestionOption = { id: number; label: string };

const selectClassName =
  "flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function SignUpPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>([]);
  const [q1, setQ1] = useState<number | "">("");
  const [q2, setQ2] = useState<number | "">("");
  const [q3, setQ3] = useState<number | "">("");
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [a3, setA3] = useState("");

  useEffect(() => {
    fetch(`/api/auth/security-questions?locale=${locale}`)
      .then((r) => r.json())
      .then((d) => setQuestionOptions(Array.isArray(d.questions) ? d.questions : []))
      .catch(() => setQuestionOptions([]));
  }, [locale]);

  const options1 = questionOptions;
  const options2 = useMemo(
    () => questionOptions.filter((q) => q.id !== q1),
    [questionOptions, q1]
  );
  const options3 = useMemo(
    () => questionOptions.filter((q) => q.id !== q1 && q.id !== q2),
    [questionOptions, q1, q2]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!phone || phone.length < 9) {
      setError("Por favor, introduza um número de telefone válido.");
      return;
    }

    if (q1 === "" || q2 === "" || q3 === "") {
      setError(t("auth.securitySelectAllQuestions"));
      return;
    }

    if (new Set([q1, q2, q3]).size !== 3) {
      setError(t("auth.securityQuestionsMustDiffer"));
      return;
    }

    if (a1.trim().length < 2 || a2.trim().length < 2 || a3.trim().length < 2) {
      setError(t("auth.securityAnswersTooShort"));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          password,
          securityQuestion1Id: q1,
          securityQuestion2Id: q2,
          securityQuestion3Id: q3,
          securityAnswer1: a1,
          securityAnswer2: a2,
          securityAnswer3: a3,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Ocorreu um erro ao criar a conta.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email: phone,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Conta criada, mas não foi possível entrar. Por favor, faça login manualmente.");
        return;
      }

      router.push("/incidents");
      router.refresh();
    } catch (err) {
      setError("Ocorreu um erro ao criar a conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <Logo size="lg" fixedWidth={120} fixedHeight={120} className="justify-center" />
          </div>
          <h1
            className={`${beiraTitleFont.className} text-3xl font-semibold tracking-tight text-gray-900`}
          >
            Beira É Wawa
          </h1>
          <p className="mt-2 text-gray-600">{t("auth.signUpTitle")}</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-900">{t("auth.signUpAccountData")}</h3>

              <div className="space-y-4">
                <Input
                  label={t("auth.signUpFullName")}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={t("auth.signUpFullNamePlaceholder")}
                />

                <Input
                  label={t("auth.signUpPhone")}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder={t("auth.signUpPhonePlaceholder")}
                />

                <Input
                  label={t("auth.password")}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t("auth.signUpPasswordHint")}
                />

                <Input
                  label={t("auth.signUpConfirmPassword")}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder={t("auth.signUpConfirmPasswordPlaceholder")}
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-1 text-sm font-medium text-gray-900">{t("auth.securitySectionTitle")}</h3>
              <p className="mb-4 text-xs text-gray-600">{t("auth.securitySectionHint")}</p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t("auth.securityQuestion")} 1
                  </label>
                  <select
                    className={selectClassName}
                    value={q1 === "" ? "" : String(q1)}
                    onChange={(e) => {
                      const v = e.target.value ? Number(e.target.value) : "";
                      setQ1(v);
                    }}
                    required
                  >
                    <option value="">{t("auth.securityChooseQuestion")}</option>
                    {options1.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="mt-2 flex h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={a1}
                    onChange={(e) => setA1(e.target.value)}
                    required
                    minLength={2}
                    maxLength={200}
                    placeholder={t("auth.securityAnswerPlaceholder")}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t("auth.securityQuestion")} 2
                  </label>
                  <select
                    className={selectClassName}
                    value={q2 === "" ? "" : String(q2)}
                    onChange={(e) => {
                      const v = e.target.value ? Number(e.target.value) : "";
                      setQ2(v);
                    }}
                    required
                  >
                    <option value="">{t("auth.securityChooseQuestion")}</option>
                    {options2.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="mt-2 flex h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={a2}
                    onChange={(e) => setA2(e.target.value)}
                    required
                    minLength={2}
                    maxLength={200}
                    placeholder={t("auth.securityAnswerPlaceholder")}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t("auth.securityQuestion")} 3
                  </label>
                  <select
                    className={selectClassName}
                    value={q3 === "" ? "" : String(q3)}
                    onChange={(e) => {
                      const v = e.target.value ? Number(e.target.value) : "";
                      setQ3(v);
                    }}
                    required
                  >
                    <option value="">{t("auth.securityChooseQuestion")}</option>
                    {options3.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="mt-2 flex h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={a3}
                    onChange={(e) => setA3(e.target.value)}
                    required
                    minLength={2}
                    maxLength={200}
                    placeholder={t("auth.securityAnswerPlaceholder")}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {isLoading ? t("auth.signUpSubmitting") : t("auth.signUpSubmit")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t("auth.signUpHasAccount")}{" "}
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                {t("auth.signIn")}
              </Link>
            </p>
          </div>
        </div>

        <ZeusBranding />
      </div>
    </div>
  );
}

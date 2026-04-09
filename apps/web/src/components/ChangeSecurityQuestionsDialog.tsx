"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Input, LoadingSpinner } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface ChangeSecurityQuestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type QuestionOption = { id: number; label: string };

const selectClassName =
  "flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

/** Matches signup answer field styling */
const answerInputClassName =
  "mt-2 flex h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

export function ChangeSecurityQuestionsDialog({
  isOpen,
  onClose,
}: ChangeSecurityQuestionsDialogProps) {
  const { t, locale } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordForUpdate, setPasswordForUpdate] = useState("");
  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>([]);
  const [q1, setQ1] = useState<number | "">("");
  const [q2, setQ2] = useState<number | "">("");
  const [q3, setQ3] = useState<number | "">("");
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [a3, setA3] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetAll = () => {
    setStep(1);
    setCurrentPassword("");
    setPasswordForUpdate("");
    setQ1("");
    setQ2("");
    setQ3("");
    setA1("");
    setA2("");
    setA3("");
    setError(null);
    setSuccess(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    fetch(`/api/auth/security-questions?locale=${locale}`)
      .then((r) => r.json())
      .then((d) => setQuestionOptions(Array.isArray(d.questions) ? d.questions : []))
      .catch(() => setQuestionOptions([]));
  }, [isOpen, locale]);

  const options1 = questionOptions;
  const options2 = useMemo(
    () => questionOptions.filter((q) => q.id !== q1),
    [questionOptions, q1]
  );
  const options3 = useMemo(
    () => questionOptions.filter((q) => q.id !== q1 && q.id !== q2),
    [questionOptions, q1, q2]
  );

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/security-questions/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: { verified?: boolean };
        error?: { message?: string };
      };

      if (!res.ok) {
        setError(data?.error?.message ?? `Erro ${res.status}`);
        return;
      }

      if (!data.success || !data.data?.verified) {
        setError("Resposta inválida do servidor.");
        return;
      }

      setPasswordForUpdate(currentPassword);
      setCurrentPassword("");
      setQ1("");
      setQ2("");
      setQ3("");
      setA1("");
      setA2("");
      setA3("");
      setStep(2);
    } catch {
      setError("Não foi possível verificar a palavra-passe. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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

    setLoading(true);
    try {
      const res = await fetch("/api/auth/security-questions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForUpdate,
          securityQuestion1Id: q1,
          securityQuestion2Id: q2,
          securityQuestion3Id: q3,
          securityAnswer1: a1,
          securityAnswer2: a2,
          securityAnswer3: a3,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        data?: { message?: string };
        error?: { message?: string };
      };

      if (!res.ok) {
        setError(data?.error?.message ?? `Erro ${res.status}`);
        return;
      }

      setSuccess(data?.data?.message ?? "Perguntas e respostas atualizadas com sucesso.");
      window.setTimeout(() => handleClose(), 1600);
    } catch {
      setError("Não foi possível guardar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const goBackToStep1 = () => {
    setStep(1);
    setPasswordForUpdate("");
    setQ1("");
    setQ2("");
    setQ3("");
    setA1("");
    setA2("");
    setA3("");
    setError(null);
    setSuccess(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Alterar perguntas de segurança"
      size="md"
    >
      {step === 1 ? (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-sm text-gray-600">Primeiro introduza a sua palavra-passe atual.</p>
          <Input
            label="Palavra-passe atual"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={loading}
          />
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A verificar…" : "Continuar"}
            </Button>
          </div>
        </form>
      ) : questionOptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-600">A carregar perguntas…</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
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
                  disabled={loading}
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
                  className={answerInputClassName}
                  value={a1}
                  onChange={(e) => setA1(e.target.value)}
                  required
                  minLength={2}
                  maxLength={200}
                  placeholder={t("auth.securityAnswerPlaceholder")}
                  autoComplete="off"
                  disabled={loading}
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
                  disabled={loading}
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
                  className={answerInputClassName}
                  value={a2}
                  onChange={(e) => setA2(e.target.value)}
                  required
                  minLength={2}
                  maxLength={200}
                  placeholder={t("auth.securityAnswerPlaceholder")}
                  autoComplete="off"
                  disabled={loading}
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
                  disabled={loading}
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
                  className={answerInputClassName}
                  value={a3}
                  onChange={(e) => setA3(e.target.value)}
                  required
                  minLength={2}
                  maxLength={200}
                  placeholder={t("auth.securityAnswerPlaceholder")}
                  autoComplete="off"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {success}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={goBackToStep1} disabled={loading}>
              Voltar
            </Button>
            <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar…" : "Guardar"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

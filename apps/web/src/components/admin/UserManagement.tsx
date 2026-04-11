"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Badge, LoadingSpinner, Modal, Button } from "@ogp/ui";

async function readApiErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? body?.message ?? `Erro ${res.status}`;
  } catch {
    return `Erro ${res.status}`;
  }
}

type PasswordResetModal =
  | null
  | {
      step: "form";
      userId: string;
      userName: string;
      mode: "generate" | "manual";
      manualPassword: string;
      formError: string | null;
    }
  | { step: "result"; userId: string; userName: string; temporaryPassword: string };

export function UserManagement() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [passwordResetModal, setPasswordResetModal] = useState<PasswordResetModal>(null);
  const [passwordResetSubmitting, setPasswordResetSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", searchTerm, roleFilter, includeInactive],
    queryFn: async () => {
      setListError(null);
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (roleFilter) params.set("role", roleFilter);
      if (includeInactive) params.set("includeInactive", "1");

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const msg = await readApiErrorMessage(response);
        setListError(msg);
        throw new Error(msg);
      }
      return response.json();
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error(await readApiErrorMessage(res));
      return res.json();
    },
    onMutate: () => setActionError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => setActionError(e.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readApiErrorMessage(res));
      return res.json();
    },
    onMutate: () => setActionError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => setActionError(e.message),
  });

  const reactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ active: true }),
      });
      if (!res.ok) throw new Error(await readApiErrorMessage(res));
      return res.json();
    },
    onMutate: () => setActionError(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => setActionError(e.message),
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    if (confirm(`Tem a certeza que deseja alterar a role deste utilizador?`)) {
      updateRoleMutation.mutate({ userId, role: newRole });
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (
      confirm(
        `Desativar o utilizador "${userName}"? Deixará de poder entrar na plataforma. Os registos existentes (ocorrências, etc.) mantêm-se.`
      )
    ) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleReactivateUser = (userId: string, userName: string) => {
    if (
      confirm(
        `Reativar o utilizador "${userName}"? Voltará a poder entrar com as credenciais existentes.`
      )
    ) {
      reactivateUserMutation.mutate(userId);
    }
  };

  const openPasswordResetModal = (userId: string, userName: string) => {
    setPasswordResetModal({
      step: "form",
      userId,
      userName,
      mode: "generate",
      manualPassword: "",
      formError: null,
    });
  };

  const closePasswordResetModal = () => {
    setPasswordResetModal(null);
    setPasswordResetSubmitting(false);
  };

  const submitPasswordReset = async () => {
    if (!passwordResetModal || passwordResetModal.step !== "form") return;

    const { userId, userName, mode, manualPassword } = passwordResetModal;
    const trimmed = manualPassword.trim();

    if (mode === "manual") {
      if (trimmed.length < 6) {
        setPasswordResetModal({
          step: "form",
          userId,
          userName,
          mode,
          manualPassword,
          formError: "A palavra-passe manual deve ter pelo menos 6 caracteres.",
        });
        return;
      }
    }

    setPasswordResetSubmitting(true);
    setPasswordResetModal({
      step: "form",
      userId,
      userName,
      mode,
      manualPassword,
      formError: null,
    });

    try {
      const body =
        mode === "manual" && trimmed.length >= 6 ? { newPassword: trimmed } : {};
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res));
      }
      const json = await res.json();
      const temporaryPassword = json?.data?.temporaryPassword as string | undefined;
      if (!temporaryPassword) {
        throw new Error("Resposta inválida do servidor.");
      }
      setPasswordResetModal({
        step: "result",
        userId,
        userName,
        temporaryPassword,
      });
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao repor a palavra-passe.";
      setPasswordResetModal({
        step: "form",
        userId,
        userName,
        mode,
        manualPassword,
        formError: message,
      });
    } finally {
      setPasswordResetSubmitting(false);
    }
  };

  const copyTemporaryPassword = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      alert("Não foi possível copiar automaticamente. Copie manualmente o texto mostrado.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const users = data?.data?.items || [];

  return (
    <div className="space-y-6">
      {passwordResetModal && (
        <Modal
          isOpen
          onClose={closePasswordResetModal}
          title={
            passwordResetModal.step === "result"
              ? "Palavra-passe reposta"
              : `Repor palavra-passe — ${passwordResetModal.userName}`
          }
          size="md"
        >
          {passwordResetModal.step === "form" ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Será definida uma nova palavra-passe para este utilizador. Entregue-a por um canal
                seguro (telefone, presencialmente, etc.). O sistema não envia esta palavra-passe por
                email.
              </p>

              <fieldset className="space-y-2">
                <legend className="sr-only">Modo de reposição</legend>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="resetMode"
                    checked={passwordResetModal.mode === "generate"}
                    onChange={() =>
                      setPasswordResetModal({
                        ...passwordResetModal,
                        mode: "generate",
                        formError: null,
                      })
                    }
                    className="border-gray-300"
                  />
                  Gerar automaticamente (recomendado)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="resetMode"
                    checked={passwordResetModal.mode === "manual"}
                    onChange={() =>
                      setPasswordResetModal({
                        ...passwordResetModal,
                        mode: "manual",
                        formError: null,
                      })
                    }
                    className="border-gray-300"
                  />
                  Definir manualmente
                </label>
              </fieldset>

              {passwordResetModal.mode === "manual" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nova palavra-passe
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={passwordResetModal.manualPassword}
                    onChange={(e) =>
                      setPasswordResetModal({
                        ...passwordResetModal,
                        manualPassword: e.target.value,
                        formError: null,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}

              {passwordResetModal.formError && (
                <p className="text-sm text-red-600">{passwordResetModal.formError}</p>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="secondary" onClick={closePasswordResetModal}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => void submitPasswordReset()}
                  isLoading={passwordResetSubmitting}
                >
                  Repor palavra-passe
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Guarde esta palavra-passe agora. <strong>Não voltará a ser mostrada</strong> se
                fechar esta janela.
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Palavra-passe temporária
                </p>
                <code className="block break-all rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-900">
                  {passwordResetModal.temporaryPassword}
                </code>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void copyTemporaryPassword(passwordResetModal.temporaryPassword)}
                >
                  Copiar
                </Button>
                <Button type="button" onClick={closePasswordResetModal}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {listError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {listError}
        </div>
      )}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Pesquisar
            </label>
            <input
              type="text"
              placeholder="Nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Permissões</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              <option value="CITIZEN">Cidadão</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          Mostrar utilizadores inativos
        </label>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {users.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Nenhum utilizador encontrado</p>
          </Card>
        ) : (
          users.map((user: any) => (
            <Card key={user.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    {user.active === false && (
                      <Badge variant="danger">Inativo</Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📧 {user.email}</p>
                    {user.neighborhood && (
                      <p>📍 {user.neighborhood.name}</p>
                    )}
                    <p>
                      📅 Criado:{" "}
                      {new Date(user.createdAt).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={user.active === false}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="CITIZEN">Cidadão</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>

                  {session?.user?.id !== user.id && (
                    <button
                      type="button"
                      onClick={() => openPasswordResetModal(user.id, user.name)}
                      disabled={
                        passwordResetSubmitting ||
                        deleteUserMutation.isPending ||
                        reactivateUserMutation.isPending
                      }
                      className="rounded-lg bg-amber-50 px-3 py-1 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      🔑 Repor palavra-passe
                    </button>
                  )}

                  {user.active !== false ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      disabled={deleteUserMutation.isPending || reactivateUserMutation.isPending}
                      className="rounded-lg bg-red-50 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      🗑️ Desativar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReactivateUser(user.id, user.name)}
                      disabled={reactivateUserMutation.isPending || deleteUserMutation.isPending}
                      className="rounded-lg bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      ↩ Reativar
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    CITIZEN: "Cidadão",
    MANAGER: "Manager",
    ADMIN: "Admin",
  };
  return labels[role] || role;
}

function getRoleBadgeVariant(
  role: string
): "success" | "warning" | "danger" | "info" {
  const variants: Record<string, "success" | "warning" | "danger" | "info"> = {
    CITIZEN: "info",
    MANAGER: "warning",
    ADMIN: "danger",
  };
  return variants[role] || "info";
}

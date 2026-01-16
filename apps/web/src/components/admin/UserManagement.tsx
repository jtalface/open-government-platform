"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Badge, LoadingSpinner, Button } from "@ogp/ui";
import { CreateUserModal } from "./CreateUserModal";

export function UserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", searchTerm, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (roleFilter) params.set("role", roleFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    if (confirm(`Tem a certeza que deseja alterar a role deste utilizador?`)) {
      updateRoleMutation.mutate({ userId, role: newRole });
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (
      confirm(
        `Tem a certeza que deseja eliminar o utilizador "${userName}"? Esta ação não pode ser revertida.`
      )
    ) {
      deleteUserMutation.mutate(userId);
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
      {/* Filters */}
      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-3">
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
            <label className="mb-2 block text-sm font-medium text-gray-700">Role</label>
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

          <div className="flex items-end">
            <Button onClick={() => setIsCreateModalOpen(true)} className="w-full">
              ➕ Criar Utilizador
            </Button>
          </div>
        </div>
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
                      <Badge variant="error">Inativo</Badge>
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
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CITIZEN">Cidadão</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>

                  <button
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    className="rounded-lg bg-red-50 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <CreateUserModal onClose={() => setIsCreateModalOpen(false)} />
      )}
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
): "success" | "warning" | "error" | "info" {
  const variants: Record<string, "success" | "warning" | "error" | "info"> = {
    CITIZEN: "info",
    MANAGER: "warning",
    ADMIN: "error",
  };
  return variants[role] || "info";
}


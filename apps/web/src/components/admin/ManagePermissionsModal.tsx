"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Badge, LoadingSpinner } from "@ogp/ui";

interface ManagePermissionsModalProps {
  channel: any;
  onClose: () => void;
}

export function ManagePermissionsModal({ channel, onClose }: ManagePermissionsModalProps) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState("");

  // Fetch permissions
  const { data: permissionsData, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["channel-permissions", channel.id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/channels/${channel.id}/permissions`);
      if (!response.ok) throw new Error("Failed to fetch permissions");
      return response.json();
    },
  });

  // Fetch available users (managers/admins)
  const { data: usersData } = useQuery({
    queryKey: ["municipality-users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const grantMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/channels/${channel.id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to grant permission");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-permissions", channel.id] });
      setSelectedUserId("");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(
        `/api/admin/channels/${channel.id}/permissions?userId=${userId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to revoke permission");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-permissions", channel.id] });
    },
  });

  const permissions = permissionsData?.data || [];
  const users = usersData?.data?.items || [];

  // Filter out users who already have permission
  const availableUsers = users.filter(
    (user: any) =>
      (user.role === "MANAGER" || user.role === "ADMIN") &&
      !permissions.some((p: any) => p.userId === user.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciar Permissões</h2>
            <p className="text-sm text-gray-600">
              {channel.name} - {channel.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Grant Permission Form */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Conceder Permissão
            </h3>
            <div className="flex gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Selecionar usuário --</option>
                {availableUsers.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => grantMutation.mutate(selectedUserId)}
                disabled={!selectedUserId}
                isLoading={grantMutation.isPending}
              >
                Conceder
              </Button>
            </div>
            {grantMutation.isError && (
              <p className="mt-2 text-sm text-red-600">
                {grantMutation.error?.message}
              </p>
            )}
          </div>

          {/* Current Permissions List */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Permissões Atuais ({permissions.length})
            </h3>

            {isLoadingPermissions ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : permissions.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-gray-600">
                  Nenhum usuário tem permissão para publicar neste canal
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {permissions.map((permission: any) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {permission.user.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {permission.user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{permission.user.role}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeMutation.mutate(permission.userId)}
                        isLoading={revokeMutation.isPending}
                      >
                        Revogar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Badge, LoadingSpinner } from "@ogp/ui";
import { CreateChannelModal } from "./CreateChannelModal";
import { EditChannelModal } from "./EditChannelModal";
import { ManagePermissionsModal } from "./ManagePermissionsModal";

export function ChannelsManagement() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [managingPermissions, setManagingPermissions] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-channels"],
    queryFn: async () => {
      const response = await fetch("/api/admin/channels");
      if (!response.ok) throw new Error("Failed to fetch channels");
      return response.json();
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ channelId, isActive }: { channelId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Failed to update channel");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-channels"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const channels = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Criar Novo Canal
        </Button>
      </div>

      {/* Channels List */}
      {channels.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mb-4 text-6xl">📢</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Nenhum canal criado
          </h3>
          <p className="text-gray-600">
            Crie o primeiro canal oficial para começar
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {channels.map((channel: any) => (
            <Card key={channel.id} className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {channel.name}
                    </h3>
                    {channel.isActive ? (
                      <Badge variant="success">Ativo</Badge>
                    ) : (
                      <Badge variant="default">Inativo</Badge>
                    )}
                  </div>
                  <p className="mb-2 text-sm font-medium text-blue-600">
                    {channel.title}
                  </p>
                  {channel.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {channel.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mb-4 flex gap-4 text-sm text-gray-600">
                <span>📝 {channel._count.posts} posts</span>
                <span>👥 {channel._count.permissions} permissões</span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingChannel(channel)}
                >
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setManagingPermissions(channel)}
                >
                  Permissões
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toggleActiveMutation.mutate({
                      channelId: channel.id,
                      isActive: !channel.isActive,
                    })
                  }
                  isLoading={toggleActiveMutation.isPending}
                >
                  {channel.isActive ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateChannelModal onClose={() => setIsCreateModalOpen(false)} />
      )}

      {editingChannel && (
        <EditChannelModal
          channel={editingChannel}
          onClose={() => setEditingChannel(null)}
        />
      )}

      {managingPermissions && (
        <ManagePermissionsModal
          channel={managingPermissions}
          onClose={() => setManagingPermissions(null)}
        />
      )}
    </div>
  );
}


"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input } from "@ogp/ui";

interface EditChannelModalProps {
  channel: any;
  onClose: () => void;
}

export function EditChannelModal({ channel, onClose }: EditChannelModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(channel.name);
  const [title, setTitle] = useState(channel.title);
  const [bio, setBio] = useState(channel.bio || "");

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/channels/${channel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update channel");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-channels"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ name, title, bio });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Editar Canal</h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do Oficial"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Cargo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Biografia (Opcional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="flex w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={updateMutation.isPending}>
              Salvar Alterações
            </Button>
          </div>

          {updateMutation.isError && (
            <p className="text-sm text-red-600">
              {updateMutation.error?.message || "Erro ao atualizar canal"}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}


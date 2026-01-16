"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input } from "@ogp/ui";
import { useTranslation } from "@/lib/i18n/TranslationContext";
import { useRouter } from "next/navigation";

interface CreatePostModalProps {
  channels: any[];
  selectedChannel: any | null;
  onClose: () => void;
}

export function CreatePostModal({
  channels,
  selectedChannel: initialChannel,
  onClose,
}: CreatePostModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedChannel, setSelectedChannel] = useState<any>(
    initialChannel || (channels.length === 1 ? channels[0] : null)
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/channels/${data.channelId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create post");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["channel-posts"] });
      onClose();
      // Navigate to the channel page to see the new post
      router.push(`/channels/${selectedChannel.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChannel) {
      return;
    }

    createMutation.mutate({
      channelId: selectedChannel.id,
      title,
      body,
      visibility: "PUBLIC",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("channels.createPost")}
          </h2>
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
          {/* Channel Selector (if multiple channels) */}
          {channels.length > 1 && !initialChannel && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("channels.selectChannel")} <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedChannel?.id || ""}
                onChange={(e) => {
                  const channel = channels.find((c) => c.id === e.target.value);
                  setSelectedChannel(channel);
                }}
                required
                className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- {t("channels.selectChannel")} --</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name} - {channel.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selected Channel Display (if only one or pre-selected) */}
          {selectedChannel && channels.length === 1 && (
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">
                {t("common.postingAs")}:
              </p>
              <p className="text-lg font-bold text-blue-900">
                {selectedChannel.name}
              </p>
              <p className="text-sm text-blue-700">{selectedChannel.title}</p>
            </div>
          )}

          {/* Title */}
          <Input
            label={t("channels.postTitle")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Ex: Novo projeto de infraestrutura"
          />

          {/* Body */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t("channels.postBody")} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={8}
              placeholder="Escreva sua mensagem aqui..."
              className="flex w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Info */}
          <div className="rounded-lg bg-yellow-50 p-4">
            <p className="text-sm text-yellow-900">
              ℹ️ Esta publicação será visível para todos os cidadãos do município.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={createMutation.isPending}
              disabled={!selectedChannel}
            >
              {t("common.publish")}
            </Button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-600">
              {createMutation.error?.message || t("channels.postError")}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}


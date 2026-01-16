"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input } from "@ogp/ui";

interface CreateTicketModalProps {
  incident: any;
  onClose: () => void;
}

export function CreateTicketModal({ incident, onClose }: CreateTicketModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(incident.title);
  const [description, setDescription] = useState(
    `Ticket criado a partir da ocorrência: ${incident.title}\n\n${incident.description}`
  );
  const [priority, setPriority] = useState("MEDIUM");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create ticket");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      incidentId: incident.id,
      categoryId: incident.categoryId,
      title,
      description,
      priority,
      publicVisibility: "PUBLIC",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Criar Ticket</h2>
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
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Prioridade <span className="text-red-500">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="flex w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              ℹ️ Este ticket será <strong>público</strong> e os cidadãos poderão ver as
              atualizações.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={createMutation.isPending}>
              Criar Ticket
            </Button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-600">
              ⚠️ Erro ao criar ticket. Por favor, tente novamente.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}


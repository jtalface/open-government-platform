"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input } from "@ogp/ui";

interface CreateCategoryModalProps {
  onClose: () => void;
}

export function CreateCategoryModal({ onClose }: CreateCategoryModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📂");
  const [color, setColor] = useState("#6B7280");
  const [vereador, setVereador] = useState({ name: "", phone: "", email: "" });
  const [administrador, setAdministrador] = useState({ name: "", phone: "", email: "" });
  const [responsavel, setResponsavel] = useState({ name: "", phone: "", email: "" });
  const [sortOrder, setSortOrder] = useState("0");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Vereador and Responsavel are required, Administrador is optional
    const administradorData = administrador.name || administrador.phone || administrador.email ? administrador : null;

    createMutation.mutate({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      description: description || undefined,
      icon: icon || "📂",
      color: color || "#6B7280",
      vereador, // Required - always send
      administrador: administradorData, // Optional
      responsavel, // Required - always send
      sortOrder: parseInt(sortOrder) || 0,
    });
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug) {
      setSlug(value.toLowerCase().replace(/\s+/g, "-"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Criar Vereação</h2>
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
            label="Nome"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="Ex: Obras Públicas"
          />

          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            placeholder="obras-publicas"
            helperText="URL-friendly identifier"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Ícone (Emoji)
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📂"
                maxLength={2}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cor
              </label>
              <div className="flex min-w-0 gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-16 shrink-0 cursor-pointer rounded-lg border border-gray-300"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#6B7280"
                  pattern="^#[0-9A-F]{6}$"
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <Input
            label="Ordem de Classificação"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            min="0"
            helperText="Números menores aparecem primeiro"
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrição da vereação..."
            />
          </div>

          <div className="space-y-6">
            {/* Vereador */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">
                Vereador <span className="text-red-500">*</span>
              </h3>
              <div className="space-y-3">
                <Input
                  label="Nome"
                  value={vereador.name}
                  onChange={(e) => setVereador({ ...vereador, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
                <Input
                  label="Telefone"
                  type="tel"
                  value={vereador.phone}
                  onChange={(e) => setVereador({ ...vereador, phone: e.target.value })}
                  placeholder="+258 84 123 4567"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={vereador.email}
                  onChange={(e) => setVereador({ ...vereador, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
            </div>

            {/* Administrador */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">Administrador</h3>
              <div className="space-y-3">
                <Input
                  label="Nome"
                  value={administrador.name}
                  onChange={(e) => setAdministrador({ ...administrador, name: e.target.value })}
                  placeholder="Nome completo"
                />
                <Input
                  label="Telefone"
                  type="tel"
                  value={administrador.phone}
                  onChange={(e) => setAdministrador({ ...administrador, phone: e.target.value })}
                  placeholder="+258 84 123 4567"
                />
                <Input
                  label="Email"
                  type="email"
                  value={administrador.email}
                  onChange={(e) => setAdministrador({ ...administrador, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            {/* Responsável */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">
                Responsável <span className="text-red-500">*</span>
              </h3>
              <div className="space-y-3">
                <Input
                  label="Nome"
                  value={responsavel.name}
                  onChange={(e) => setResponsavel({ ...responsavel, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
                <Input
                  label="Telefone"
                  type="tel"
                  value={responsavel.phone}
                  onChange={(e) => setResponsavel({ ...responsavel, phone: e.target.value })}
                  placeholder="+258 84 123 4567"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={responsavel.email}
                  onChange={(e) => setResponsavel({ ...responsavel, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={createMutation.isPending}>
              Criar
            </Button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-600">
              ⚠️ {(createMutation.error as Error).message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}


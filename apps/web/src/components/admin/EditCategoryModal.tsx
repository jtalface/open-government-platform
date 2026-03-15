"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input } from "@ogp/ui";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  vereador?: string | null;
  administrador?: string | null;
  responsavel?: string | null;
  sortOrder: number;
  active: boolean;
}

interface EditCategoryModalProps {
  category: Category;
  onClose: () => void;
}

export function EditCategoryModal({ category, onClose }: EditCategoryModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [description, setDescription] = useState(category.description || "");
  const [icon, setIcon] = useState(category.icon);
  const [color, setColor] = useState(category.color);
  const [vereador, setVereador] = useState(category.vereador || "");
  const [administrador, setAdministrador] = useState(category.administrador || "");
  const [responsavel, setResponsavel] = useState(category.responsavel || "");
  const [sortOrder, setSortOrder] = useState(category.sortOrder.toString());
  const [active, setActive] = useState(category.active);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || "Falha ao atualizar vereação");
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
    updateMutation.mutate({
      name,
      slug,
      description: description || undefined,
      icon: icon || "📂",
      color: color || "#6B7280",
      vereador: vereador || null,
      administrador: administrador || null,
      responsavel: responsavel || null,
      sortOrder: parseInt(sortOrder) || 0,
      active,
    });
  };

  // Auto-generate slug from name if slug is empty
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === category.slug) {
      setSlug(value.toLowerCase().replace(/\s+/g, "-"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-md flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Editar Vereação</h2>
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
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
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
            <div>
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

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cor
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-20 cursor-pointer rounded-lg border border-gray-300"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#6B7280"
                  pattern="^#[0-9A-F]{6}$"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="space-y-4">
            <Input
              label="Vereador"
              value={vereador}
              onChange={(e) => setVereador(e.target.value)}
              placeholder="Nome do vereador"
            />
            <Input
              label="Administrador"
              value={administrador}
              onChange={(e) => setAdministrador(e.target.value)}
              placeholder="Nome do administrador"
            />
            <Input
              label="Responsável"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Vereação ativa
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={updateMutation.isPending}>
              Atualizar
            </Button>
          </div>

          {updateMutation.isError && (
            <p className="text-sm text-red-600">
              ⚠️ {(updateMutation.error as Error).message}
            </p>
          )}
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input } from "@ogp/ui";

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  vereador?: ContactInfo | null;
  administrador?: ContactInfo | null;
  responsavel?: ContactInfo | null;
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
  const [vereador, setVereador] = useState(
    category.vereador && typeof category.vereador === "object" && category.vereador !== null
      ? { name: (category.vereador as any).name || "", phone: (category.vereador as any).phone || "", email: (category.vereador as any).email || "" }
      : { name: "", phone: "", email: "" }
  );
  const [administrador, setAdministrador] = useState(
    category.administrador && typeof category.administrador === "object" && category.administrador !== null
      ? { name: (category.administrador as any).name || "", phone: (category.administrador as any).phone || "", email: (category.administrador as any).email || "" }
      : { name: "", phone: "", email: "" }
  );
  const [responsavel, setResponsavel] = useState(
    category.responsavel && typeof category.responsavel === "object" && category.responsavel !== null
      ? { name: (category.responsavel as any).name || "", phone: (category.responsavel as any).phone || "", email: (category.responsavel as any).email || "" }
      : { name: "", phone: "", email: "" }
  );
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
    // Vereador and Responsavel are required, Administrador is optional
    const administradorData = administrador.name || administrador.phone || administrador.email ? administrador : null;

    updateMutation.mutate({
      name,
      slug,
      description: description || undefined,
      icon: icon || "📂",
      color: color || "#6B7280",
      vereador, // Required - always send
      administrador: administradorData, // Optional
      responsavel, // Required - always send
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

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
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

            {updateMutation.isError && (
              <p className="mt-4 text-sm text-red-600">
                ⚠️ {(updateMutation.error as Error).message}
              </p>
            )}
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4">
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" isLoading={updateMutation.isPending}>
                Atualizar
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

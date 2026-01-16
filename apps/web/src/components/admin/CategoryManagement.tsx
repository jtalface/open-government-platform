"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Badge, LoadingSpinner, Button } from "@ogp/ui";
import { CreateCategoryModal } from "./CreateCategoryModal";

export function CategoryManagement() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to update category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const handleToggleActive = (id: string, currentActive: boolean, name: string) => {
    const action = currentActive ? "desativar" : "ativar";
    if (confirm(`Tem a certeza que deseja ${action} a categoria "${name}"?`)) {
      toggleActiveMutation.mutate({ id, active: !currentActive });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (
      confirm(
        `Tem a certeza que deseja eliminar a categoria "${name}"? Esta ação não pode ser revertida.`
      )
    ) {
      deleteCategoryMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const categories = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateModalOpen(true)}>
          ➕ Criar Categoria
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.length === 0 ? (
          <Card className="col-span-full p-8 text-center">
            <p className="text-gray-500">Nenhuma categoria encontrada</p>
          </Card>
        ) : (
          categories.map((category: any) => (
            <Card key={category.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-2xl">{category.icon || "📂"}</span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={category.active ? "success" : "error"}>
                    {category.active ? "Ativa" : "Inativa"}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    slug: {category.slug}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleToggleActive(category.id, category.active, category.name)
                    }
                    className="flex-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                  >
                    {category.active ? "🔒 Desativar" : "✅ Ativar"}
                  </button>
                  <button
                    onClick={() => handleDelete(category.id, category.name)}
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Category Modal */}
      {isCreateModalOpen && (
        <CreateCategoryModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}


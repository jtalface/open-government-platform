"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, LoadingSpinner } from "@ogp/ui";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function DeletedIncidentsList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "incidents", "deleted"],
    queryFn: async () => {
      const res = await fetch("/api/admin/incidents/deleted");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      return json.data as {
        items: Array<{
          id: string;
          title: string;
          deletedAt: string;
          category: { name: string };
          createdBy: { name: string };
        }>;
        total: number;
      };
    },
  });

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-6 text-red-600">
        Não foi possível carregar as ocorrências removidas.
      </Card>
    );
  }

  if (data.items.length === 0) {
    return (
      <Card className="p-8 text-center text-gray-600">
        Nenhuma ocorrência removida neste município.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="divide-y divide-gray-100">
        {data.items.map((inc) => (
          <div
            key={inc.id}
            className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <Link
                href={`/incidents/${inc.id}`}
                className="font-medium text-blue-700 hover:text-blue-900 hover:underline"
              >
                {inc.title}
              </Link>
              <p className="text-sm text-gray-500">
                {inc.category.name} · {inc.createdBy.name}
              </p>
            </div>
            <p className="text-xs text-gray-400 whitespace-nowrap">
              Removida{" "}
              {formatDistanceToNow(new Date(inc.deletedAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
        ))}
      </div>
      {data.total > data.items.length && (
        <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
          A mostrar {data.items.length} de {data.total}.
        </p>
      )}
    </Card>
  );
}

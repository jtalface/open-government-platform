"use client";

import { useState, useMemo } from "react";
import { OrgChart } from "@/components/OrgChart";
import { orgChartData } from "@/data/cmbOrg2017_2021";
import { Card } from "@ogp/ui";

export function OrgChartPageClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);
  const [collapseAll, setCollapseAll] = useState(false);

  // Get all root nodes (nodes with parentId === null)
  const rootNodes = useMemo(
    () => orgChartData.filter((node) => node.parentId === null),
    []
  );

  // Find first matching node for focus
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const match = orgChartData.find((node) => {
        const title = node.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return title.includes(query);
      });
      if (match) {
        setFocusNodeId(match.id);
        // Reset after focusing
        setTimeout(() => setFocusNodeId(null), 100);
      }
    }
  };

  const handleExpandAll = () => {
    setCollapseAll(false);
    setExpandAll(true);
    setTimeout(() => setExpandAll(false), 100);
  };

  const handleCollapseAll = () => {
    setExpandAll(false);
    setCollapseAll(true);
    setTimeout(() => setCollapseAll(false), 100);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Organograma</h1>
        <p className="text-gray-600">
          Estrutura organizacional da Câmara Municipal da Beira (2017-2021)
        </p>
      </div>

      <Card className="p-6">
        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="flex-1 w-full sm:w-auto">
            <label htmlFor="org-search" className="sr-only">
              Pesquisar no organograma
            </label>
            <input
              id="org-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Pesquisar por nome..."
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Pesquisar no organograma"
            />
            {searchQuery && (
              <p className="mt-1 text-sm text-gray-500">
                Pressione Enter para focar no primeiro resultado
              </p>
            )}
          </div>

          {/* Expand/Collapse buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleExpandAll}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              aria-label="Expandir todos os nós"
            >
              Expandir Todos
            </button>
            <button
              onClick={handleCollapseAll}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              aria-label="Colapsar todos os nós"
            >
              Colapsar Todos
            </button>
          </div>
        </div>

        {/* Multiple Chart Containers */}
        <div className="space-y-8">
          {rootNodes.map((rootNode) => (
            <div key={rootNode.id}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {rootNode.title}
              </h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: "600px" }}>
                <OrgChart
                  data={orgChartData}
                  rootNodeId={rootNode.id}
                  focusNodeId={focusNodeId}
                  expandAll={expandAll}
                  collapseAll={collapseAll}
                  onNodeClick={(nodeId) => {
                    console.log("Node clicked:", nodeId);
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Como usar:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Use a roda do mouse ou trackpad para fazer zoom</li>
            <li>Arraste com o mouse para mover o organograma</li>
            <li>Clique em um nó para expandir/colapsar seus filhos</li>
            <li>Use a pesquisa e pressione Enter para encontrar e focar em um nó específico</li>
            <li>Use os botões de zoom no canto inferior direito para controlar o zoom</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

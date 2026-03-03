"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { OrgNode } from "@/data/cmbOrg2017_2021";

interface OrgChartProps {
  data: OrgNode[];
  rootNodeId?: string | null; // Optional: specify which root node to display
  onNodeClick?: (nodeId: string) => void;
  focusNodeId?: string | null;
  expandAll?: boolean;
  collapseAll?: boolean;
}

const kindColors: Record<string, string> = {
  top: "#3b82f6",
  vereacao: "#10b981",
  gabinete: "#8b5cf6",
  departamento: "#f59e0b",
  servico: "#6b7280",
  unidade: "#14b8a6",
};

function OrgNodeCard({ node, onClick, hasChildren, isExpanded }: { 
  node: OrgNode; 
  onClick: () => void;
  hasChildren: boolean;
  isExpanded: boolean;
}) {
  const color = kindColors[node.kind] || "#6b7280";

  return (
    <div
      onClick={onClick}
      className="relative bg-white border-l-4 rounded-md p-2 md:p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full"
      style={{ borderLeftColor: color }}
    >
      <div className="text-xs md:text-sm font-semibold text-gray-900 text-center leading-tight">
        {node.title}
      </div>
      {hasChildren && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
          {isExpanded ? "▼" : "▶"}
        </div>
      )}
    </div>
  );
}

// Recursive component to render nested children
function NestedChildren({ 
  parentId, 
  data, 
  expandedNodes, 
  onNodeClick, 
  level = 0 
}: { 
  parentId: string; 
  data: OrgNode[]; 
  expandedNodes: Set<string>;
  onNodeClick: (nodeId: string) => void;
  level?: number;
}) {
  const children = useMemo(
    () => data.filter((n) => n.parentId === parentId),
    [data, parentId]
  );

  if (children.length === 0) return null;

  const isExpanded = expandedNodes.has(parentId);

  if (!isExpanded) return null;

  return (
    <div className={`mt-3 ${level > 0 ? "ml-4 pl-4 border-l-2 border-gray-200" : ""}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {children.map((node) => {
          const nodeChildren = data.filter((n) => n.parentId === node.id);
          const hasChildren = nodeChildren.length > 0;
          const isNodeExpanded = expandedNodes.has(node.id);

          return (
            <div key={node.id} data-node-id={node.id} className="flex flex-col">
              <OrgNodeCard
                node={node}
                onClick={() => onNodeClick(node.id)}
                hasChildren={hasChildren}
                isExpanded={isNodeExpanded}
              />
              {hasChildren && (
                <NestedChildren
                  parentId={node.id}
                  data={data}
                  expandedNodes={expandedNodes}
                  onNodeClick={onNodeClick}
                  level={level + 1}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OrgChart({
  data,
  rootNodeId = null,
  onNodeClick,
  focusNodeId,
  expandAll,
  collapseAll,
}: OrgChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Get root node - either specified or first one found
  const rootNode = useMemo(() => {
    if (rootNodeId) {
      return data.find((n) => n.id === rootNodeId && n.parentId === null);
    }
    return data.find((n) => n.parentId === null);
  }, [data, rootNodeId]);

  const childrenNodes = useMemo(
    () => data.filter((n) => n.parentId === rootNode?.id),
    [data, rootNode]
  );

  // Initialize expanded nodes - expand root by default
  useEffect(() => {
    if (rootNode) {
      setExpandedNodes((prev) => new Set([...prev, rootNode.id]));
    }
  }, [rootNode]);

  // Handle expand all / collapse all
  useEffect(() => {
    if (expandAll && rootNode) {
      setExpandedNodes(new Set(data.map((n) => n.id)));
    } else if (collapseAll && rootNode) {
      setExpandedNodes(new Set([rootNode.id]));
    }
  }, [expandAll, collapseAll, data, rootNode]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
      onNodeClick?.(nodeId);
    },
    [onNodeClick]
  );

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.max(0.5, Math.min(2, prev * delta)));
  }, []);

  // Handle mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Focus on specific node if requested
  useEffect(() => {
    if (focusNodeId && containerRef.current) {
      const element = containerRef.current.querySelector(`[data-node-id="${focusNodeId}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        setPosition({
          x: containerRect.width / 2 - rect.left - rect.width / 2,
          y: containerRect.height / 2 - rect.top - rect.height / 2,
        });
        (element as HTMLElement).style.transition = "all 0.3s";
        (element as HTMLElement).style.transform = "scale(1.1)";
        setTimeout(() => {
          (element as HTMLElement).style.transform = "scale(1)";
        }, 500);
      }
    }
  }, [focusNodeId]);

  if (!rootNode) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Nenhum dado disponível
      </div>
    );
  }

  const rootHasChildren = childrenNodes.length > 0;
  const isRootExpanded = expandedNodes.has(rootNode.id);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-gray-100 relative"
      style={{ minHeight: "600px" }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={contentRef}
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? "none" : "transform 0.1s",
        }}
      >
        <div className="p-4 md:p-8">
          {/* Root Node */}
          <div className="flex flex-col items-center mb-2 md:mb-3">
            <div data-node-id={rootNode.id}>
              <OrgNodeCard
                node={rootNode}
                onClick={() => handleNodeClick(rootNode.id)}
                hasChildren={rootHasChildren}
                isExpanded={isRootExpanded}
              />
            </div>
            
            {/* Connector line */}
            {rootHasChildren && (
              <div className="w-0.5 h-10 md:h-12 bg-gray-300 my-2"></div>
            )}
          </div>

          {/* Children Nodes - Grid Layout with nested support */}
          {isRootExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 max-w-6xl mx-auto">
              {childrenNodes.map((node) => {
                const nodeChildren = data.filter((n) => n.parentId === node.id);
                const hasChildren = nodeChildren.length > 0;
                const isNodeExpanded = expandedNodes.has(node.id);

                return (
                  <div key={node.id} data-node-id={node.id} className="flex flex-col">
                    <OrgNodeCard
                      node={node}
                      onClick={() => handleNodeClick(node.id)}
                      hasChildren={hasChildren}
                      isExpanded={isNodeExpanded}
                    />
                    {hasChildren && (
                      <NestedChildren
                        parentId={node.id}
                        data={data}
                        expandedNodes={expandedNodes}
                        onNodeClick={handleNodeClick}
                        level={1}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2 z-10">
        <button
          onClick={() => setScale((prev) => Math.min(2, prev + 0.1))}
          className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}
          className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
          className="px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded"
          aria-label="Reset view"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

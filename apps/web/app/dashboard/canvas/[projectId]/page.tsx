"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProject } from "../../../../lib/projects";
import { Project } from "../../../../types";
import { Plus, Wand2, ZoomIn, ZoomOut, Maximize2, Code, MoreVertical, Key } from "lucide-react";

interface Column {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  constraints: string[];
}

interface Table {
  id: string;
  name: string;
  x: number;
  y: number;
  columns: Column[];
}

export default function CanvasPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tables, setTables] = useState<Table[]>([
    {
      id: "1",
      name: "users",
      x: 200,
      y: 200,
      columns: [
        { name: "id", type: "uuid", isPrimaryKey: true, constraints: ["NN"] },
        { name: "email", type: "varchar(255)", isPrimaryKey: false, constraints: ["NN", "U"] },
        { name: "password", type: "varchar(255)", isPrimaryKey: false, constraints: ["NN"] },
        { name: "created_at", type: "timestamp", isPrimaryKey: false, constraints: ["NN"] },
      ],
    },
    {
      id: "2",
      name: "posts",
      x: 600,
      y: 200,
      columns: [
        { name: "id", type: "uuid", isPrimaryKey: true, constraints: ["NN"] },
        { name: "title", type: "varchar(255)", isPrimaryKey: false, constraints: ["NN"] },
        { name: "content", type: "text", isPrimaryKey: false, constraints: [] },
        { name: "user_id", type: "uuid", isPrimaryKey: false, constraints: ["NN", "FK"] },
      ],
    },
  ]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const data = await getProject(projectId);
        setProject(data);
      } catch (error) {
        console.error("Failed to fetch project", error);
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, router]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] border border-mocha-surface0 rounded-xl bg-mocha-mantle flex items-center justify-center">
        <div className="text-mocha-subtext0">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-[calc(100vh-8rem)] border border-mocha-surface0 rounded-xl bg-mocha-mantle flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-mocha-subtext0">Project not found</div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-mocha-mauve text-mocha-crust rounded-lg hover:bg-mocha-mauve/90 transition-colors"
          >
            Back to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-mocha-base relative overflow-hidden flex flex-col">
      {/* Header - Simple Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 text-sm text-mocha-subtext0 hover:text-mocha-text hover:bg-mocha-surface0 rounded-lg transition-colors border border-mocha-surface0 bg-mocha-mantle/80 backdrop-blur-sm"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-mocha-base">
        {/* Infinite Grid Background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#313244_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        
        {/* Connection Lines */}
        {tables.length >= 2 && (() => {
          const table1 = tables[0];
          const table2 = tables[1];
          if (!table1 || !table2) return null;
          return (
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
              <line
                x1={table1.x + 200}
                y1={table1.y + 120}
                x2={table2.x}
                y2={table2.y + 120}
                stroke="#45475a"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#45475a" />
                </marker>
              </defs>
            </svg>
          );
        })()}

        {/* Table Nodes */}
        <div className="relative" style={{ zIndex: 2 }}>
          {tables.map((table) => (
            <TableNode key={table.id} table={table} />
          ))}
        </div>
      </div>

      {/* Floating Toolbar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 bg-mocha-mantle/80 backdrop-blur-md rounded-full px-4 py-2 border border-mocha-surface0 shadow-lg">
          <button className="p-2 hover:bg-mocha-surface0 rounded-full transition-colors text-mocha-subtext0 hover:text-mocha-text">
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-mocha-surface0"></div>
          <button className="p-2 hover:bg-mocha-surface0 rounded-full transition-colors text-mocha-subtext0 hover:text-mocha-text">
            <Wand2 className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-mocha-surface0"></div>
          <button className="p-2 hover:bg-mocha-surface0 rounded-full transition-colors text-mocha-subtext0 hover:text-mocha-text">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-mocha-surface0 rounded-full transition-colors text-mocha-subtext0 hover:text-mocha-text">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-mocha-surface0 rounded-full transition-colors text-mocha-subtext0 hover:text-mocha-text">
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-mocha-surface0"></div>
          <button className="p-2 hover:bg-mocha-surface0 rounded-full transition-colors text-mocha-mauve hover:text-mocha-lavender">
            <Code className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TableNode({ table }: { table: Table }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="absolute bg-mocha-mantle border border-mocha-surface0 rounded-xl shadow-lg"
      style={{
        left: `${table.x}px`,
        top: `${table.y}px`,
        width: "280px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-mocha-surface0">
        <h3 className="font-bold text-mocha-text text-sm">{table.name}</h3>
        <button className="p-1 hover:bg-mocha-surface0 rounded transition-colors text-mocha-subtext0 hover:text-mocha-text">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Body - Column List */}
      <div className="px-2 py-2">
        {table.columns.map((column, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-mocha-surface0/50 rounded transition-colors group"
          >
            {/* Left Handle */}
            <div className="w-2 h-2 rounded-full bg-mocha-surface1 group-hover:bg-mocha-mauve transition-colors"></div>
            
            {/* Key Icon */}
            {column.isPrimaryKey && (
              <Key className="w-3.5 h-3.5 text-mocha-yellow flex-shrink-0" />
            )}
            {!column.isPrimaryKey && <div className="w-3.5"></div>}

            {/* Column Name */}
            <span className="text-mocha-text text-sm flex-1">{column.name}</span>

            {/* Data Type */}
            <span className="text-mocha-subtext0 text-xs font-mono">{column.type}</span>

            {/* Constraints */}
            <div className="flex gap-1">
              {column.constraints.map((constraint, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 text-xs bg-mocha-surface0 text-mocha-subtext0 rounded"
                >
                  {constraint}
                </span>
              ))}
            </div>

            {/* Right Handle */}
            <div className="w-2 h-2 rounded-full bg-mocha-surface1 group-hover:bg-mocha-mauve transition-colors"></div>
          </div>
        ))}
      </div>

      {/* Footer - Add Column Button */}
      {isHovered && (
        <div className="px-4 py-2 border-t border-mocha-surface0">
          <button className="w-full text-left px-2 py-1.5 text-sm text-mocha-subtext0 hover:text-mocha-text hover:bg-mocha-surface0 rounded transition-colors">
            + Add Column
          </button>
        </div>
      )}
    </div>
  );
}

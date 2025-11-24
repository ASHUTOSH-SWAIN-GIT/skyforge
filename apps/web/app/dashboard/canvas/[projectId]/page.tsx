"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { getProject, updateProject, exportProjectSQL, exportProjectSQLAI } from "../../../../lib/projects";
import { Project } from "../../../../types";
import { Plus, Wand2, ZoomIn, ZoomOut, Maximize2, Code, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useCanvasStore } from "../store";
import TableNode from "../TableNode";

const nodeTypes = {
  tableNode: TableNode,
};

function CanvasInner() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [sqlPreview, setSqlPreview] = useState<string | null>(null);
  const [sqlSource, setSqlSource] = useState<"standard" | "ai">("standard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addTable,
    loadFromData,
    exportToData,
  } = useCanvasStore();

  const { fitView, zoomIn, zoomOut, screenToFlowPosition } = useReactFlow();

  // Debug: Log when nodes change
  useEffect(() => {
    console.log("Nodes updated:", nodes.length, nodes);
  }, [nodes]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const data = await getProject(projectId);
        setProject(data);
        
        // Always clear the canvas first when switching projects
        setNodes([]);
        setEdges([]);
        
        // Load canvas data from project if it exists
        if (data.data) {
          try {
            const canvasData = typeof data.data === "string" 
              ? JSON.parse(data.data) 
              : data.data;
            if (canvasData && (canvasData.nodes || canvasData.edges)) {
              loadFromData(canvasData);
            }
          } catch (error) {
            console.error("Failed to parse canvas data", error);
            // If parsing fails, ensure we have empty canvas
            setNodes([]);
            setEdges([]);
          }
        } else {
          // No data exists, ensure empty canvas
          setNodes([]);
          setEdges([]);
        }
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
  }, [projectId, router, loadFromData, setNodes, setEdges]);

  const handleSave = useCallback(async () => {
    if (!project) return;
    
    try {
      setIsSaving(true);
      const canvasData = exportToData();
      await updateProject(projectId, {
        data: canvasData,
      });
    } catch (error) {
      console.error("Failed to save project", error);
    } finally {
      setIsSaving(false);
    }
  }, [project, projectId, exportToData]);

  const handleAddTable = useCallback(() => {
    // Add table at center of viewport
    const centerX = window.innerWidth / 2 - 140;
    const centerY = window.innerHeight / 2 - 100;
    try {
      const position = screenToFlowPosition({ x: centerX, y: centerY });
      addTable(position.x, position.y);
    } catch (error) {
      console.error("Error adding table:", error);
      // Fallback: add at fixed position if screenToFlowPosition fails
      addTable(400, 300);
    }
  }, [addTable, screenToFlowPosition]);

  const lastClickTime = useRef(0);
  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    // Detect double-click (within 300ms)
    const now = Date.now();
    if (now - lastClickTime.current < 300) {
      // Double-click detected - create table at click position
      try {
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        addTable(position.x, position.y);
        lastClickTime.current = 0; // Reset to prevent triple-click
      } catch (error) {
        console.error("Error adding table on double-click:", error);
        // Fallback: add at click position relative to viewport
        addTable(event.clientX - 140, event.clientY - 100);
      }
    } else {
      lastClickTime.current = now;
    }
  }, [addTable, screenToFlowPosition]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  const handleExport = useCallback(async (mode: "standard" | "ai") => {
    if (!project) return;
    try {
      setIsExporting(true);
      setSqlSource(mode);
      setSqlPreview(null);
      const sql =
        mode === "standard"
          ? await exportProjectSQL(project.id.toString())
          : await exportProjectSQLAI(project.id.toString());
      setSqlPreview(sql);
    } catch (error) {
      console.error("Failed to export SQL", error);
      if (mode === "ai") {
        try {
          const fallbackSql = await exportProjectSQL(project.id.toString());
          setSqlSource("standard");
          setSqlPreview(
            `-- AI export failed (${error instanceof Error ? error.message : "Unknown error"}). Showing standard SQL instead.\n\n${fallbackSql}`
          );
        } catch (fallbackError) {
          console.error("Fallback SQL export failed", fallbackError);
          setSqlPreview(
            `Failed to generate SQL: ${
              fallbackError instanceof Error ? fallbackError.message : "Unknown error"
            }`
          );
        }
      } else {
        setSqlPreview(
          `Failed to generate SQL: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    } finally {
      setIsExporting(false);
    }
  }, [project]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-mocha-base flex items-center justify-center">
        <div className="text-mocha-subtext0">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen w-screen bg-mocha-base flex items-center justify-center">
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
    <div className="h-screen w-screen bg-mocha-base relative flex overflow-hidden">
      {/* Collapsible Sidebar */}
      <div
        className={`h-full bg-mocha-mantle border-r border-mocha-surface0 transition-all duration-300 ease-in-out flex-shrink-0 ${
          isSidebarOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        <div className={`h-full flex flex-col ${isSidebarOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-mocha-surface0 flex items-center justify-between">
            <h2 className="text-mocha-text font-semibold text-sm">Tools</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 hover:bg-mocha-surface0 rounded transition-colors text-mocha-subtext0 hover:text-mocha-text"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Table Actions */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-mocha-subtext1 uppercase tracking-wider">Tables</h3>
              <button
                onClick={handleAddTable}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-mocha-text hover:bg-mocha-surface0 rounded-lg transition-colors border border-mocha-surface0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Table</span>
              </button>
            </div>

            {/* View Controls */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-mocha-subtext1 uppercase tracking-wider">View</h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => zoomIn()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-mocha-text hover:bg-mocha-surface0 rounded-lg transition-colors border border-mocha-surface0"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>Zoom In</span>
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-mocha-text hover:bg-mocha-surface0 rounded-lg transition-colors border border-mocha-surface0"
                >
                  <ZoomOut className="w-4 h-4" />
                  <span>Zoom Out</span>
                </button>
                <button
                  onClick={handleFitView}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-mocha-text hover:bg-mocha-surface0 rounded-lg transition-colors border border-mocha-surface0"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Fit View</span>
                </button>
                <button
                  onClick={handleFitView}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-mocha-text hover:bg-mocha-surface0 rounded-lg transition-colors border border-mocha-surface0"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Auto Layout</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-mocha-subtext1 uppercase tracking-wider">Actions</h3>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-mocha-mauve hover:bg-mocha-surface0 rounded-lg transition-colors border border-mocha-surface0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Project"}</span>
              </button>
            <button
              onClick={() => handleExport("standard")}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-mocha-text hover:bg-mocha-surface0 rounded-lg transition-colors border border-mocha-surface0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Code className="w-4 h-4" />
              <span>{isExporting && sqlSource === "standard" ? "Generating..." : "Generate SQL"}</span>
            </button>
            <button
              onClick={() => handleExport("ai")}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-mocha-text hover:bg-mocha-surface0 rounded-lg transition-colors border border-mocha-surface0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isExporting && sqlSource === "ai" ? "Generating..." : "Generate SQL (AI)"}</span>
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button (when sidebar is closed) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-mocha-mantle border border-mocha-surface0 rounded-r-lg hover:bg-mocha-surface0 transition-colors text-mocha-subtext0 hover:text-mocha-text shadow-lg"
          title="Open Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        {/* Header - Simple Back Button */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-sm text-mocha-subtext0 hover:text-mocha-text hover:bg-mocha-surface0 rounded-lg transition-colors border border-mocha-surface0 bg-mocha-mantle/80 backdrop-blur-sm"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes: NodeChange[]) => {
            // Apply changes using React Flow's utility
            const updatedNodes = applyNodeChanges(changes, nodes);
            setNodes(updatedNodes);
          }}
          onEdgesChange={(changes: EdgeChange[]) => {
            // Apply changes using React Flow's utility
            const updatedEdges = applyEdgeChanges(changes, edges);
            setEdges(updatedEdges);
          }}
          onConnect={(connection: Connection) => {
            // Only allow connections between column handles, not node-level connections
            if (!connection.source || !connection.target) return;
            if (!connection.sourceHandle || !connection.targetHandle) {
              console.warn("Connections must be made between specific columns");
              return;
            }
            
            const newEdge = {
              id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}-${Date.now()}`,
              source: connection.source,
              target: connection.target,
              sourceHandle: connection.sourceHandle,
              targetHandle: connection.targetHandle,
              type: "smoothstep" as const,
              animated: true,
              style: { stroke: "#cba6f7", strokeWidth: 2 },
            };
            setEdges([...edges, newEdge]);
          }}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-mocha-base"
        >
          <Background
            color="#313244"
            gap={20}
            size={1}
            style={{ opacity: 0.2 }}
          />
          <Controls className="bg-mocha-mantle border border-mocha-surface0" />
          <MiniMap
            className="bg-mocha-mantle border border-mocha-surface0"
            nodeColor="#cba6f7"
            maskColor="#1e1e2e"
          />
        </ReactFlow>
      </div>

      {/* SQL Preview Modal */}
      {sqlPreview !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center px-4">
          <div className="w-full max-w-3xl bg-mocha-mantle border border-mocha-surface0 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-mocha-surface0">
              <div>
                <p className="text-sm uppercase tracking-wider text-mocha-subtext0">SQL Preview</p>
                <p className="text-mocha-text font-semibold">
                  {sqlSource === "ai" ? "AI Generated SQL" : "Schema SQL"}
                </p>
              </div>
              <button
                onClick={() => setSqlPreview(null)}
                className="px-3 py-1.5 text-sm rounded-lg border border-mocha-surface0 text-mocha-subtext0 hover:bg-mocha-surface0 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-auto font-mono text-sm text-mocha-subtext1 whitespace-pre-wrap bg-mocha-base/60">
              {sqlPreview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CanvasPage() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}

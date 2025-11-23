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
import { getProject, updateProject } from "../../../../lib/projects";
import { Project } from "../../../../types";
import { Plus, Wand2, ZoomIn, ZoomOut, Maximize2, Code } from "lucide-react";
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
        
        // Load canvas data from project
        if (data.data) {
          try {
            const canvasData = typeof data.data === "string" 
              ? JSON.parse(data.data) 
              : data.data;
            loadFromData(canvasData);
          } catch (error) {
            console.error("Failed to parse canvas data", error);
          }
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
  }, [projectId, router, loadFromData]);

  const handleSave = useCallback(async () => {
    if (!project) return;
    
    try {
      setIsSaving(true);
      const canvasData = exportToData();
      await updateProject(projectId, {
        data: JSON.stringify(canvasData),
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
    <div className="h-screen w-screen bg-mocha-base relative">
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
          if (!connection.source || !connection.target) return;
          const newEdge = {
            id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
            type: "smoothstep" as const,
            animated: true,
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

      {/* Floating Toolbar */}
      <Panel position="bottom-center" className="z-10">
        <div className="flex items-center gap-2 bg-mocha-mantle/80 backdrop-blur-md rounded-full px-4 py-2 border border-mocha-surface0 shadow-lg">
          <button
            onClick={handleAddTable}
            className="p-2 hover:bg-mocha-surface0 rounded-full transition-colors text-mocha-subtext0 hover:text-mocha-text"
            title="Add Table"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-mocha-surface0"></div>
          <button
            onClick={handleFitView}
            className="p-2 hover:bg-mocha-surface0 rounded-full transition-colors text-mocha-subtext0 hover:text-mocha-text"
            title="Auto Layout"
          >
            <Wand2 className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-mocha-surface0"></div>
          <button
            onClick={() => zoomIn()}
            className="p-2 hover:bg-mocha-surface0 rounded-full transition-colors text-mocha-subtext0 hover:text-mocha-text"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomOut()}
            className="p-2 hover:bg-mocha-surface0 rounded-full transition-colors text-mocha-subtext0 hover:text-mocha-text"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitView}
            className="p-2 hover:bg-mocha-surface0 rounded-full transition-colors text-mocha-subtext0 hover:text-mocha-text"
            title="Fit View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-mocha-surface0"></div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-2 hover:bg-mocha-surface0 rounded-full transition-colors text-mocha-mauve hover:text-mocha-lavender disabled:opacity-50"
            title="Save Project"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>
      </Panel>
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

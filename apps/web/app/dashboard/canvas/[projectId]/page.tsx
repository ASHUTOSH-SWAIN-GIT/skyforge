"use client";

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  getProject,
  updateProject,
  exportProjectSQL,
  exportProjectPrisma,
  importSQL,
  getProjectShareLink,
  createProjectShareLink,
  joinShareLink,
  aiGenerateTables,
  getProjectCollaborators,
  ProjectCollaborator,
} from "../../../../lib/projects";
import { Project, ShareLinkInfo } from "../../../../types";
import {
  Plus,
  Wand2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Code,
  ChevronLeft,
  ChevronRight,
  Save,
  Upload,
  Share2,
  Copy,
  Check,
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  Crown,
  Menu,
  Database,
} from "lucide-react";
import { useCanvasStore } from "../store";
import TableNode from "../TableNode";
import { useCanvasCollaboration, CollaborationStatus } from "../useCanvasCollaboration";
import { useUser } from "../../../../hooks/useUser";

const nodeTypes = {
  tableNode: TableNode,
};

function CanvasInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [codePreview, setCodePreview] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<"sql" | "prisma">("sql");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [codeCopySuccess, setCodeCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shareTokenParam = searchParams.get("shareToken");
  const [canLoadProject, setCanLoadProject] = useState(() => !shareTokenParam);
  const [shareInfo, setShareInfo] = useState<ShareLinkInfo | null>(null);
  const [collabRoomKey, setCollabRoomKey] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareActionLoading, setShareActionLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectCollaborator[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addTable,
    loadFromData,
    exportToData,
    deleteEdge,
  } = useCanvasStore();

  const { user } = useUser();
  
  // Extract avatar URL from NullString structure
  const userAvatarUrl = useMemo(() => {
    if (!user?.avatar_url) return null;
    const avatarUrlRaw = user.avatar_url;
    if (typeof avatarUrlRaw === "string") {
      return avatarUrlRaw;
    }
    if (typeof avatarUrlRaw === "object" && avatarUrlRaw !== null && "String" in avatarUrlRaw && "Valid" in avatarUrlRaw) {
      const nullString = avatarUrlRaw as { String: string; Valid: boolean };
      if (nullString.Valid && nullString.String) {
        return nullString.String;
      }
    }
    return null;
  }, [user?.avatar_url]);
  
  const { status: collaborationStatus, peers } = useCanvasCollaboration({
    roomKey: collabRoomKey,
    enabled: Boolean(collabRoomKey),
    user: user ? { id: user.id, name: user.name, avatarUrl: userAvatarUrl } : undefined,
  });
  const isOwner = user && project ? project.user_id === user.id : false;
  const shareUrl = useMemo(() => {
    if (!shareInfo) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/dashboard/canvas/${shareInfo.projectId}?shareToken=${shareInfo.token}`;
  }, [shareInfo]);
  const statusColorMap: Record<CollaborationStatus, string> = {
    connected: "bg-mocha-green",
    connecting: "bg-mocha-yellow",
    idle: "bg-mocha-surface1",
  };
  const displayedPeers = peers.slice(0, 3);
  const extraPeers = peers.length - displayedPeers.length;

  const { fitView, zoomIn, zoomOut, screenToFlowPosition } = useReactFlow();

  // Deduplicate nodes and edges to prevent React key warnings
  const uniqueNodes = useMemo(() => {
    const seen = new Set<string>();
    return nodes.filter((node) => {
      if (seen.has(node.id)) return false;
      seen.add(node.id);
      return true;
    });
  }, [nodes]);

  const uniqueEdges = useMemo(() => {
    const seen = new Set<string>();
    return edges.filter((edge) => {
      if (seen.has(edge.id)) return false;
      seen.add(edge.id);
      return true;
    });
  }, [edges]);

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

    if (!projectId || !canLoadProject) {
      return;
    }

    fetchProject();
  }, [projectId, router, loadFromData, setNodes, setEdges, canLoadProject]);

  useEffect(() => {
    if (!shareTokenParam) {
      setJoinError(null);
      setCanLoadProject(true);
      return;
    }

    let cancelled = false;
    setJoinError(null);

    const join = async () => {
      try {
        const response = await joinShareLink(shareTokenParam);
        if (cancelled) {
          return;
        }

        setShareInfo({
          projectId: response.projectId,
          token: response.token,
          roomKey: response.roomKey,
          createdAt: new Date().toISOString(),
          createdBy: response.ownerId,
          expiresAt: response.expiresAt ?? null,
        });
        setCollabRoomKey(response.roomKey);
        setCanLoadProject(true);

        const destinationProjectId = response.projectId || projectId;
        router.replace(`/dashboard/canvas/${destinationProjectId}`);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to join share link", err);
          setJoinError("Share link is invalid or has expired.");
          router.push("/dashboard");
        }
      }
    };

    join();

    return () => {
      cancelled = true;
    };
  }, [shareTokenParam, router, projectId]);

  useEffect(() => {
    if (!projectId || !canLoadProject) {
      return;
    }

    let cancelled = false;

    const fetchShareLinkInfo = async () => {
      try {
        const response = await getProjectShareLink(projectId);
        if (cancelled) {
          return;
        }
        setShareInfo(response);
        setCollabRoomKey(response.roomKey);
      } catch (err) {
        if (cancelled) {
          return;
        }
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          setShareInfo(null);
          if (!shareTokenParam) {
            setCollabRoomKey(null);
          }
        } else {
          console.error("Failed to get share link", err);
        }
      }
    };

    fetchShareLinkInfo();

    return () => {
      cancelled = true;
    };
  }, [projectId, canLoadProject, shareTokenParam]);

  // Fetch project members/collaborators
  useEffect(() => {
    if (!projectId || !canLoadProject) return;

    let cancelled = false;

    const fetchMembers = async () => {
      try {
        setIsMembersLoading(true);
        const members = await getProjectCollaborators(projectId);
        if (!cancelled) {
          // Deduplicate members by ID
          const uniqueMembers = members.filter(
            (member, index, self) => 
              index === self.findIndex((m) => m.id === member.id)
          );
          setProjectMembers(uniqueMembers);
        }
      } catch (error) {
        console.error("Failed to fetch project members", error);
        if (!cancelled) {
          setProjectMembers([]);
        }
      } finally {
        if (!cancelled) {
          setIsMembersLoading(false);
        }
      }
    };

    fetchMembers();

    return () => {
      cancelled = true;
    };
  }, [projectId, canLoadProject]);

  const handleSave = useCallback(async () => {
    if (!project) return;
    
    try {
      setIsSaving(true);
      const canvasData = exportToData();
      await updateProject(projectId, {
        data: canvasData,
      });
      showToast("Project saved successfully", "success");
    } catch (error) {
      console.error("Failed to save project", error);
      showToast("Failed to save project. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  }, [project, projectId, exportToData, showToast]);

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

  const handleImportSQL = useCallback(async (file: File) => {
    if (!project) return;
    
    try {
      setIsImporting(true);
      const updatedProject = await importSQL(projectId, file);
      setProject(updatedProject);
      
      // Load the imported data into canvas
      if (updatedProject.data) {
        try {
          const canvasData = typeof updatedProject.data === "string" 
            ? JSON.parse(updatedProject.data) 
            : updatedProject.data;
          if (canvasData && (canvasData.nodes || canvasData.edges)) {
            loadFromData(canvasData);
            // Fit view after import
            setTimeout(() => fitView({ padding: 0.2 }), 100);
          }
        } catch (error) {
          console.error("Failed to parse imported canvas data", error);
        }
      }
      showToast("SQL imported successfully", "success");
    } catch (error) {
      console.error("Failed to import SQL", error);
      showToast(error instanceof Error ? error.message : "Failed to import SQL file", "error");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [project, projectId, loadFromData, fitView, showToast]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.sql')) {
      handleImportSQL(file);
    } else {
      showToast("Please select a valid SQL file (.sql)", "error");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [handleImportSQL, showToast]);

  const handleExport = useCallback(async (format: "sql" | "prisma") => {
    if (!project) return;
    try {
      setIsExporting(true);
      setExportFormat(format);
      setCodePreview(null);
      setIsExportModalOpen(false);
      
      const code = format === "sql" 
        ? await exportProjectSQL(project.id.toString())
        : await exportProjectPrisma(project.id.toString());
      
      setCodePreview(code);
    } catch (error) {
      console.error(`Failed to export ${format}`, error);
      showToast(`Failed to generate ${format === "sql" ? "SQL" : "Prisma schema"}. Please try again.`, "error");
      setCodePreview(null);
    } finally {
      setIsExporting(false);
    }
  }, [project, showToast]);

  const handleCopyCode = useCallback(async () => {
    if (!codePreview) return;
    try {
      await navigator.clipboard.writeText(codePreview);
      setCodeCopySuccess(true);
      setTimeout(() => setCodeCopySuccess(false), 2000);
    } catch (error) {
      showToast("Failed to copy to clipboard", "error");
    }
  }, [codePreview, showToast]);

  const handleAIGenerate = useCallback(async () => {
    if (!project || !aiPrompt.trim()) return;
    
    try {
      setIsAIGenerating(true);
      setAiError(null);
      
      const generatedData = await aiGenerateTables(project.id.toString(), aiPrompt);
      
      // Merge generated tables with existing canvas
      const currentNodes = nodes;
      const currentEdges = edges;
      
      // Offset new nodes based on existing canvas content
      const maxX = currentNodes.length > 0 
        ? Math.max(...currentNodes.map(n => n.position?.x || 0)) + 400
        : 0;
      
      const offsetNodes = generatedData.nodes.map((node, index) => ({
        ...node,
        position: {
          x: (node.position?.x || 0) + maxX,
          y: node.position?.y || index * 200,
        },
      }));
      
      // Add generated nodes and edges to canvas
      setNodes([...currentNodes, ...offsetNodes]);
      setEdges([...currentEdges, ...generatedData.edges]);
      
      // Close modal and reset
      setIsAIChatOpen(false);
      setAiPrompt("");
      
      // Show success toast
      showToast(`Generated ${generatedData.nodes.length} tables successfully`, "success");
      
      // Fit view after adding new nodes
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    } catch (error) {
      console.error("Failed to generate tables with AI", error);
      setAiError(error instanceof Error ? error.message : "Failed to generate tables");
    } finally {
      setIsAIGenerating(false);
    }
  }, [project, aiPrompt, nodes, edges, setNodes, setEdges, fitView, showToast]);

  const handleGenerateShareLink = useCallback(async () => {
    if (!project || !isOwner) return;
    setShareError(null);
    setShareActionLoading(true);
    try {
      const response = await createProjectShareLink(project.id);
      setShareInfo(response);
      setCollabRoomKey(response.roomKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create share link.";
      setShareError(message);
    } finally {
      setShareActionLoading(false);
    }
  }, [isOwner, project]);

  const handleCopyShareLink = useCallback(async () => {
    if (!shareInfo || !shareUrl) return;
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        throw new Error("Clipboard not available");
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
    } catch (error) {
      console.error("Failed to copy share link", error);
      setShareError("Unable to copy link automatically. Please copy it manually.");
    }
  }, [shareInfo, shareUrl]);

  const handleOpenShareModal = useCallback(() => {
    setShareError(null);
    setCopySuccess(false);
    setIsShareModalOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-mocha-base flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-mocha-subtext0">
            {shareTokenParam ? "Preparing shared canvas..." : "Loading project..."}
          </div>
          {joinError && <p className="text-sm text-mocha-red">{joinError}</p>}
        </div>
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
      <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-mocha-surface0 bg-mocha-mantle/80 backdrop-blur-sm">
          <span className={`h-2 w-2 rounded-full ${statusColorMap[collaborationStatus]}`} />
          <span className="text-xs font-semibold text-mocha-text capitalize">
            {collaborationStatus === "connected"
              ? "Live"
              : collaborationStatus === "connecting"
              ? "Connecting"
              : "Offline"}
          </span>
          {peers.length > 0 && (
            <span className="text-[10px] text-mocha-overlay0">{peers.length} online</span>
          )}
        </div>
        {displayedPeers.length > 0 && (
          <div className="flex -space-x-2">
            {displayedPeers.map((peer) => {
              const hasAvatar = peer.avatarUrl && peer.avatarUrl.trim() !== "";
              return (
                <div
                  key={peer.id}
                  className="h-8 w-8 rounded-full border border-mocha-crust/40 overflow-hidden flex-shrink-0"
                  title={peer.name}
                >
                  {hasAvatar ? (
                    <img
                      src={peer.avatarUrl!}
                      alt={peer.name || "Collaborator"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to colored circle if image fails to load
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.style.backgroundColor = peer.color;
                          parent.className += " flex items-center justify-center text-[11px] font-semibold text-mocha-crust";
                          parent.textContent = peer.name?.charAt(0).toUpperCase() || "?";
                        }
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-[11px] font-semibold text-mocha-crust"
                      style={{ backgroundColor: peer.color }}
                    >
                      {peer.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                </div>
              );
            })}
            {extraPeers > 0 && (
              <div className="h-8 w-8 rounded-full bg-mocha-surface0/80 border border-mocha-surface1 text-[11px] text-mocha-text flex items-center justify-center">
                +{extraPeers}
              </div>
            )}
          </div>
        )}
        {isOwner && (
          <button
            onClick={handleOpenShareModal}
            disabled={!project}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-mocha-text rounded-full border border-mocha-surface0 bg-mocha-mantle/70 hover:bg-mocha-surface0 transition-colors disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}
      </div>

      {/* Collapsible Sidebar */}
      <div
        className={`h-full bg-mocha-mantle/50 backdrop-blur-sm border-r border-mocha-surface0 transition-all duration-300 ease-in-out flex-shrink-0 ${
          isSidebarOpen ? "w-72" : "w-0"
        } overflow-hidden shadow-2xl z-30`}
      >
        <div className={`h-full flex flex-col ${isSidebarOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-mocha-surface0 flex items-center justify-between bg-mocha-mantle/30">
            <h2 className="text-mocha-text font-bold text-lg tracking-tight">Canvas Tools</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-mocha-surface0 rounded-lg transition-colors text-mocha-subtext0 hover:text-mocha-text"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Table Actions */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-mocha-overlay0 uppercase tracking-widest pl-1">Structure</h3>
              <button
                onClick={handleAddTable}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-mocha-text bg-mocha-surface0/30 hover:bg-mocha-surface0/80 hover:scale-[1.02] rounded-xl transition-all duration-200 border border-mocha-surface0 shadow-sm group"
              >
                <div className="p-1.5 rounded-lg bg-mocha-blue/10 text-mocha-blue group-hover:bg-mocha-blue/20 transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <span>New Table</span>
              </button>
              
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isImporting}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-mocha-text bg-mocha-surface0/30 hover:bg-mocha-surface0/80 hover:scale-[1.02] rounded-xl transition-all duration-200 border border-mocha-surface0 shadow-sm group disabled:opacity-50"
                >
                  <div className="p-1.5 rounded-lg bg-mocha-green/10 text-mocha-green group-hover:bg-mocha-green/20 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span>{isImporting ? "Importing..." : "Import SQL"}</span>
                </button>
              </div>
            </div>

            {/* View Controls */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-mocha-overlay0 uppercase tracking-widest pl-1">View</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => zoomIn()}
                  className="flex flex-col items-center justify-center gap-2 p-3 text-xs font-medium text-mocha-subtext0 hover:text-mocha-text bg-mocha-surface0/20 hover:bg-mocha-surface0/50 rounded-xl transition-all border border-transparent hover:border-mocha-surface0"
                >
                  <ZoomIn className="w-5 h-5" />
                  <span>Zoom In</span>
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="flex flex-col items-center justify-center gap-2 p-3 text-xs font-medium text-mocha-subtext0 hover:text-mocha-text bg-mocha-surface0/20 hover:bg-mocha-surface0/50 rounded-xl transition-all border border-transparent hover:border-mocha-surface0"
                >
                  <ZoomOut className="w-5 h-5" />
                  <span>Zoom Out</span>
                </button>
                <button
                  onClick={handleFitView}
                  className="flex flex-col items-center justify-center gap-2 p-3 text-xs font-medium text-mocha-subtext0 hover:text-mocha-text bg-mocha-surface0/20 hover:bg-mocha-surface0/50 rounded-xl transition-all border border-transparent hover:border-mocha-surface0"
                >
                  <Maximize2 className="w-5 h-5" />
                  <span>Fit View</span>
                </button>
                <button
                  onClick={handleFitView}
                  className="flex flex-col items-center justify-center gap-2 p-3 text-xs font-medium text-mocha-subtext0 hover:text-mocha-text bg-mocha-surface0/20 hover:bg-mocha-surface0/50 rounded-xl transition-all border border-transparent hover:border-mocha-surface0"
                >
                  <Wand2 className="w-5 h-5" />
                  <span>Auto</span>
                </button>
              </div>
            </div>

            {/* AI Generate */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-mocha-overlay0 uppercase tracking-widest pl-1">AI Assistant</h3>
              <button
                onClick={() => setIsAIChatOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-mocha-text bg-mocha-surface0/30 hover:bg-mocha-surface0/80 rounded-xl transition-all border border-mocha-surface0"
              >
                <Sparkles className="w-4 h-4 text-mocha-mauve" />
                <span>Generate with AI</span>
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-mocha-overlay0 uppercase tracking-widest pl-1">Export</h3>
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-mocha-mauve bg-mocha-mauve/10 hover:bg-mocha-mauve/20 rounded-xl transition-all border border-mocha-mauve/20 hover:border-mocha-mauve/40 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save Project"}</span>
                </button>
                
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={isExporting}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-mocha-subtext0 hover:text-mocha-text bg-mocha-surface0/20 hover:bg-mocha-surface0/50 rounded-xl transition-all border border-transparent hover:border-mocha-surface0"
                >
                  <div className="flex items-center gap-3">
                    <Code className="w-4 h-4" />
                    <span>{isExporting ? "Exporting..." : "Export Code"}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Members Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-mocha-overlay0 uppercase tracking-widest pl-1 flex items-center gap-2">
                Members
              </h3>
              <div className="space-y-2">
                {isMembersLoading ? (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-mocha-surface0 animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-20 bg-mocha-surface0 rounded animate-pulse" />
                      <div className="h-2 w-16 bg-mocha-surface0 rounded animate-pulse" />
                    </div>
                  </div>
                ) : projectMembers.length === 0 ? (
                  <p className="text-xs text-mocha-overlay0 px-3 py-2">No members yet</p>
                ) : (
                  projectMembers.map((member) => {
                    const hasAvatar = member.avatar_url && member.avatar_url.trim() !== "";
                    const memberIsOwner = project && member.id === project.user_id;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-mocha-surface0/30 transition-colors"
                      >
                        <div className="relative">
                          {hasAvatar ? (
                            <img
                              src={member.avatar_url!}
                              alt={member.name}
                              className="w-8 h-8 rounded-full object-cover border border-mocha-surface0"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-mocha-surface0 flex items-center justify-center text-xs font-medium text-mocha-text border border-mocha-surface1">
                              {member.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                          )}
                          {memberIsOwner && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-mocha-yellow flex items-center justify-center">
                              <Crown className="w-2.5 h-2.5 text-mocha-crust" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium text-mocha-text truncate flex-1 min-w-0">
                          {member.name}
                          {member.id === user?.id && (
                            <span className="text-mocha-overlay0 font-normal"> (you)</span>
                          )}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        {/* Header - Back Button and Hamburger Menu */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 bg-mocha-mantle/90 backdrop-blur-sm border border-mocha-surface0 rounded-lg hover:bg-mocha-surface0 transition-colors text-mocha-subtext0 hover:text-mocha-text shadow-lg"
              title="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-sm text-mocha-subtext0 hover:text-mocha-text hover:bg-mocha-surface0 rounded-lg transition-colors border border-mocha-surface0 bg-mocha-mantle/80 backdrop-blur-sm"
          >
            ← Back to Dashboard
          </button>
        </div>

          {/* React Flow Canvas */}
          <ReactFlow
            nodes={uniqueNodes}
            edges={uniqueEdges}
            onNodesChange={(changes: NodeChange[]) => {
              // Apply changes using React Flow's utility
              const updatedNodes = applyNodeChanges(changes, uniqueNodes);
              setNodes(updatedNodes);
            }}
            onEdgesChange={(changes: EdgeChange[]) => {
              // Apply changes using React Flow's utility
              const updatedEdges = applyEdgeChanges(changes, uniqueEdges);
              setEdges(updatedEdges);
            }}
            onEdgesDelete={(deletedEdges) => {
              // Delete edges when user removes them
              deletedEdges.forEach((edge) => {
                deleteEdge(edge.id);
              });
            }}
            onConnect={(connection: Connection) => {
              // Only allow connections between column handles, not node-level connections
              if (!connection.source || !connection.target) {
                console.warn("Missing source or target", connection);
                return;
              }
              if (!connection.sourceHandle || !connection.targetHandle) {
                console.warn("Connections must be made between specific columns", connection);
                return;
              }
              
              const edgeId = `edge-${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}-${Date.now()}`;
              const newEdge = {
                id: edgeId,
                source: connection.source,
                target: connection.target,
                sourceHandle: connection.sourceHandle,
                targetHandle: connection.targetHandle,
                type: "smoothstep" as const,
                animated: true,
                deletable: true,
                style: { 
                  stroke: "#b4befe", 
                  strokeWidth: 2, 
                  strokeDasharray: "5 5",
                },
              };
              
              console.log("Creating edge:", newEdge);
              const updated = [...edges, newEdge];
              console.log("Updated edges:", updated);
              setEdges(updated);
            }}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: true,
              deletable: true,
              style: {
                stroke: "#b4befe",
                strokeWidth: 2,
                strokeDasharray: "5 5",
              },
            }}
            fitView
            className="bg-mocha-base"
          >
          <Background
            color="#313244"
            gap={24}
            size={2}
            style={{ opacity: 0.1 }}
          />
          <Controls 
            className="!bg-mocha-mantle/80 !border-mocha-surface0 !rounded-xl !shadow-lg backdrop-blur-sm m-4 !p-1" 
            showInteractive={false}
          />
          <MiniMap
            className="!bg-mocha-mantle/80 !border-mocha-surface0 !rounded-xl !shadow-lg backdrop-blur-sm m-4"
            nodeColor="#cba6f7"
            maskColor="#1e1e2e"
            style={{ opacity: 0.7 }}
          />
        </ReactFlow>
      </div>

      {/* Export Options Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-mocha-mantle border border-mocha-surface0 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-mocha-surface0">
              <div>
                <p className="text-mocha-text font-semibold">Export Schema</p>
                <p className="text-xs text-mocha-overlay0">Choose your preferred format</p>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-mocha-surface0 transition-colors text-mocha-subtext0 hover:text-mocha-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {/* SQL Option */}
              <button
                onClick={() => handleExport("sql")}
                disabled={isExporting}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-mocha-surface0 bg-mocha-base/50 hover:bg-mocha-surface0/50 hover:border-[#336791]/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#336791] to-[#205080] flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                    <ellipse cx="12" cy="6" rx="8" ry="3" stroke="white" strokeWidth="1.5" fill="none"/>
                    <path d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6" stroke="white" strokeWidth="1.5"/>
                    <path d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6" stroke="white" strokeWidth="1.5"/>
                    <ellipse cx="12" cy="12" rx="8" ry="3" stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="2 2" opacity="0.5"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-mocha-text group-hover:text-[#336791] transition-colors">PostgreSQL</p>
                  <p className="text-xs text-mocha-overlay0">Raw SQL schema with CREATE TABLE statements</p>
                </div>
                <ChevronRight className="w-5 h-5 text-mocha-overlay0 group-hover:text-[#336791] transition-colors" />
              </button>

              {/* Prisma Option */}
              <button
                onClick={() => handleExport("prisma")}
                disabled={isExporting}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-mocha-surface0 bg-mocha-base/50 hover:bg-mocha-surface0/50 hover:border-[#2D3748]/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2D3748] to-[#1A202C] flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                    <path d="M21.807 18.285L13.553.756a1.324 1.324 0 00-1.129-.754 1.31 1.31 0 00-1.206.626L.258 17.617a1.33 1.33 0 00.076 1.484l5.55 6.446a1.33 1.33 0 001.011.449h12.762a1.33 1.33 0 001.213-.788l1.015-2.422a1.33 1.33 0 00-.078-1.501z" fill="#5A67D8"/>
                    <path d="M21.807 18.285L13.553.756a1.324 1.324 0 00-1.129-.754L5.885 19.562l5.55 6.446a1.33 1.33 0 001.011.449h7.211a1.33 1.33 0 001.213-.788l1.015-2.422a1.33 1.33 0 00-.078-1.501z" fill="#4C51BF"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-mocha-text group-hover:text-[#5A67D8] transition-colors">Prisma</p>
                  <p className="text-xs text-mocha-overlay0">schema.prisma with models and relations</p>
                </div>
                <ChevronRight className="w-5 h-5 text-mocha-overlay0 group-hover:text-[#5A67D8] transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Preview Modal */}
      {codePreview !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center px-4">
          <div className="w-full max-w-3xl bg-mocha-mantle border border-mocha-surface0 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-mocha-surface0">
              <div>
                <p className="text-sm uppercase tracking-wider text-mocha-subtext0">
                  {exportFormat === "sql" ? "SQL Export" : "Prisma Export"}
                </p>
                <p className="text-mocha-text font-semibold">
                  {exportFormat === "sql" ? "PostgreSQL Schema" : "schema.prisma"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-mocha-surface0 text-mocha-subtext0 hover:bg-mocha-surface0 transition-colors"
                >
                  {codeCopySuccess ? (
                    <>
                      <Check className="w-4 h-4 text-mocha-green" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={() => setCodePreview(null)}
                  className="p-1.5 rounded-lg border border-mocha-surface0 text-mocha-subtext0 hover:bg-mocha-surface0 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 max-h-[70vh] overflow-auto font-mono text-sm text-mocha-subtext1 whitespace-pre-wrap bg-mocha-base/60">
              {codePreview}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center px-4">
          <div className="w-full max-w-lg bg-mocha-mantle border border-mocha-surface0 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-mocha-surface0">
              <div>
                <p className="text-xs uppercase tracking-wide text-mocha-overlay0">Live collaboration</p>
                <p className="text-mocha-text font-semibold">Share this canvas</p>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-mocha-surface0 text-mocha-subtext0 hover:bg-mocha-surface0 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-5">
              {shareInfo ? (
                <>
                  <p className="text-sm text-mocha-subtext0">
                    Anyone with this link can open the canvas in real-time with you.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      value={shareUrl}
                      readOnly
                      className="flex-1 rounded-xl bg-mocha-base/60 border border-mocha-surface0 px-4 py-3 text-sm text-mocha-text font-mono"
                    />
                    <button
                      onClick={handleCopyShareLink}
                      className="px-4 py-3 rounded-xl border border-mocha-surface0 bg-mocha-surface0/50 hover:bg-mocha-surface0 transition-colors"
                    >
                      {copySuccess ? <Check className="w-4 h-4 text-mocha-green" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-mocha-overlay0">
                    <span className="font-semibold text-mocha-text">
                      Room ID: <span className="font-mono">{shareInfo.roomKey.slice(-8)}</span>
                    </span>
                    {shareInfo.expiresAt && (
                      <span>
                        Expires {new Date(shareInfo.expiresAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    )}
                  </div>
                  {isOwner && (
                    <button
                      onClick={handleGenerateShareLink}
                      disabled={shareActionLoading}
                      className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-mocha-crust bg-mocha-mauve hover:bg-mocha-mauve/90 transition-colors disabled:opacity-50"
                    >
                      {shareActionLoading ? "Refreshing link..." : "Regenerate link"}
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-mocha-subtext0">
                    Live collaboration isn&apos;t enabled yet for this project.
                  </p>
                  {isOwner ? (
                    <button
                      onClick={handleGenerateShareLink}
                      disabled={shareActionLoading}
                      className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-mocha-crust bg-mocha-mauve hover:bg-mocha-mauve/90 transition-colors disabled:opacity-50"
                    >
                      {shareActionLoading ? "Enabling..." : "Enable live collaboration"}
                    </button>
                  ) : (
                    <p className="text-xs text-mocha-overlay0">
                      Only the project owner can enable live collaboration. Ask them to generate a share link.
                    </p>
                  )}
                </div>
              )}
              {shareError && <p className="text-xs text-mocha-red">{shareError}</p>}
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Modal */}
      {isAIChatOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center px-4">
          <div className="w-full max-w-lg bg-mocha-mantle border border-mocha-surface0 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-mocha-surface0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-mocha-mauve" />
                <p className="text-mocha-text font-semibold">Generate Tables with AI</p>
              </div>
              <button
                onClick={() => {
                  setIsAIChatOpen(false);
                  setAiPrompt("");
                  setAiError(null);
                }}
                className="p-1.5 rounded hover:bg-mocha-surface0 transition-colors text-mocha-subtext0 hover:text-mocha-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the tables you want to create... e.g., 'Create tables for a blog with users, posts, and comments'"
                className="w-full h-32 px-3 py-2 rounded-lg bg-mocha-base border border-mocha-surface0 text-mocha-text placeholder:text-mocha-overlay0 focus:outline-none focus:border-mocha-mauve resize-none text-sm"
                disabled={isAIGenerating}
              />

              {aiError && (
                <div className="px-3 py-2 rounded-lg bg-mocha-red/10 border border-mocha-red/20 text-sm text-mocha-red">
                  {aiError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsAIChatOpen(false);
                    setAiPrompt("");
                    setAiError(null);
                  }}
                  disabled={isAIGenerating}
                  className="px-4 py-2 rounded-lg text-sm text-mocha-subtext0 hover:text-mocha-text hover:bg-mocha-surface0 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAIGenerate}
                  disabled={isAIGenerating || !aiPrompt.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-mocha-crust bg-mocha-mauve hover:bg-mocha-mauve/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAIGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all animate-in slide-in-from-bottom-4 ${
          toast.type === "success" 
            ? "bg-mocha-green/10 border-mocha-green/30 text-mocha-green" 
            : "bg-mocha-red/10 border-mocha-red/30 text-mocha-red"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-mocha-surface0/50 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
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

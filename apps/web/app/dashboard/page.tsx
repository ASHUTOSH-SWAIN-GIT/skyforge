"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { deleteProject as deleteProjectApi, getMyProjects } from "../../lib/projects";
import { Project } from "../../types";
import CreateProjectModal from "../components/CreateProjectModal";
import { Plus, Database, MoreVertical, ArrowRight, Trash2, Loader2, AlertCircle, X } from "lucide-react";
import { ProjectMembers } from "./components/ProjectMembers";

const projectsFetcher = async () => {
  const projects = await getMyProjects();
  // Ensure we always return an array, even if backend returns null
  return projects || [];
};

export default function WorkspacePage() {
  const router = useRouter();
  const { data: projects, error: fetchError, isLoading, mutate } = useSWR<Project[]>(
    "projects",
    projectsFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      fallbackData: [],
    }
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuProjectId, setMenuProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteProject = useCallback(async () => {
    if (!deleteConfirm) return;
    
    const { id: projectId } = deleteConfirm;
    setErrorMessage(null);
    setDeleteError(null);
    setDeletingProjectId(projectId);
    setDeleteConfirm(null);
    
    try {
      // Optimistic update - remove from list immediately
      mutate(
        (current) => current?.filter((p) => p.id !== projectId),
        false
      );
      await deleteProjectApi(projectId);
      setMenuProjectId(null);
      // Revalidate to ensure consistency
      mutate();
    } catch (error: any) {
      // Check if it's a 403 Forbidden error (collaborator trying to delete)
      if (error?.status === 403) {
        setDeleteError("Only project owners can delete projects.");
        // Don't log expected permission errors to console
      } else {
        setErrorMessage(error instanceof Error ? error.message : "Failed to delete project. Please try again.");
      }
      // Revert optimistic update on error
      mutate();
    } finally {
      setDeletingProjectId(null);
    }
  }, [deleteConfirm, mutate]);


  return (
    <div className="space-y-8 text-mocha-text">
      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => mutate()}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-mocha-surface0 bg-mocha-base p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-mocha-red/10">
                <Trash2 className="w-5 h-5 text-mocha-red" />
              </div>
              <h3 className="text-lg font-semibold text-mocha-text">Delete Project</h3>
            </div>
            <p className="text-sm text-mocha-subtext0 mb-6">
              Are you sure you want to delete <span className="font-medium text-mocha-text">{deleteConfirm.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm text-mocha-subtext0 hover:text-mocha-text hover:bg-mocha-surface0 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-4 py-2 rounded-lg text-sm font-medium text-mocha-crust bg-mocha-red hover:bg-mocha-red/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Error Dialog */}
      {deleteError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-mocha-red/30 bg-mocha-base p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-mocha-red/10">
                <AlertCircle className="w-5 h-5 text-mocha-red" />
              </div>
              <h3 className="text-lg font-semibold text-mocha-text">Permission Denied</h3>
            </div>
            <p className="text-sm text-mocha-subtext0 mb-6">
              {deleteError}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setDeleteError(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-mocha-crust bg-mocha-red hover:bg-mocha-red/90 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-mocha-mauve to-mocha-blue bg-clip-text text-transparent">Workspace</h1>
        <p className="text-mocha-subtext0 text-lg">Manage your database projects and schemas.</p>
        </div>
      </div>

      {/* Error Message - Don't show for 401 errors (handled by auth redirect) */}
      {(errorMessage || (fetchError && (fetchError as any)?.status !== 401)) && (
        <div className="flex items-center gap-3 rounded-xl border border-mocha-red/30 bg-mocha-red/10 text-mocha-red px-4 py-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{errorMessage || "Failed to load projects. Please try again."}</span>
          {fetchError && (
            <button
              onClick={() => mutate()}
              className="px-3 py-1 rounded-lg bg-mocha-red/20 hover:bg-mocha-red/30 transition-colors text-xs font-medium"
            >
              Retry
            </button>
          )}
          {errorMessage && (
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-mocha-red/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Create New Project Card */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative h-64 rounded-2xl border-2 border-dashed border-mocha-surface1 bg-mocha-surface0/30 hover:bg-mocha-surface0/50 hover:border-mocha-mauve/50 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-center p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-mocha-mauve/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
          <div className="h-16 w-16 rounded-full bg-mocha-surface0 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300 z-10">
            <Plus className="w-8 h-8 text-mocha-mauve" />
          </div>
          <div className="z-10">
            <h3 className="text-lg font-semibold text-mocha-text group-hover:text-mocha-mauve transition-colors">Create New Project</h3>
            <p className="text-sm text-mocha-subtext0 mt-1 max-w-[200px]">Start building your database schema from scratch</p>
          </div>
        </button>

        {/* Project Cards */}
        {isLoading && (!projects || projects.length === 0) ? (
           // Skeleton Loaders
           [...Array(3)].map((_, i) => (
             <div key={i} className="h-64 rounded-2xl bg-mocha-surface0/50 animate-pulse border border-mocha-surface0" />
           ))
        ) : !projects || projects.length === 0 ? (
            // Empty state message
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <Database className="w-12 h-12 text-mocha-overlay0 mb-4" />
              <p className="text-mocha-subtext0 text-lg mb-2">No projects yet</p>
              <p className="text-mocha-overlay0 text-sm">Create your first project to get started</p>
            </div>
        ) : (
          projects.map((project) => (
            <div 
              key={project.id} 
              onClick={() => router.push(`/dashboard/canvas/${project.id}`)}
              className="group relative h-64 flex flex-col justify-between p-6 rounded-2xl border border-mocha-surface0 bg-mocha-card hover:border-mocha-mauve/30 hover:shadow-lg hover:shadow-mocha-mauve/5 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Hover Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-mocha-surface1/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Header */}
              <div className="flex justify-between items-start relative z-10">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-mocha-mauve/20 to-mocha-blue/20 border border-mocha-surface1 flex items-center justify-center text-mocha-mauve group-hover:scale-105 transition-transform duration-300">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuProjectId((prev) => (prev === project.id ? null : project.id));
                    }}
                    className="p-2 hover:bg-mocha-surface1 rounded-lg transition-colors text-mocha-overlay0 hover:text-mocha-text opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="relative z-10 mt-4 flex-1">
                <h3 className="text-xl font-bold text-mocha-text mb-2 line-clamp-1 group-hover:text-mocha-mauve transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-mocha-subtext0 line-clamp-3 leading-relaxed">
                  {project.description?.Valid && project.description.String ? project.description.String : "No description provided."}
                </p>
              </div>

              {/* Footer */}
              <div className="relative z-10 mt-6 pt-4 border-t border-mocha-surface0 flex items-center justify-between text-xs text-mocha-subtext0">
                <div className="flex items-center gap-2">
                  <ProjectMembers projectId={project.id} maxDisplay={3} />
                </div>
                <div className="w-8 h-8 rounded-full bg-mocha-surface0 flex items-center justify-center text-mocha-text opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight className="w-4 h-4" />
          </div>
          </div>
        </div>
          ))
        )}
      </div>

      {/* Context Menu for Project Actions */}
      {menuProjectId && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setMenuProjectId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 rounded-xl border border-mocha-surface0 bg-mocha-base shadow-2xl p-2"
          >
            <p className="text-xs text-mocha-overlay0 px-3 py-2 border-b border-mocha-surface0 mb-2">
              Project Actions
            </p>
            <button
              onClick={() => {
                const project = projects?.find(p => p.id === menuProjectId);
                if (project) {
                  setMenuProjectId(null);
                  setDeleteConfirm({ id: project.id, name: project.name });
                }
              }}
              disabled={deletingProjectId === menuProjectId}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-mocha-red hover:bg-mocha-red/10 rounded-lg transition-colors disabled:opacity-60"
            >
              {deletingProjectId === menuProjectId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

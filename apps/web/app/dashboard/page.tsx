"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyProjects } from "../../lib/projects";
import { Project } from "../../types";
import CreateProjectModal from "../components/CreateProjectModal";
import { Plus, Database, Clock, MoreVertical, ArrowRight, Filter, SortAsc } from "lucide-react";

export default function WorkspacePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const data = await getMyProjects();
      setProjects(data || []);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getTableCount = (data: any) => {
    if (!data) return 0;
    try {
      let parsed = data;
      
      // Helper to parse if string
      const tryParse = (val: any) => {
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch { return val; }
        }
        return val;
      };

      parsed = tryParse(parsed);
      parsed = tryParse(parsed); // Handle double encoding

      // If it's null/undefined after parsing
      if (!parsed) return 0;

      // Case 1: Array of nodes directly
      if (Array.isArray(parsed)) {
        return parsed.filter((n: any) => n.type === 'table' || n.type === 'tableNode').length;
      }

      // Case 2: Object with nodes array
      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        return parsed.nodes.filter((n: any) => n.type === 'table' || n.type === 'tableNode').length;
      }

      // Case 3: Object with tables array
      if (parsed.tables && Array.isArray(parsed.tables)) {
        return parsed.tables.length;
      }

      // Case 4: Check if nodes is a string that needs parsing
      if (parsed.nodes && typeof parsed.nodes === 'string') {
         const nodes = tryParse(parsed.nodes);
         if (Array.isArray(nodes)) {
            return nodes.filter((n: any) => n.type === 'table' || n.type === 'tableNode').length;
         }
      }

      return 0;
    } catch (e) {
      console.error("Error counting tables:", e);
      return 0;
    }
  };

  return (
    <div className="space-y-8 text-mocha-text">
      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchProjects}
      />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-mocha-mauve to-mocha-blue bg-clip-text text-transparent">Workspace</h1>
          <p className="text-mocha-subtext0 text-lg">Manage your database projects and schemas.</p>
        </div>
      </div>

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
        {isLoading ? (
           // Skeleton Loaders
           [...Array(3)].map((_, i) => (
             <div key={i} className="h-64 rounded-2xl bg-mocha-surface0/50 animate-pulse border border-mocha-surface0" />
           ))
        ) : projects.length === 0 ? (
            // Initial Empty State (handled by the create card being the only thing, or we can add a specific empty message if we want, but the grid with just the create button is usually fine)
            null 
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
                <button className="p-2 hover:bg-mocha-surface1 rounded-lg transition-colors text-mocha-overlay0 hover:text-mocha-text opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-4 h-4" />
                </button>
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
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    {getTableCount(project.data)} Tables
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-mocha-surface0 flex items-center justify-center text-mocha-text opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getMyProjects } from "../../lib/projects";
import { Project } from "../../types";
import CreateProjectModal from "../components/CreateProjectModal";

export default function WorkspacePage() {
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

  return (
    <div className="space-y-8 text-mocha-text">
      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchProjects}
      />
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Workspace</h1>
        <p className="text-mocha-subtext0 text-lg">Manage your database projects and schemas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Project Card */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative h-48 rounded-xl border border-mocha-surface0 bg-mocha-mantle/50 hover:border-mocha-mauve hover:bg-mocha-mantle transition-all duration-300 flex flex-col items-center justify-center gap-4"
        >
          <div className="h-12 w-12 rounded-full bg-mocha-surface0 flex items-center justify-center group-hover:bg-mocha-mauve group-hover:text-mocha-crust transition-colors duration-300">
            <svg 
              className="w-6 h-6 text-mocha-subtext0 group-hover:text-mocha-crust transition-colors" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm font-medium text-mocha-subtext0 group-hover:text-mocha-text transition-colors">Create New Project</span>
        </button>

        {/* Project Cards */}
        {isLoading ? (
           <div className="col-span-full flex justify-center items-center py-12 text-mocha-subtext0">
             Loading projects...
           </div>
        ) : projects.length === 0 ? (
            <div className="col-span-full flex justify-center items-center py-12 text-mocha-subtext0">
                No projects found. Create one to get started!
            </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="h-48 p-6 rounded-xl border border-mocha-surface0 bg-mocha-mantle hover:border-mocha-blue transition-colors flex flex-col justify-between group cursor-pointer">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded bg-mocha-blue/20 flex items-center justify-center text-mocha-blue border border-mocha-blue/30">
                    <span className="text-xs font-bold">{project.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-xs text-mocha-overlay0 font-mono">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-mocha-text group-hover:text-mocha-blue transition-colors truncate">{project.name}</h3>
                <p className="text-sm text-mocha-subtext0 line-clamp-2">
                  {project.description?.Valid ? project.description.String : "No description"}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-mocha-overlay0">
                <span className="px-2 py-0.5 rounded-full bg-mocha-surface0 border border-mocha-surface1 text-mocha-subtext1">PostgreSQL</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getProjectCollaborators, ProjectCollaborator } from "../../../lib/projects";

interface ProjectMembersProps {
  projectId: string;
  maxDisplay?: number;
}

function getColorForUser(id: string): string {
  const palette = [
    "#cba6f7",
    "#89b4fa",
    "#f5c2e7",
    "#a6e3a1",
    "#f9e2af",
    "#89dceb",
    "#fab387",
  ];
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = Math.abs(hash) % palette.length;
  return palette[index] || "#cba6f7";
}

export function ProjectMembers({ projectId, maxDisplay = 3 }: ProjectMembersProps) {
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchCollaborators = async () => {
      try {
        setIsLoading(true);
        const data = await getProjectCollaborators(projectId);
        if (!cancelled) {
          setCollaborators(data);
        }
      } catch {
        if (!cancelled) {
          setCollaborators([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchCollaborators();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (isLoading || collaborators.length === 0) {
    return null;
  }

  const displayedMembers = collaborators.slice(0, maxDisplay);
  const extraMembers = collaborators.length - displayedMembers.length;

  return (
    <div className="flex -space-x-2">
      {displayedMembers.map((member) => {
        const hasAvatar = member.avatar_url && member.avatar_url.trim() !== "";
        const color = getColorForUser(member.id);
        return (
          <div
            key={member.id}
            className="h-6 w-6 rounded-full border border-mocha-crust/40 overflow-hidden flex-shrink-0"
            title={member.name}
          >
            {hasAvatar ? (
              <img
                src={member.avatar_url!}
                alt={member.name || "Collaborator"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to colored circle if image fails to load
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.style.backgroundColor = color;
                    parent.className += " flex items-center justify-center text-[10px] font-semibold text-mocha-crust";
                    parent.textContent = member.name?.charAt(0).toUpperCase() || "?";
                  }
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-mocha-crust"
                style={{ backgroundColor: color }}
              >
                {member.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
        );
      })}
      {extraMembers > 0 && (
        <div className="h-6 w-6 rounded-full bg-mocha-surface0/80 border border-mocha-surface1 text-[10px] text-mocha-text flex items-center justify-center">
          +{extraMembers}
        </div>
      )}
    </div>
  );
}


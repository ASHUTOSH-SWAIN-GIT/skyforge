import { api } from "./api";
import { JoinShareLinkInfo, Project, ShareLinkInfo } from "../types";

export async function getMyProjects() {
    return api<Project[]>("/projects");
}

export async function getProject(projectId: string) {
    return api<Project>(`/projects/${projectId}`);
}

export async function createProject(data: { name: string; description: string; collaborators: string[] }) {
    return api<Project>("/projects", {
        method: "POST",
        body: data,
    });
}

export async function exportProjectSQL(projectId: string) {
    const res = await fetch(`/api/projects/${projectId}/export`, {
        method: "GET",
        credentials: "include",
    });
    const text = await res.text();
    if (!res.ok) {
        if (res.status === 401) {
            window.location.href = "/login";
        }
        throw new Error(text || "Failed to export SQL");
    }
    return text;
}

export interface AIGeneratedCanvas {
    nodes: Array<{
        id: string;
        type: string;
        position: { x: number; y: number };
        data: {
            name: string;
            columns: Array<{
                id: string;
                name: string;
                type: string;
                isPrimaryKey: boolean;
                constraints: string[];
            }>;
        };
    }>;
    edges: Array<{
        id: string;
        source: string;
        target: string;
        sourceHandle: string;
        targetHandle: string;
        type: string;
        animated: boolean;
    }>;
}

export async function aiGenerateTables(projectId: string, prompt: string): Promise<AIGeneratedCanvas> {
    const res = await fetch(`/api/projects/${projectId}/ai/generate-tables`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
        if (res.status === 401) {
            window.location.href = "/login";
        }
        const errorText = await res.text();
        throw new Error(errorText || "Failed to generate tables with AI");
    }

    return res.json();
}

export async function updateProject(
    projectId: string,
    data: { data?: Record<string, unknown>; name?: string; description?: string }
) {
    return api<Project>(`/projects/${projectId}`, {
        method: "PUT",
        body: data,
    });
}

export async function deleteProject(projectId: string) {
    return api<void>(`/projects/${projectId}`, {
        method: "DELETE",
    });
}

export async function importSQL(projectId: string, file: File): Promise<Project> {
    const formData = new FormData();
    formData.append("sqlFile", file);

    const res = await fetch(`/api/projects/${projectId}/import-sql`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });

    if (!res.ok) {
        if (res.status === 401) {
            window.location.href = "/login";
        }
        const errorText = await res.text();
        throw new Error(errorText || "Failed to import SQL");
    }

    return res.json();
}

type ShareLinkApiResponse = {
    project_id: string;
    token: string;
    room_key: string;
    created_at: string;
    created_by: string;
    expires_at?: string | null;
};

type JoinShareLinkApiResponse = {
    project_id: string;
    project_name: string;
    room_key: string;
    token: string;
    owner_id: string;
    expires_at?: string | null;
};

const mapShareLink = (payload: ShareLinkApiResponse): ShareLinkInfo => ({
    projectId: payload.project_id,
    token: payload.token,
    roomKey: payload.room_key,
    createdAt: payload.created_at,
    createdBy: payload.created_by,
    expiresAt: payload.expires_at ?? null,
});

const mapJoinShareLink = (payload: JoinShareLinkApiResponse): JoinShareLinkInfo => ({
    projectId: payload.project_id,
    projectName: payload.project_name,
    roomKey: payload.room_key,
    token: payload.token,
    ownerId: payload.owner_id,
    expiresAt: payload.expires_at ?? null,
});

export async function getProjectShareLink(projectId: string): Promise<ShareLinkInfo> {
    const response = await api<ShareLinkApiResponse>(`/projects/${projectId}/share-link`);
    return mapShareLink(response);
}

export async function createProjectShareLink(projectId: string, expiresInHours?: number): Promise<ShareLinkInfo> {
    const response = await api<ShareLinkApiResponse>(`/projects/${projectId}/share-link`, {
        method: "POST",
        body: expiresInHours ? { expiresInHours } : {},
    });
    return mapShareLink(response);
}

export async function joinShareLink(token: string): Promise<JoinShareLinkInfo> {
    const response = await api<JoinShareLinkApiResponse>(`/projects/share-links/${token}/join`, {
        method: "POST",
    });
    return mapJoinShareLink(response);
}

export interface ProjectCollaborator {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    provider: string;
    role: string;
    created_at: string;
}

export async function getProjectCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
    return api<ProjectCollaborator[]>(`/projects/${projectId}/collaborators`);
}


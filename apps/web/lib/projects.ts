import { api } from "./api";
import { Project } from "../types";

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

export async function exportProjectSQLAI(projectId: string) {
    const res = await fetch(`/api/projects/${projectId}/export/ai`, {
        method: "GET",
        credentials: "include",
    });
    const text = await res.text();
    if (!res.ok) {
        if (res.status === 401) {
            window.location.href = "/login";
        }
        throw new Error(text || "Failed to export SQL via AI");
    }
    return text;
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


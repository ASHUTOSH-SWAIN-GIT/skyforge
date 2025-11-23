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

export async function updateProject(projectId: string, data: { data?: string; name?: string; description?: string }) {
    return api<Project>(`/projects/${projectId}`, {
        method: "PUT",
        body: data,
    });
}


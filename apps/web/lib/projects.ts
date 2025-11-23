import { api } from "./api";
import { Project } from "../types";

export async function getMyProjects() {
    return api<Project[]>("/projects");
}

export async function createProject(data: { name: string; description: string; collaborators: string[] }) {
    return api<Project>("/projects", {
        method: "POST",
        body: data,
    });
}


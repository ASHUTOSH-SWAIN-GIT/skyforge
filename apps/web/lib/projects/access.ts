import type { Project } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "../db";

export class ProjectNotFoundError extends Error {
  constructor() {
    super("project not found");
  }
}
export class ProjectAccessDeniedError extends Error {
  constructor() {
    super("project access denied");
  }
}

export async function getProjectForUser(projectId: string, userId: string): Promise<Project> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ProjectNotFoundError();
  if (project.userId === userId) return project;

  const collab = await prisma.projectCollaborator.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!collab) throw new ProjectAccessDeniedError();
  return project;
}

export function projectAccessErrorResponse(err: unknown): NextResponse {
  if (err instanceof ProjectNotFoundError)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (err instanceof ProjectAccessDeniedError)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Database error" }, { status: 500 });
}

// Mirror of Go server: collapse stringified JSON into the actual object/array.
export function normalizeCanvasJSON(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "null") return null;
    return JSON.parse(trimmed);
  }
  return raw;
}

export function generateCollaborationToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

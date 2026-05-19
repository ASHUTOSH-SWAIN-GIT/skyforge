import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { cache } from "@/lib/cache";
import { prisma } from "@/lib/db";
import {
  getProjectForUser,
  normalizeCanvasJSON,
  projectAccessErrorResponse,
} from "@/lib/projects/access";
import { withAuth } from "@/lib/projects/handler";

export const GET = withAuth<{ projectId: string }>(async (_req, { userId, params }) => {
  try {
    const project = await getProjectForUser(params.projectId, userId);
    return NextResponse.json(project);
  } catch (err) {
    return projectAccessErrorResponse(err);
  }
});

export const PUT = withAuth<{ projectId: string }>(async (req, { userId, params }) => {
  const { projectId } = params;
  let body: { data?: unknown };
  try {
    body = (await req.json()) as { data?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let cleanData: unknown;
  try {
    cleanData = normalizeCanvasJSON(body.data);
  } catch {
    return NextResponse.json({ error: "Invalid canvas data" }, { status: 400 });
  }

  try {
    await getProjectForUser(projectId, userId);
  } catch (err) {
    return projectAccessErrorResponse(err);
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      data: (cleanData ?? {}) as Prisma.InputJsonValue,
      lastSavedAt: new Date(),
    },
  });

  cache.deletePrefix(`export:${projectId}:`);
  return NextResponse.json(project);
});

export const DELETE = withAuth<{ projectId: string }>(async (_req, { userId, params }) => {
  let project;
  try {
    project = await getProjectForUser(params.projectId, userId);
  } catch (err) {
    return projectAccessErrorResponse(err);
  }
  if (project.userId !== userId) {
    return NextResponse.json(
      { error: "Only project owners can delete projects" },
      { status: 403 },
    );
  }
  await prisma.project.delete({ where: { id: params.projectId } });
  return new NextResponse(null, { status: 204 });
});

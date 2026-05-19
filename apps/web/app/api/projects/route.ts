import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/projects/handler";

export const GET = withAuth(async (_req, { userId }) => {
  const owned = await prisma.project.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      description: true,
      isPublic: true,
      lastSavedAt: true,
      createdAt: true,
    },
  });
  const collab = await prisma.projectCollaborator.findMany({
    where: { userId },
    select: {
      role: true,
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          isPublic: true,
          lastSavedAt: true,
          createdAt: true,
        },
      },
    },
  });

  const all = [
    ...owned.map((p) => ({ ...p, role: "owner" })),
    ...collab.map(({ role, project }) => ({ ...project, role })),
  ].sort((a, b) => b.lastSavedAt.getTime() - a.lastSavedAt.getTime());

  return NextResponse.json(all);
});

export const POST = withAuth(async (req, { userId }) => {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
  };
  if (!body.name) return NextResponse.json({ error: "Project name is required" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      userId,
      name: body.name,
      description: body.description || null,
      data: {} as Prisma.InputJsonValue,
    },
  });
  return NextResponse.json(project);
});

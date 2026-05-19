import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/projects/handler";

export const POST = withAuth<{ token: string }>(async (_req, { userId, params }) => {
  const { token } = params;
  if (!token) return NextResponse.json({ error: "Share token is required" }, { status: 400 });

  const link = await prisma.projectShareLink.findFirst({
    where: { token, revokedAt: null },
  });
  if (!link) return NextResponse.json({ error: "Share link not found" }, { status: 404 });

  if (link.expiresAt && link.expiresAt < new Date()) {
    await prisma.projectShareLink.updateMany({
      where: { projectId: link.projectId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({ error: "Share link expired" }, { status: 410 });
  }

  const project = await prisma.project.findUnique({ where: { id: link.projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (project.userId !== userId) {
    await prisma.projectCollaborator.upsert({
      where: { projectId_userId: { projectId: project.id, userId } },
      update: { role: "editor" },
      create: { projectId: project.id, userId, role: "editor" },
    });
  }

  return NextResponse.json({
    project_id: project.id,
    project_name: project.name,
    room_key: link.roomKey,
    token: link.token,
    owner_id: project.userId,
    expires_at: link.expiresAt ?? undefined,
  });
});

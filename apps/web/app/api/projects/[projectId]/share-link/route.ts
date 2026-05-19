import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateCollaborationToken,
  getProjectForUser,
  projectAccessErrorResponse,
} from "@/lib/projects/access";
import { withAuth } from "@/lib/projects/handler";

function shareLinkResponse(link: {
  projectId: string;
  token: string;
  roomKey: string;
  createdAt: Date;
  expiresAt: Date | null;
  createdBy: string;
}) {
  return {
    project_id: link.projectId,
    token: link.token,
    room_key: link.roomKey,
    created_at: link.createdAt,
    expires_at: link.expiresAt ?? undefined,
    created_by: link.createdBy,
  };
}

export const GET = withAuth<{ projectId: string }>(async (_req, { userId, params }) => {
  try {
    await getProjectForUser(params.projectId, userId);
  } catch (err) {
    return projectAccessErrorResponse(err);
  }
  const link = await prisma.projectShareLink.findFirst({
    where: { projectId: params.projectId, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!link) return NextResponse.json({ error: "No active share link" }, { status: 404 });
  return NextResponse.json(shareLinkResponse(link));
});

export const POST = withAuth<{ projectId: string }>(async (req, { userId, params }) => {
  let project;
  try {
    project = await getProjectForUser(params.projectId, userId);
  } catch (err) {
    return projectAccessErrorResponse(err);
  }
  if (project.userId !== userId) {
    return NextResponse.json(
      { error: "Only the project owner can create share links" },
      { status: 403 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { expiresInHours?: number };
  const expiresAt =
    body.expiresInHours && body.expiresInHours > 0
      ? new Date(Date.now() + body.expiresInHours * 60 * 60 * 1000)
      : null;

  await prisma.projectShareLink.updateMany({
    where: { projectId: params.projectId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const link = await prisma.projectShareLink.create({
    data: {
      projectId: params.projectId,
      token: generateCollaborationToken(),
      roomKey: generateCollaborationToken(),
      createdBy: userId,
      expiresAt,
    },
  });
  return NextResponse.json(shareLinkResponse(link));
});

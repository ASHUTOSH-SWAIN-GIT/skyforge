import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProjectForUser, projectAccessErrorResponse } from "@/lib/projects/access";
import { withAuth } from "@/lib/projects/handler";

export const GET = withAuth<{ projectId: string }>(async (_req, { userId, params }) => {
  let project;
  try {
    project = await getProjectForUser(params.projectId, userId);
  } catch (err) {
    return projectAccessErrorResponse(err);
  }

  const owner = await prisma.user.findUnique({ where: { id: project.userId } });
  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId: project.id },
    include: { user: true },
  });

  const out = [
    ...(owner
      ? [
          {
            id: owner.id,
            email: owner.email,
            name: owner.name,
            avatar_url: owner.avatarUrl,
            provider: owner.provider,
            role: "owner",
            created_at: project.createdAt,
          },
        ]
      : []),
    ...collaborators.map((c) => ({
      id: c.user.id,
      email: c.user.email,
      name: c.user.name,
      avatar_url: c.user.avatarUrl,
      provider: c.user.provider,
      role: c.role,
      created_at: c.createdAt,
    })),
  ];

  return NextResponse.json(out);
});

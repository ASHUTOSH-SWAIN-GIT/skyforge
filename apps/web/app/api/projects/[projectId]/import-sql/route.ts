import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { cache } from "@/lib/cache";
import { importSQL } from "@/lib/compiler/sql-to-canvas";
import { prisma } from "@/lib/db";
import { getProjectForUser, projectAccessErrorResponse } from "@/lib/projects/access";
import { withAuth } from "@/lib/projects/handler";

export const POST = withAuth<{ projectId: string }>(async (req, { userId, params }) => {
  try {
    await getProjectForUser(params.projectId, userId);
  } catch (err) {
    return projectAccessErrorResponse(err);
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("sqlFile");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  const text = await file.text();

  let canvasData: unknown;
  try {
    canvasData = importSQL(text);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to import SQL: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  const updated = await prisma.project.update({
    where: { id: params.projectId },
    data: {
      data: canvasData as Prisma.InputJsonValue,
      lastSavedAt: new Date(),
    },
  });

  cache.deletePrefix(`export:${params.projectId}:`);
  return NextResponse.json(updated);
});

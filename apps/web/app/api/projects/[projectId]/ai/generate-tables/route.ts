import { NextResponse } from "next/server";
import { aiAvailable, generateTablesFromPrompt } from "@/lib/ai/service";
import { getProjectForUser, projectAccessErrorResponse } from "@/lib/projects/access";
import { withAuth } from "@/lib/projects/handler";

export const POST = withAuth<{ projectId: string }>(async (req, { userId, params }) => {
  try {
    await getProjectForUser(params.projectId, userId);
  } catch (err) {
    return projectAccessErrorResponse(err);
  }

  if (!aiAvailable()) {
    return NextResponse.json(
      { error: "AI Service not configured (Missing API Key)" },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { prompt?: string };
  const prompt = (body.prompt ?? "").trim();
  if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

  try {
    const canvas = await generateTablesFromPrompt(prompt);
    return NextResponse.json(canvas);
  } catch (err) {
    return NextResponse.json(
      { error: `AI Generation failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
});

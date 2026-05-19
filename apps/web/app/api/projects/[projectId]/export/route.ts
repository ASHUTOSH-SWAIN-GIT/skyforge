import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { aiAvailable, generateSQLFromCanvas } from "@/lib/ai/service";
import { cache } from "@/lib/cache";
import { generateSQL } from "@/lib/compiler/sql";
import {
  getProjectForUser,
  normalizeCanvasJSON,
  projectAccessErrorResponse,
} from "@/lib/projects/access";
import { withAuth } from "@/lib/projects/handler";

const EXPORT_TTL = 24 * 60 * 60 * 1000;

export const GET = withAuth<{ projectId: string }>(async (_req, { userId, params }) => {
  let project;
  try {
    project = await getProjectForUser(params.projectId, userId);
  } catch (err) {
    return projectAccessErrorResponse(err);
  }

  const data = normalizeCanvasJSON(project.data);
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return NextResponse.json({ error: "Project has no canvas data" }, { status: 400 });
  }

  const json = JSON.stringify(data);
  const hash = createHash("sha256").update(json).digest("hex");
  const cacheKey = `export:${project.id}:sql:${hash}`;

  const cached = cache.get<string>(cacheKey);
  if (cached)
    return new NextResponse(cached, {
      headers: { "Content-Type": "text/plain", "X-Cache": "HIT" },
    });

  let sql: string;
  if (aiAvailable()) {
    try {
      sql = await generateSQLFromCanvas(json);
    } catch {
      sql = generateSQL(json);
    }
  } else {
    sql = generateSQL(json);
  }

  cache.set(cacheKey, sql, EXPORT_TTL);
  return new NextResponse(sql, {
    headers: { "Content-Type": "text/plain", "X-Cache": "MISS" },
  });
});

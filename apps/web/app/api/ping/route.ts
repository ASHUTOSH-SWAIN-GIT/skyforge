export async function GET() {
  return new Response("pong", { headers: { "Cache-Control": "no-cache" } });
}

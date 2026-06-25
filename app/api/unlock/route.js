// Checks the shared edit password without ever exposing it to the browser.
// EDIT_PASSWORD lives server-side only. If it's unset, editing stays open.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  const expected = process.env.EDIT_PASSWORD;

  if (!expected) return Response.json({ ok: true }); // protection not configured
  if (password && password === expected) return Response.json({ ok: true });

  return new Response("Unauthorized", { status: 401 });
}

// Checks the shared edit password without ever exposing it to the browser.
// EDIT_PASSWORD lives server-side only. If it's unset, editing stays open.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  // Set ADMIN_PASSWORD in Vercel to override the default. The default exists
  // only so the app works out of the box — this is a UI gate, not hard security.
  const expected = process.env.ADMIN_PASSWORD || "pinqponq";

  if (password && password === expected) return Response.json({ ok: true });
  return new Response("Unauthorized", { status: 401 });
}

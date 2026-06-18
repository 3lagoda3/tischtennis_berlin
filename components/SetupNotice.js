import { PingBall } from "./ui";

// Shown when Supabase env vars are missing — so a fresh deploy explains itself
// instead of crashing with a blank screen.
export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <div className="flex items-center gap-3">
        <PingBall className="h-9 w-9" />
        <h1 className="text-2xl font-black tracking-tight">Berlin Pong</h1>
      </div>
      <div className="mt-6 rounded-3xl bg-paper p-6 shadow-sm ring-1 ring-ink/10">
        <h2 className="text-lg font-bold">Almost there — connect Supabase</h2>
        <p className="mt-2 text-sm text-ink/60">
          The two environment variables aren’t set yet. Add them and redeploy:
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="rounded-xl bg-ink/5 px-3 py-2 font-mono text-xs">
            NEXT_PUBLIC_SUPABASE_URL
          </li>
          <li className="rounded-xl bg-ink/5 px-3 py-2 font-mono text-xs">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </li>
        </ul>
        <p className="mt-4 text-sm text-ink/60">
          Locally: copy <span className="font-mono text-xs">.env.local.example</span> to{" "}
          <span className="font-mono text-xs">.env.local</span>. On Vercel: Project → Settings →
          Environment Variables. See <span className="font-mono text-xs">README.md</span> for the
          full walkthrough.
        </p>
      </div>
    </main>
  );
}

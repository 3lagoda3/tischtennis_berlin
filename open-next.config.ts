import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal OpenNext config — runs the Next.js app as a Cloudflare Worker.
// (No KV/R2 incremental cache configured; the app's data is dynamic via Supabase.)
export default defineCloudflareConfig({});

"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button, PingBall } from "./ui";

// Collects emails for future tournament announcements.
export function Subscribe() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | busy | done | error
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setState("error");
      setMsg("That doesn't look like an email.");
      return;
    }
    setState("busy");
    const { error } = await supabase.from("subscribers").insert({ email: value });
    // A duplicate email (unique violation) is fine — treat as success.
    if (error && error.code !== "23505") {
      setState("error");
      setMsg("Couldn't sign up. Try again.");
      return;
    }
    setState("done");
  }

  return (
    <section className="rounded-3xl bg-ink p-6 text-paper shadow-sm">
      <div className="flex items-center gap-2">
        <PingBall className="h-5 w-5" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-paper/70">Stay in the loop</h2>
      </div>
      <p className="mt-2 text-sm text-paper/60">
        Get a heads-up about upcoming tournaments and crew news.
      </p>

      {state === "done" ? (
        <p className="mt-4 font-semibold text-ball">You're on the list. 🏓</p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="flex-1 rounded-full bg-paper/10 px-4 py-2.5 text-sm text-paper outline-none ring-1 ring-paper/15 placeholder:text-paper/40 focus:ring-ball/60"
          />
          <Button type="submit" variant="accent" disabled={state === "busy"}>
            {state === "busy" ? "…" : "Subscribe"}
          </Button>
        </form>
      )}
      {state === "error" && <p className="mt-2 text-sm text-ball">{msg}</p>}
    </section>
  );
}

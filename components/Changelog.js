"use client";

import { useState } from "react";
import { CHANGELOG } from "../lib/changelog";

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function Changelog() {
  // Show the latest 2 versions by default; expand for the full history.
  const [open, setOpen] = useState(false);
  const shown = open ? CHANGELOG : CHANGELOG.slice(0, 2);

  return (
    <section className="rounded-3xl bg-paper p-5 shadow-sm ring-1 ring-ink/10">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-ink/50">
        What's new
      </h2>

      <ol className="relative space-y-5 border-l border-ink/10 pl-5">
        {shown.map((v) => (
          <li key={v.version} className="relative">
            <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-ball ring-4 ring-paper" />
            <div className="flex items-baseline gap-2">
              <span className="font-black tabnum">{v.version}</span>
              <span className="text-sm font-semibold text-ink/70">{v.title}</span>
              <span className="ml-auto text-xs tabnum text-ink/40">{fmtDate(v.date)}</span>
            </div>
            <ul className="mt-1.5 space-y-1">
              {v.changes.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink/60">
                  <span className="text-ball">·</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {CHANGELOG.length > 2 && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-4 text-sm font-semibold text-ball hover:underline"
        >
          {open ? "Show less" : `Show full history (${CHANGELOG.length} versions)`}
        </button>
      )}
    </section>
  );
}

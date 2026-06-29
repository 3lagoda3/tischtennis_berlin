"use client";

import { useEffect } from "react";
import { badgeFor } from "../lib/tournament";

// Spinning table-tennis ball used as the brand mark.
export function PingBall({ className = "w-7 h-7" }) {
  return (
    <span
      className={`inline-block rounded-full bg-ball shadow-[inset_-3px_-3px_6px_rgba(0,0,0,0.25)] ${className}`}
      aria-hidden
    />
  );
}

// Round avatar with initials fallback. Plain <img> keeps it dependency-free.
export function Avatar({ src, name, size = 36 }) {
  const initials = (name || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className="inline-flex items-center justify-center overflow-hidden rounded-full bg-ink/10 text-ink/70 font-semibold ring-1 ring-ink/10"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

// Lightweight modal — closes on backdrop click + Escape, locks scroll.
export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-bounce-in rounded-t-3xl bg-paper p-6 shadow-2xl ring-1 ring-ink/10 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-ink/50 transition hover:bg-ink/5 hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Primary / accent / ghost / danger buttons sharing one look.
export function Button({ variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-95 disabled:opacity-40 disabled:active:scale-100";
  const styles = {
    primary: "bg-ink text-paper hover:bg-ink/85",
    accent: "bg-ball text-white hover:bg-ball/90",
    ghost: "bg-ink/5 text-ink hover:bg-ink/10",
    danger: "bg-transparent text-ball hover:bg-ball/10",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

// Small circular icon button (edit pencils etc.).
export function IconButton({ label, className = "", children, ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-full text-ink/40 transition hover:bg-ink/5 hover:text-ink ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Last-N results as small dots: win = orange, loss = grey.
export function FormDots({ results, max = 5 }) {
  const shown = results.slice(0, max);
  if (shown.length === 0) return <span className="text-xs text-ink/30">—</span>;
  return (
    <span className="inline-flex gap-1">
      {shown.map((r, i) => (
        <span
          key={i}
          title={r === "W" ? "Win" : "Loss"}
          className={`h-2 w-2 rounded-full ${r === "W" ? "bg-ball" : "bg-ink/20"}`}
        />
      ))}
    </span>
  );
}

// Per-format winner badges. `titles` is an array of { name, format }.
// One chip per format the player has won, with a count when they've won
// the same format more than once.
export function TrophyBadge({ titles, className = "" }) {
  if (!titles || titles.length === 0) return null;

  const byFmt = {};
  for (const t of titles) {
    // Tolerate legacy string titles (default them to the league trophy).
    const fmt = typeof t === "string" ? "round_robin" : t.format || "round_robin";
    const name = typeof t === "string" ? t : t.name;
    (byFmt[fmt] ||= []).push(name);
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {Object.entries(byFmt).map(([fmt, names]) => {
        const b = badgeFor(fmt);
        return (
          <span
            key={fmt}
            title={`${b.label}: ${names.join(", ")}`}
            className="inline-flex items-center gap-0.5 text-xs font-bold leading-none"
            style={{ color: b.color }}
          >
            <span aria-hidden>{b.icon}</span>
            {names.length > 1 && <span className="tabnum">{names.length}</span>}
          </span>
        );
      })}
    </span>
  );
}

// "W3" / "L2" streak chip.
export function StreakBadge({ streak }) {
  if (!streak) return null;
  const win = streak > 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-bold tabnum ${
        win ? "bg-ball/15 text-ball" : "bg-ink/10 text-ink/50"
      }`}
    >
      {win ? "W" : "L"}
      {Math.abs(streak)}
    </span>
  );
}

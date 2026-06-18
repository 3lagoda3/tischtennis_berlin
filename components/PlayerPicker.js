"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "./ui";

// Custom dropdown that shows avatars + nicknames. `exclude` hides one id
// (so you can't pick the same player on both sides of a match).
export function PlayerPicker({ players, value, onChange, placeholder = "Select player", exclude }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = players.find((p) => p.id === value);
  const options = players.filter((p) => p.id !== exclude);

  useEffect(() => {
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-2xl bg-ink/5 px-3 py-3 text-left transition hover:bg-ink/10"
      >
        {selected ? (
          <>
            <Avatar src={selected.photo_url} name={selected.nickname} size={30} />
            <span className="font-medium">{selected.nickname}</span>
          </>
        ) : (
          <span className="text-ink/40">{placeholder}</span>
        )}
        <span className="ml-auto text-ink/40">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-paper p-1 shadow-xl ring-1 ring-ink/10">
          {options.length === 0 && (
            <div className="px-3 py-3 text-sm text-ink/40">No players yet</div>
          )}
          {options.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(p.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-ink/5"
            >
              <Avatar src={p.photo_url} name={p.nickname} size={28} />
              <span className="font-medium">{p.nickname}</span>
              {p.id === value && <span className="ml-auto text-ball">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

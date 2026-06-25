"use client";

import { useEffect, useState } from "react";

// Flips the `dark` class on <html> and remembers the choice.
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to light" : "Switch to dark"}
      aria-label="Toggle theme"
      className="grid h-8 w-8 place-items-center rounded-full bg-ink/5 text-base transition hover:bg-ink/10"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}

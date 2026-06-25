"use client";

import { useEffect, useRef, useState } from "react";

// Fullscreen photo viewer. Tap a thumbnail to open; swipe or use arrows to
// browse; tap outside / ✕ / Escape to close.
export function Lightbox({ images, index, onClose }) {
  const [i, setI] = useState(index ?? 0);
  const startX = useRef(null);

  useEffect(() => {
    if (index != null) setI(index);
  }, [index]);

  const go = (d) => setI((p) => (p + d + images.length) % images.length);

  useEffect(() => {
    if (index == null) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, images.length]);

  if (index == null || images.length === 0) return null;
  const img = images[i];
  const many = images.length > 1;

  function onTouchEnd(e) {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    startX.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white/80">
        <span className="text-sm tabnum">
          {many ? `${i + 1} / ${images.length}` : ""}
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-lg hover:bg-white/20"
        >
          ✕
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
        onTouchEnd={onTouchEnd}
      >
        {many && (
          <button
            onClick={() => go(-1)}
            aria-label="Previous"
            className="absolute left-2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
          >
            ‹
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.image_url}
          alt={img.caption || "photo"}
          className="max-h-full max-w-full select-none rounded-xl object-contain"
        />

        {many && (
          <button
            onClick={() => go(1)}
            aria-label="Next"
            className="absolute right-2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
          >
            ›
          </button>
        )}
      </div>

      {img.caption && (
        <div className="px-4 pb-4 text-center text-sm text-white/70">{img.caption}</div>
      )}
    </div>
  );
}

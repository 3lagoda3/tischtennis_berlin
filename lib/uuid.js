// Safe UUID generator. crypto.randomUUID() is missing on older mobile Safari
// and some in-app browsers, so fall back to getRandomValues, then Math.random.
export function uuid() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const b = crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40; // version 4
      b[8] = (b[8] & 0x3f) | 0x80; // variant
      const h = [...b].map((x) => x.toString(16).padStart(2, "0"));
      return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10, 16).join("")}`;
    }
  } catch {}
  // Last resort — good enough for a unique file name.
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

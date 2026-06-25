"use client";

import { useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useApp } from "./AppProvider";
import { IconButton } from "./ui";

// Photo wall of game nights. Admins can upload + delete.
export function Gallery() {
  const { gallery, unlocked, ensure, load } = useApp();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("gallery")
        .upload(path, file, { cacheControl: "3600" });
      if (upErr) throw upErr;
      const url = supabase.storage.from("gallery").getPublicUrl(path).data.publicUrl;
      await supabase.from("gallery").insert({ image_url: url });
      load();
    } catch (err) {
      alert(err.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this photo?")) return;
    await supabase.from("gallery").delete().eq("id", id);
    load();
  }

  if (gallery.length === 0 && !unlocked) return null;

  return (
    <section className="rounded-3xl bg-paper p-5 shadow-sm ring-1 ring-ink/10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-ink/50">Gallery</h2>
        {unlocked && (
          <>
            <button
              onClick={() => ensure(() => fileRef.current?.click())}
              disabled={busy}
              className="rounded-full bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:bg-ink/10 disabled:opacity-50"
            >
              {busy ? "Uploading…" : "+ Add photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" />
          </>
        )}
      </div>

      {gallery.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink/40">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {gallery.map((g) => (
            <div key={g.id} className="group relative aspect-square overflow-hidden rounded-xl bg-ink/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.image_url} alt={g.caption || "game night"} className="h-full w-full object-cover" />
              {unlocked && (
                <IconButton
                  label="Delete photo"
                  onClick={() => ensure(() => remove(g.id))}
                  className="absolute right-1 top-1 bg-paper/80 opacity-0 group-hover:opacity-100"
                >
                  🗑
                </IconButton>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

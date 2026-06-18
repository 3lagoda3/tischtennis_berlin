"use client";

import { useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Modal, Button, Avatar } from "./ui";

export function AddPlayerModal({ open, onClose, onAdded }) {
  const [nickname, setNickname] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  function reset() {
    setNickname("");
    setFile(null);
    setPreview(null);
    setError("");
    setBusy(false);
  }

  function pickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    const name = nickname.trim();
    if (!name) return setError("Pick a nickname first.");
    setBusy(true);
    setError("");

    try {
      let photo_url = null;

      if (file) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        photo_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      const { error: insErr } = await supabase
        .from("players")
        .insert({ nickname: name, photo_url });
      if (insErr) throw insErr;

      reset();
      onAdded?.();
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add player">
      <form onSubmit={submit} className="space-y-5">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative grid place-items-center rounded-full ring-2 ring-dashed ring-ink/20 transition hover:ring-ball"
            style={{ width: 96, height: 96 }}
          >
            {preview ? (
              <Avatar src={preview} name={nickname} size={92} />
            ) : (
              <span className="text-center text-xs font-medium text-ink/40">
                📷<br />photo
              </span>
            )}
          </button>
          {/* capture="user" opens the front camera on phones; on desktop it's a file picker. */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={pickFile}
            className="hidden"
          />
          <span className="text-xs text-ink/40">Tap to take or upload a photo (optional)</span>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">Nickname</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Spinmeister"
            maxLength={24}
            autoFocus
            className="w-full rounded-2xl bg-ink/5 px-4 py-3 outline-none ring-ball/0 transition focus:bg-ink/10 focus:ring-2 focus:ring-ball/40"
          />
        </div>

        {error && <p className="text-sm font-medium text-ball">{error}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" className="flex-1" disabled={busy}>
            {busy ? "Adding…" : "Add player"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Modal, Button, Avatar } from "./ui";

// Handles both "add player" and "edit player" (when `player` is passed).
export function PlayerModal({ open, onClose, onSaved, player }) {
  const editing = Boolean(player);
  const [nickname, setNickname] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  // Sync form when opening / switching target player.
  useEffect(() => {
    if (!open) return;
    setNickname(player?.nickname || "");
    setPreview(player?.photo_url || null);
    setFile(null);
    setConfirmDel(false);
    setError("");
    setBusy(false);
  }, [open, player]);

  function pickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function uploadPhoto() {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) throw upErr;
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  async function submit(e) {
    e.preventDefault();
    const name = nickname.trim();
    if (!name) return setError("Pick a nickname first.");
    setBusy(true);
    setError("");

    try {
      let photo_url = player?.photo_url ?? null;
      if (file) photo_url = await uploadPhoto();

      if (editing) {
        const { error: err } = await supabase
          .from("players")
          .update({ nickname: name, photo_url })
          .eq("id", player.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("players")
          .insert({ nickname: name, photo_url });
        if (err) throw err;
      }

      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      // Matches referencing this player cascade-delete in the database.
      const { error: err } = await supabase.from("players").delete().eq("id", player.id);
      if (err) throw err;
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit player" : "Add player"}>
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
          {/* No `capture` attr → phones offer Photo Library + Take Photo + Choose File,
              which is far more reliable than forcing the camera. */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={pickFile}
            className="hidden"
          />
          <span className="text-xs text-ink/40">
            Tap to {editing ? "change" : "take or upload a"} photo
          </span>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">Nickname</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Spinmeister"
            maxLength={24}
            autoFocus
            className="w-full rounded-2xl bg-ink/5 px-4 py-3 outline-none transition focus:bg-ink/10 focus:ring-2 focus:ring-ball/40"
          />
        </div>

        {error && <p className="text-sm font-medium text-ball">{error}</p>}

        {confirmDel ? (
          <div className="space-y-2 rounded-2xl bg-ball/10 p-3">
            <p className="text-sm font-medium text-ink">
              Delete {player?.nickname}? Their games are removed too.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setConfirmDel(false)}>
                Keep
              </Button>
              <Button type="button" variant="accent" className="flex-1" disabled={busy} onClick={remove}>
                {busy ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            {editing && (
              <Button type="button" variant="danger" onClick={() => setConfirmDel(true)}>
                Delete
              </Button>
            )}
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" className="flex-1" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save" : "Add player"}
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}

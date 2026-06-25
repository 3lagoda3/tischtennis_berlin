"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase, isConfigured } from "../lib/supabaseClient";
import { UnlockModal } from "./UnlockModal";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin (editing) is always gated; viewing is open.
  const [unlocked, setUnlocked] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const load = useCallback(async () => {
    if (!isConfigured) return;
    const [{ data: p }, { data: m }, { data: t }, { data: g }] = await Promise.all([
      supabase.from("players").select("*"),
      supabase.from("matches").select("*").order("created_at", { ascending: false }),
      supabase.from("tournaments").select("*").order("created_at", { ascending: false }),
      supabase.from("gallery").select("*").order("created_at", { ascending: false }),
    ]);
    setPlayers(p || []);
    setMatches(m || []);
    setTournaments(t || []);
    setGallery(g || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    load();
    const channel = supabase
      .channel("realtime-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "tournaments" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "gallery" }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  // Remember a previous admin unlock so the organiser stays logged in.
  useEffect(() => {
    if (localStorage.getItem("bp_admin") === "1") setUnlocked(true);
  }, []);

  // Run an admin-only action, prompting for the password first if needed.
  const ensure = useCallback(
    (action) => {
      if (unlocked) action();
      else {
        setPending(() => action);
        setAskOpen(true);
      }
    },
    [unlocked]
  );

  const unlock = useCallback(
    async (password) => {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) return false;
      localStorage.setItem("bp_admin", "1");
      setUnlocked(true);
      setAskOpen(false);
      if (pending) {
        pending();
        setPending(null);
      }
      return true;
    },
    [pending]
  );

  const lock = useCallback(() => {
    localStorage.removeItem("bp_admin");
    setUnlocked(false);
  }, []);

  const value = {
    players,
    matches,
    tournaments,
    gallery,
    loading,
    load,
    isConfigured,
    unlocked,
    ensure,
    unlock,
    lock,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <UnlockModal
        open={askOpen}
        onClose={() => {
          setAskOpen(false);
          setPending(null);
        }}
        onSubmit={unlock}
      />
    </Ctx.Provider>
  );
}

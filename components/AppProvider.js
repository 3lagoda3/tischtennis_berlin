"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase, isConfigured } from "../lib/supabaseClient";
import { UnlockModal } from "./UnlockModal";

// Whether the edit-password gate is switched on for this deployment.
// If unset/false, everything stays open (original behaviour).
const EDIT_PROTECTED = process.env.NEXT_PUBLIC_EDIT_PROTECTED === "true";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [unlocked, setUnlocked] = useState(!EDIT_PROTECTED);
  const [askOpen, setAskOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const load = useCallback(async () => {
    if (!isConfigured) return;
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from("players").select("*"),
      supabase.from("matches").select("*").order("created_at", { ascending: false }),
    ]);
    setPlayers(p || []);
    setMatches(m || []);
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
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  // Restore a previous unlock so people don't re-enter the password every visit.
  useEffect(() => {
    if (EDIT_PROTECTED && localStorage.getItem("bp_unlocked") === "1") {
      setUnlocked(true);
    }
  }, []);

  // Run an edit action, prompting for the password first if still locked.
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
      localStorage.setItem("bp_unlocked", "1");
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
    localStorage.removeItem("bp_unlocked");
    setUnlocked(false);
  }, []);

  const value = {
    players,
    matches,
    loading,
    load,
    isConfigured,
    editProtected: EDIT_PROTECTED,
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

// Online rooms for two players. State lives in one jsonb row, guarded by an
// optimistic `version` counter so two near-simultaneous writes can't clobber each other.
import { supabase } from "../supabaseClient";
import { uuid } from "../uuid";
import { createGame } from "./engine";

const TOKEN_KEY = "berlin-scrabble-token";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O: easier to read aloud

export function myToken() {
  try {
    let t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      t = uuid();
      localStorage.setItem(TOKEN_KEY, t);
    }
    return t;
  } catch {
    return uuid();
  }
}

const newCode = () =>
  Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

export async function createRoom(name) {
  const token = myToken();
  const game = createGame([{ name }, { name: "…" }]);
  game.players[0].token = token;
  game.waiting = true; // until a friend joins
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const { error } = await supabase.from("scrabble_games").insert({ code, state: game, version: 0 });
    if (!error) return code;
  }
  throw new Error("Couldn't create a room.");
}

export async function fetchRoom(code) {
  const { data, error } = await supabase
    .from("scrabble_games")
    .select("state, version")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data; // { state, version } | null
}

/** Write `state` if nobody else has written since `version`. Returns the new version or null on conflict. */
export async function saveRoom(code, state, version) {
  const { data, error } = await supabase
    .from("scrabble_games")
    .update({ state, version: version + 1, updated_at: new Date().toISOString() })
    .eq("code", code)
    .eq("version", version)
    .select("version");
  if (error) throw error;
  return data && data.length ? data[0].version : null;
}

export function subscribeRoom(code, onRow) {
  const ch = supabase
    .channel(`scrabble-${code}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "scrabble_games", filter: `code=eq.${code}` },
      (payload) => onRow({ state: payload.new.state, version: payload.new.version })
    )
    .subscribe();
  return () => supabase.removeChannel(ch);
}

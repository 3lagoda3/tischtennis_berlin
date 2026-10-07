// Online rooms for two players — same model as Scrabble: one jsonb row per game,
// guarded by an optimistic `version` counter.
import { supabase } from "../supabaseClient";
import { myToken } from "../scrabble/online";
import { createGame } from "./engine";

export { myToken };

const TABLE = "battleship_games";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O: easier to read aloud

const newCode = () =>
  Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

export async function createRoom(name) {
  const game = createGame([{ name }, { name: "…" }], Math.random() < 0.5 ? 0 : 1);
  game.players[0].token = myToken();
  game.waiting = true; // until a friend joins
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const { error } = await supabase.from(TABLE).insert({ code, state: game, version: 0 });
    if (!error) return code;
  }
  throw new Error("Couldn't create a room.");
}

export async function fetchRoom(code) {
  const { data, error } = await supabase.from(TABLE).select("state, version").eq("code", code).maybeSingle();
  if (error) throw error;
  return data; // { state, version } | null
}

/** Write `state` if nobody else has written since `version`. Returns the new version or null on conflict. */
export async function saveRoom(code, state, version) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ state, version: version + 1, updated_at: new Date().toISOString() })
    .eq("code", code)
    .eq("version", version)
    .select("version");
  if (error) throw error;
  return data && data.length ? data[0].version : null;
}

export function subscribeRoom(code, onRow) {
  const ch = supabase
    .channel(`battleship-${code}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: TABLE, filter: `code=eq.${code}` },
      (payload) => onRow({ state: payload.new.state, version: payload.new.version })
    )
    .subscribe();
  return () => supabase.removeChannel(ch);
}

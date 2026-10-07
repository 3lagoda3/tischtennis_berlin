// "Наші слова": words the dictionary doesn't know (dialect, slang…) that a friend
// accepted during a game. Shared by everyone, tagged with where the word comes from.
import { supabase, isConfigured } from "../supabaseClient";

export const REGIONS = {
  uk: ["Полтавщина", "Закарпаття", "Гуцульщина", "Галичина", "Буковина", "Слобожанщина", "Волинь", "Поділля", "Південь", "Сленг", "Інше"],
  en: ["Slang", "Berlin", "Regional", "Other"],
};

export async function fetchOurWords(lang) {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from("scrabble_words")
    .select("word, region, added_by, created_at")
    .eq("lang", lang)
    .order("created_at", { ascending: false });
  if (error) return []; // table not created yet → just no extra words
  return data;
}

export async function addOurWords(lang, words, region, addedBy) {
  if (!isConfigured || !words.length) return;
  await supabase
    .from("scrabble_words")
    .upsert(
      words.map((word) => ({ lang, word, region: region || null, added_by: addedBy || null })),
      { onConflict: "lang,word", ignoreDuplicates: true }
    );
}

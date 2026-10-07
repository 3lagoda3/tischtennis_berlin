// Word lists per language, served as static files and cached in memory.
// English: ENABLE (public domain). Ukrainian: nominative nouns from brown-uk/dict_uk (GPL-3.0).
import { LANGS } from "./engine";

const promises = {};
const tries = new WeakMap();

export function loadDictionary(lang = "en") {
  if (!promises[lang]) {
    promises[lang] = fetch((LANGS[lang] || LANGS.en).words)
      .then((r) => {
        if (!r.ok) throw new Error("dictionary");
        return r.text();
      })
      .then((text) => new Set(text.split("\n").filter(Boolean)))
      .catch((e) => {
        delete promises[lang]; // allow retry
        throw e;
      });
  }
  return promises[lang];
}

// Prefix tree used by the computer player. Built lazily, once per word list.
export function getTrie(words) {
  if (tries.has(words)) return tries.get(words);
  const root = { c: {}, e: false };
  for (const w of words) {
    let n = root;
    for (let i = 0; i < w.length; i++) n = n.c[w[i]] || (n.c[w[i]] = { c: {}, e: false });
    n.e = true;
  }
  tries.set(words, root);
  return root;
}

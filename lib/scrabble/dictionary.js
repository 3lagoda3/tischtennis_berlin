// Word list: ENABLE (public domain), served as a static file and cached in memory.
let promise = null;
let trie = null;

export function loadDictionary() {
  if (!promise) {
    promise = fetch("/scrabble/words.txt")
      .then((r) => {
        if (!r.ok) throw new Error("dictionary");
        return r.text();
      })
      .then((text) => new Set(text.split("\n").filter(Boolean)))
      .catch((e) => {
        promise = null; // allow retry
        throw e;
      });
  }
  return promise;
}

// Prefix tree used by the computer player. Built lazily, once.
export function getTrie(words) {
  if (trie) return trie;
  const root = { c: {}, e: false };
  for (const w of words) {
    let n = root;
    for (let i = 0; i < w.length; i++) n = n.c[w[i]] || (n.c[w[i]] = { c: {}, e: false });
    n.e = true;
  }
  trie = root;
  return trie;
}

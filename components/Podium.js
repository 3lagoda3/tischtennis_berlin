"use client";

import Link from "next/link";
import { Avatar, TrophyBadge } from "./ui";

// Top-3 podium. Order on screen: 2nd, 1st (tall, centre), 3rd.
const SLOTS = [
  { rank: 2, h: "h-20", label: "🥈" },
  { rank: 1, h: "h-28", label: "🥇" },
  { rank: 3, h: "h-14", label: "🥉" },
];

export function Podium({ rows }) {
  if (rows.length < 3) return null;
  const top = Object.fromEntries(rows.slice(0, 3).map((r) => [r.rank, r]));

  return (
    <section className="rounded-3xl bg-paper p-5 pt-6 shadow-sm ring-1 ring-ink/10">
      <div className="flex items-end justify-center gap-3 sm:gap-5">
        {SLOTS.map(({ rank, h, label }) => {
          const p = top[rank];
          if (!p) return null;
          const big = rank === 1;
          return (
            <Link
              key={rank}
              href={`/player/${p.id}`}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="text-lg">{label}</div>
              <Avatar src={p.photo_url} name={p.nickname} size={big ? 64 : 48} />
              <div className="flex flex-col items-center text-center">
                <div className={`font-bold leading-tight ${big ? "text-base" : "text-sm"}`}>
                  {p.nickname}
                </div>
                {p.titles?.length > 0 && (
                  <TrophyBadge titles={p.titles} size={big ? 26 : 22} className="mt-1" />
                )}
                <div className="mt-0.5 text-xs tabnum text-ink/50">{p.eloRounded} Elo</div>
              </div>
              <div
                className={`mt-1 grid w-full place-items-center rounded-t-xl bg-ink/[0.04] ring-1 ${
                  big ? "ring-ball/40" : "ring-ink/10"
                } ${h}`}
              >
                <span className={`text-2xl font-black ${big ? "text-ball" : "text-ink/30"}`}>
                  {rank}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "./ui";

function Racket({ style }) {
  return (
    <svg
      viewBox="0 0 60 88"
      width="88"
      height="88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      {/* Handle */}
      <rect x="22" y="58" width="14" height="30" rx="7" fill="#8B6347" />
      <rect x="22" y="64" width="14" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <rect x="22" y="72" width="14" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      {/* Paddle */}
      <ellipse cx="30" cy="32" rx="24" ry="26" fill="#e63946" />
      <ellipse cx="30" cy="32" rx="24" ry="26" fill="none" stroke="#1a1a1a" strokeWidth="2.5" />
      {/* Shine */}
      <ellipse cx="20" cy="20" rx="9" ry="6" fill="white" opacity="0.2" transform="rotate(-20 20 20)" />
    </svg>
  );
}

export function PlayerJoinedCelebration({ name, photoUrl, onDone }) {
  const [phase, setPhase] = useState("in");

  useEffect(() => {
    const t = setTimeout(() => setPhase("out"), 3800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "out") return;
    const t = setTimeout(onDone, 350);
    return () => clearTimeout(t);
  }, [phase, onDone]);

  const particles = useMemo(() => {
    const colors = ["#ff5a1f", "#ffd60a", "#06d6a0", "#118ab2", "#e63946", "#ffffff", "#a855f7"];
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      size: 6 + (i % 4) * 3,
      angle: (i / 22) * 360 + (i % 3) * 12,
      dist: 110 + (i % 5) * 35,
      delay: 0.04 + (i % 6) * 0.04,
      duration: 0.75 + (i % 3) * 0.2,
    }));
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        phase === "out" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
      onClick={() => setPhase("out")}
    >
      {/* Confetti */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            "--tx": `${Math.cos((p.angle * Math.PI) / 180) * p.dist}px`,
            "--ty": `${Math.sin((p.angle * Math.PI) / 180) * p.dist}px`,
            animation: `confetti-out ${p.duration}s ease-out ${p.delay}s both`,
          }}
        />
      ))}

      {/* Card */}
      <div
        className="relative flex flex-col items-center gap-5 rounded-3xl bg-paper px-10 py-8 shadow-2xl ring-1 ring-ink/10"
        style={{ animation: "celebrate-card 0.38s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Racket + flying ball */}
        <div className="relative flex items-end justify-center" style={{ height: 96, width: 120 }}>
          <div style={{ animation: "racket-hit 0.65s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <Racket />
          </div>
          <div
            className="absolute rounded-full bg-ball shadow-lg"
            style={{
              width: 22,
              height: 22,
              right: 4,
              top: 8,
              boxShadow: "inset -3px -3px 6px rgba(0,0,0,0.25)",
              animation: "ball-fly 1s ease-out 0.25s both",
            }}
          />
        </div>

        {/* Yaaay */}
        <div style={{ animation: "text-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both" }}>
          <div className="text-center text-4xl font-black tracking-tight text-ball">
            Yaaay! 🏓
          </div>
        </div>

        {/* Avatar */}
        <div style={{ animation: "text-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.38s both" }}>
          <Avatar src={photoUrl} name={name} size={80} />
        </div>

        {/* Name + message */}
        <div
          className="text-center"
          style={{ animation: "text-pop 0.45s ease-out 0.52s both" }}
        >
          <div className="text-xl font-black">{name}</div>
          <div className="mt-1 text-sm font-medium text-ink/55">
            just joined the Berlin Pong Club! 🎉
          </div>
        </div>

        <div className="text-xs text-ink/30">tap anywhere to continue</div>
      </div>
    </div>
  );
}

import { VALUES } from "../../lib/scrabble/engine";

// A wooden-ish tile. `size` = "board" scales with the board's width (container
// query units), "rack" is a normal fluid tile.
export function Tile({ l, blank = false, size = "rack", ring = false, className = "", style, ...rest }) {
  const board = size === "board";
  return (
    <span
      className={`relative flex select-none items-center justify-center rounded-[18%] bg-[#f3eedf] font-black leading-none text-[#0c0c0d] shadow-[0_1px_0_rgba(0,0,0,0.35),inset_0_-2px_0_rgba(0,0,0,0.08)] ${
        ring ? "ring-2 ring-ball" : ""
      } ${className}`}
      style={{ fontSize: board ? "3.9cqw" : "clamp(1.1rem, 6vw, 1.7rem)", ...style }}
      {...rest}
    >
      <span className={blank ? "text-ball" : ""}>{l === "?" ? "" : l}</span>
      {!blank && l !== "?" && (
        <span
          className="absolute font-bold text-[#0c0c0d]/60"
          style={{ fontSize: board ? "1.7cqw" : "0.55rem", right: "9%", bottom: "5%" }}
        >
          {VALUES[l]}
        </span>
      )}
    </span>
  );
}

import { ScrabbleApp } from "../../components/scrabble/ScrabbleApp";

export const metadata = {
  title: "Berlin Scrabble",
  description: "Play Scrabble against the computer, or pass the phone around with friends.",
};

export default function Page() {
  return <ScrabbleApp />;
}

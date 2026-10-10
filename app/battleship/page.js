import { BattleshipApp } from "../../components/battleship/BattleshipApp";

export const metadata = {
  title: "Berlin Battleship",
  description: "Battleship: hide your fleet, hunt theirs. Play the computer or a friend online.",
};

export default function Page() {
  return <BattleshipApp />;
}

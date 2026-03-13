import { difficultyLabel, toDisplayDifficulty } from "../lib/difficulty";

export function DifficultyBadge({ score }: { score: number }) {
  const display = toDisplayDifficulty(score);
  const grade = difficultyLabel(display);
  const tone = display <= 40 ? "green" : display <= 80 ? "blue" : "purple";
  return <span className={`badge ${tone}`}>{grade}</span>;
}

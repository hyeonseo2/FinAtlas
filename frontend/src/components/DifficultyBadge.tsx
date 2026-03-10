export function DifficultyBadge({ score }: { score: number }) {
  const grade = score >= 85 ? "매우 쉬움" : score >= 70 ? "쉬움" : score >= 55 ? "보통" : score >= 40 ? "어려움" : "매우 어려움";
  const tone = score >= 70 ? "green" : score >= 40 ? "blue" : "purple";
  return <span className={`badge ${tone}`}>{score}점 ({grade})</span>;
}
